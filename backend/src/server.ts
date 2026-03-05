// src/server.ts
import { config } from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk";
import { kaolin } from "@arkiv-network/sdk/chains";
import { stringToPayload } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";
import { privateKeyToAccount } from "viem/accounts";

config({ path: ".env" });

const APP_ID = "arkiv-events";

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` | undefined;
if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY in .env");

const account = privateKeyToAccount(PRIVATE_KEY);

const walletClient = createWalletClient({
  chain: kaolin,
  transport: http(),
  account,
});

const publicClient = createPublicClient({
  chain: kaolin,
  transport: http("https://kaolin.hoodi.arkiv.network/rpc"),
});

function payloadJson(obj: unknown) {
  return stringToPayload(JSON.stringify(obj));
}

type CreateEventBody = {
  title: string;
  city: string;
  startAtISO: string;
  category?: string;
  locationType?: "in-person" | "online";
  capacity?: number;
  tags?: string[];
};

async function createEvent(e: CreateEventBody) {
  const payload = {
    title: e.title,
    city: e.city,
    startAt: e.startAtISO,
    category: e.category ?? "general",
    locationType: e.locationType ?? "in-person",
    capacity: e.capacity ?? 0,
    tags: e.tags ?? [],
    organizer: account.address,
  };

  const { entityKey } = await walletClient.createEntity({
    payload: payloadJson(payload),
    contentType: "application/json",
    attributes: [
      { key: "app", value: APP_ID },
      { key: "type", value: "event" },
      { key: "title", value: e.title },
      { key: "city", value: e.city },
      { key: "startAt", value: e.startAtISO },
      { key: "category", value: e.category ?? "general" },
      { key: "locationType", value: e.locationType ?? "in-person" },
      { key: "status", value: "upcoming" },
      { key: "tags", value: (e.tags ?? []).join(",") },
      { key: "capacity", value: String(e.capacity ?? 0) },
    ],
    expiresIn: 60 * 60 * 24 * 30,
  });

  return entityKey;
}

async function listMyEventsByCity(city: string) {
  const res = await publicClient
    .buildQuery()
    .where([eq("app", APP_ID), eq("type", "event"), eq("city", city), eq("status", "upcoming")])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  // Devolvemos payload como texto para simplificar
  return res.entities.map((e) => ({
    key: e.key,
    payloadText: e.toText(),
    attributes: e.attributes,
  }));
}

type CreateRSVPBody = {
  eventKey: string;
  status?: "going" | "canceled";
};

async function createRSVP(b: CreateRSVPBody) {
  const status = b.status ?? "going";
  const nowISO = new Date().toISOString();

  const payload = {
    eventKey: b.eventKey,
    attendee: account.address,
    status,
    createdAt: nowISO,
  };

  const { entityKey } = await walletClient.createEntity({
    payload: payloadJson(payload),
    contentType: "application/json",
    attributes: [
      { key: "app", value: APP_ID },
      { key: "type", value: "rsvp" },
      { key: "eventKey", value: b.eventKey },
      { key: "attendee", value: account.address },
      { key: "status", value: status },
      { key: "createdAt", value: nowISO },
    ],
    expiresIn: 60 * 60 * 24 * 30,
  });

  return entityKey;
}

async function listRSVPsForEvent(eventKey: string) {
  const res = await publicClient
    .buildQuery()
    .where([eq("app", APP_ID), eq("type", "rsvp"), eq("eventKey", eventKey)])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return res.entities.map((e) => ({
    key: e.key,
    payloadText: e.toText(),
    attributes: e.attributes,
  }));
}

async function listAttendanceForEvent(eventKey: string) {
  const res = await publicClient
    .buildQuery()
    .where([eq("app", APP_ID), eq("type", "attendance"), eq("eventKey", eventKey)])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return res.entities.map((e) => ({
    key: e.key,
    payloadText: e.toText(),
    attributes: e.attributes,
  }));
}

type CheckInBody = {
  eventKey: string;
  attendee: `0x${string}`; // wallet address
};

async function checkIn(b: CheckInBody) {
  const nowISO = new Date().toISOString();

  const payload = {
    eventKey: b.eventKey,
    attendee: b.attendee,
    checkedInAt: nowISO,
    checkedInBy: account.address,
  };

  const { entityKey } = await walletClient.createEntity({
    payload: payloadJson(payload),
    contentType: "application/json",
    attributes: [
      { key: "app", value: APP_ID },
      { key: "type", value: "attendance" },
      { key: "eventKey", value: b.eventKey },
      { key: "attendee", value: b.attendee },
      { key: "checkedInAt", value: nowISO },
    ],
    expiresIn: 60 * 60 * 24 * 365,
  });

  return entityKey;
}

const app = new Hono();

app.get("/rsvps", async (c) => {
  const eventKey = c.req.query("eventKey");
  if (!eventKey) return c.json({ error: "eventKey query param is required" }, 400);

  const rsvps = await listRSVPsForEvent(eventKey);
  return c.json({ rsvps });
});

app.get("/attendance", async (c) => {
  const eventKey = c.req.query("eventKey");
  if (!eventKey) return c.json({ error: "eventKey query param is required" }, 400);

  const attendance = await listAttendanceForEvent(eventKey);
  return c.json({ attendance });
});

app.get("/", (c) => c.json({ ok: true, app: APP_ID, address: account.address }));

app.post("/events", async (c) => {
  const body = await c.req.json<CreateEventBody>();
  if (!body?.title || !body?.city || !body?.startAtISO) {
    return c.json({ error: "title, city, startAtISO are required" }, 400);
  }
  const key = await createEvent(body);
  return c.json({ eventKey: key });
});

app.get("/events", async (c) => {
  const city = c.req.query("city");
  if (!city) return c.json({ error: "city query param is required" }, 400);
  const events = await listMyEventsByCity(city);
  return c.json({ events });
});

app.post("/rsvp", async (c) => {
  const body = await c.req.json<CreateRSVPBody>();
  if (!body?.eventKey) return c.json({ error: "eventKey is required" }, 400);
  const key = await createRSVP(body);
  return c.json({ rsvpKey: key });
});

app.post("/checkin", async (c) => {
  const body = await c.req.json<CheckInBody>();
  if (!body?.eventKey || !body?.attendee) {
    return c.json({ error: "eventKey and attendee are required" }, 400);
  }
  const key = await checkIn(body);
  return c.json({ attendanceKey: key });
});

serve({ fetch: app.fetch, port: 8787 });
console.log("✅ API running on http://localhost:8787");
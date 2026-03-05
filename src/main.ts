// src/main.ts
import { config } from "dotenv";
import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk";
import { kaolin } from "@arkiv-network/sdk/chains";
import { stringToPayload } from "@arkiv-network/sdk/utils";
import { eq } from "@arkiv-network/sdk/query";
import { privateKeyToAccount } from "viem/accounts";

config({ path: ".env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
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

type EventInput = {
  title: string;
  city: string;
  startAtISO: string;
  category?: string;
  tags?: string[];
};

function payloadForEvent(e: EventInput) {
  const obj = {
    title: e.title,
    city: e.city,
    startAt: e.startAtISO,
    category: e.category ?? "general",
    tags: e.tags ?? [],
  };
  return stringToPayload(JSON.stringify(obj));
}

async function createEvent(e: EventInput) {
  const { entityKey } = await walletClient.createEntity({
    payload: payloadForEvent(e),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "event" },
      { key: "title", value: e.title },
      { key: "city", value: e.city },
      { key: "startAt", value: e.startAtISO },
      { key: "category", value: e.category ?? "general" },
      { key: "status", value: "upcoming" },
      // IMPORTANT: single key (no duplicates)
      { key: "tags", value: (e.tags ?? []).join(",") },
    ],
    expiresIn: 60 * 60 * 24 * 30,
  });

  return entityKey;
}

async function listEventsByCity(city: string) {
  const res = await publicClient
    .buildQuery()
    .where([eq("type", "event"), eq("city", city), eq("status", "upcoming")])
    .withAttributes(true)
    .withPayload(true)
    .fetch();

  return res.entities;
}

function safeJsonParse<T = unknown>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

async function main() {
  const eventKey = await createEvent({
    title: "Arkiv Meetup BA",
    city: "Buenos Aires",
    startAtISO: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    category: "meetup",
    tags: ["web3", "arkiv", "devconnect"],
  });

  console.log("Created event entity:", eventKey);

  const city = "Buenos Aires";
  const events = await listEventsByCity(city);

  console.log(`Found ${events.length} upcoming events in ${city}`);

  for (const e of events) {
    console.log("----");
    console.log("key:", e.key);
    console.log("contentType:", e.contentType);

    const text = e.toText();
    const json = safeJsonParse<Record<string, unknown>>(text);

    console.log("payloadText:", text);
    if (json) console.log("payloadJson:", json);

    console.log("attributes:", e.attributes);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
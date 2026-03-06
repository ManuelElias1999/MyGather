import React from "react";
import { Check } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

type Plan = {
  name: string;
  price: string;
  subtitle: string;
  highlight?: boolean;
  features: string[];
  cta: string;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    subtitle: "For small community meetups",
    features: [
      "Create up to 3 events / month",
      "Up to 200 RSVPs / month",
      "Basic event pages",
      "Public discovery by city",
      "Wallet connect for attendee identity",
    ],
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$19/mo",
    subtitle: "Best for active organizers",
    highlight: true,
    features: [
      "Unlimited events",
      "20,000 gasless actions / month (RSVP + Check-in)",
      "Organizer dashboard (basic analytics)",
      "Branded event pages",
      "CSV export (RSVPs + Attendance)",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "For conferences & large communities",
    features: [
      "Custom gasless credits + SLA",
      "Team roles + multi-organizer workspaces",
      "Advanced analytics + integrations",
      "Custom domain + branding",
      "Spam prevention + allowlists",
      "Onchain / verifiable attendance add-ons",
    ],
    cta: "Contact us",
  },
];

export default function Pricing() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <Badge className="bg-blue-600 hover:bg-blue-700">Business Model</Badge>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">Pricing plans</h1>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
          MyGather is powered by Arkiv. We offer a smooth experience with a gasless relayer,
          so attendees can RSVP and check-in without needing ETH for gas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card
            key={p.name}
            className={`border-slate-200 shadow-sm ${
              p.highlight ? "ring-2 ring-blue-600 shadow-lg" : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{p.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">{p.subtitle}</p>
                </div>
                {p.highlight && (
                  <Badge className="bg-blue-600 hover:bg-blue-700">Most popular</Badge>
                )}
              </div>

              <div className="mt-5">
                <div className="text-3xl font-bold text-slate-900">{p.price}</div>
              </div>

              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-slate-700">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`mt-6 w-full ${p.highlight ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                variant={p.highlight ? "default" : "outline"}
                onClick={() => alert("Demo: pricing only")}
              >
                {p.cta}
              </Button>

              <p className="mt-3 text-xs text-slate-500">
                Note: In this MVP, gasless actions are paid by the backend relayer wallet.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 text-center text-sm text-slate-600">
        Want a fully trustless version? Next step: users sign actions (EIP-712 / SIWE) and the relayer
        verifies signatures before writing to Arkiv.
      </div>
    </div>
  );
}
import React from "react";
import { Link, useLocation } from "react-router";
import { Button } from "./ui/button";
import { useWallet } from "../../hooks/useWallet";

function short(a: string) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

export default function Navbar() {
  const location = useLocation();
  const { address, isConnecting, connect, disconnect } = useWallet();

  const onConnect = async () => {
    try {
      await connect();
    } catch (e: any) {
      alert(e?.message ?? "Failed to connect wallet");
    }
  };

  const isDiscover = location.pathname.startsWith("/discover");
  const isCreate = location.pathname.startsWith("/create");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
            <span className="text-blue-600 font-bold">✦</span>
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-900">MyGather</div>
            <div className="text-xs text-slate-500 -mt-0.5">powered by Arkiv</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          <Link
            to="/discover"
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              isDiscover ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Discover Events
          </Link>
          <Link
            to="/pricing"
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              location.pathname.startsWith("/pricing")
                ? "bg-blue-50 text-blue-700"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Pricing
          </Link>
          <Link
            to="/create"
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              isCreate ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Create Event
          </Link>
        </nav>

        {/* Wallet */}
        <div className="ml-auto flex items-center gap-2">
          {address ? (
            <>
              <span className="text-sm font-mono text-slate-700">{short(address)}</span>
              <Button variant="outline" onClick={disconnect}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={onConnect} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
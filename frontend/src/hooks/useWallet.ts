import { useEffect, useState } from "react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // restore from localStorage
    const saved = localStorage.getItem("walletAddress");
    if (saved) setAddress(saved);

    // listen changes
    const eth = window.ethereum;
    if (!eth?.on) return;

    const onAccountsChanged = (accounts: string[]) => {
      const a = accounts?.[0] ?? null;
      setAddress(a);
      if (a) localStorage.setItem("walletAddress", a);
      else localStorage.removeItem("walletAddress");
    };

    eth.on("accountsChanged", onAccountsChanged);
    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
    };
  }, []);

  const connect = async () => {
    const eth = window.ethereum;
    if (!eth?.request) {
      throw new Error("No wallet detected. Install MetaMask (or a compatible wallet).");
    }
    setIsConnecting(true);
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      const a = accounts?.[0] ?? null;
      setAddress(a);
      if (a) localStorage.setItem("walletAddress", a);
      return a;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    // Wallets don't truly "disconnect" programmatically; we just clear local state
    setAddress(null);
    localStorage.removeItem("walletAddress");
  };

  return { address, isConnecting, connect, disconnect };
}
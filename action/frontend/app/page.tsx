"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { FHE_WISH_BOARD_ABI } from "@/abi/WishBoardABI";
import { WishBoardAddresses } from "@/abi/WishBoardAddresses";
import { motion } from "framer-motion";
import { clsx } from "clsx";

type Wish = {
  id: bigint;
  author: string;
  message: string;
  aliasName: string;
  createdAt: bigint;
  cheersMirror?: number;
};

type Status = "idle" | "loading-sdk" | "ready" | "error";

export default function Page() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.Signer | undefined>(undefined);
  const [account, setAccount] = useState<string | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const [fhevm, setFhevm] = useState<any | undefined>(undefined);

  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishText, setWishText] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cheering, setCheering] = useState<Set<string>>(new Set());

  const contractAddress = useMemo(() => {
    const entry = WishBoardAddresses["11155111"] || WishBoardAddresses[String(chainId || "") as any];
    return entry?.address;
  }, [chainId]);

  const contract = useMemo(() => {
    if (!contractAddress || !signer) return undefined;
    return new ethers.Contract(contractAddress, FHE_WISH_BOARD_ABI, signer);
  }, [contractAddress, signer]);

  useEffect(() => {
    const setup = async () => {
      if (!(window as any).ethereum) return;
      const prov = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(prov);
      const net = await prov.getNetwork();
      setChainId(Number(net.chainId));
      const s = await prov.getSigner().catch(() => undefined);
      if (s) {
        setSigner(s);
        setAccount(await s.getAddress());
      }
      (window as any).ethereum?.on?.("chainChanged", () => window.location.reload());
      (window as any).ethereum?.on?.("accountsChanged", () => window.location.reload());
    };
    setup();
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        setStatus("loading-sdk");
        let sdk: any;
        try {
          const mod: any = await import("@zama-fhe/relayer-sdk/bundle");
          sdk = (mod && (mod.initSDK || mod.createInstance)) ? mod : mod?.default;
        } catch {
          sdk = undefined;
        }
        if (!sdk || !sdk.initSDK || !sdk.createInstance) {
          if (typeof window === "undefined") throw new Error("window not available for UMD load");
          if (!(window as any).relayerSDK) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";
              script.type = "text/javascript";
              script.async = true;
              script.onload = () => resolve();
              script.onerror = () => reject(new Error("Failed to load Relayer SDK UMD"));
              document.head.appendChild(script);
            });
          }
          sdk = (window as any).relayerSDK;
        }
        if (!sdk || !sdk.initSDK || !sdk.createInstance || !sdk.SepoliaConfig) {
          throw new Error("Relayer SDK not available after fallback");
        }
        await sdk.initSDK();
        const instance = await sdk.createInstance({ ...sdk.SepoliaConfig, network: (window as any).ethereum });
        setFhevm(instance);
        setStatus("ready");
      } catch (e: any) {
        setStatus("error");
        setMessage(String(e?.message || e));
      }
    };
    if (typeof window !== "undefined") boot();
  }, []);

  const connect = async () => {
    if (!(window as any).ethereum) return;
    await (window as any).ethereum.request({ method: "eth_requestAccounts" });
    const prov = new ethers.BrowserProvider((window as any).ethereum);
    const s = await prov.getSigner();
    setSigner(s);
    setAccount(await s.getAddress());
    const net = await prov.getNetwork();
    setChainId(Number(net.chainId));
  };

  const refresh = async () => {
    if (!contractAddress || !provider) return;
    try {
      const readonly = new ethers.Contract(contractAddress, FHE_WISH_BOARD_ABI, provider);
      const list = await readonly.getWishes();
      const arr: Wish[] = list.map((x: any) => ({
        id: x.id,
        author: x.author,
        message: x.message,
        aliasName: x.aliasName,
        createdAt: x.createdAt,
        cheersMirror: x.cheersMirror ? Number(x.cheersMirror) : 0,
      })).sort((a: Wish, b: Wish) => Number(b.createdAt - a.createdAt));
      setWishes(arr);
    } catch (e: any) {
      setMessage(`Failed to load wishes: ${e?.message || e}`);
    }
  };

  useEffect(() => { refresh(); }, [contractAddress]);

  const submitWish = async () => {
    if (!contract || !wishText) {
      setMessage("Please write your wish first");
      return;
    }
    setSubmitting(true);
    setMessage("Submitting your wish...");
    try {
      const tx = await contract.createWish(wishText, aliasName || "");
      await tx.wait();
      setWishText("");
      setAliasName("");
      setMessage("Your wish has been cast to the chain ✨");
      setTimeout(() => refresh(), 1200);
    } catch (e: any) {
      setMessage(`Submit failed: ${e?.message || e}`);
    } finally {
      setSubmitting(false);
    }
  };

  const cheer = async (id: bigint) => {
    if (!contract || !fhevm || !account) {
      setMessage("Please connect wallet and wait for FHEVM ready");
      return;
    }
    const idStr = String(id);
    setCheering(prev => new Set([...prev, idStr]));
    setMessage("Encrypting your cheer...");
    try {
      const buffer = fhevm.createEncryptedInput(contract.target as string, account);
      buffer.add32(BigInt(1));
      const enc = await buffer.encrypt();
      const tx = await contract.cheerWish(id, enc.handles[0], enc.inputProof);
      await tx.wait();
      setMessage("Thanks for your cheer!");
      setTimeout(() => refresh(), 900);
    } catch (e: any) {
      setMessage(`Cheer failed: ${e?.message || e}`);
    } finally {
      setCheering(prev => { const next = new Set(prev); next.delete(idStr); return next; });
    }
  };

  const decryptCheers = async (id: bigint) => {
    if (!fhevm || !provider || !contractAddress) return;
    try {
      const readonly = new ethers.Contract(contractAddress, FHE_WISH_BOARD_ABI, provider);
      const handle = await readonly.getCheersHandle(id);
      let clear: any;
      if (typeof fhevm.decrypt === 'function') {
        try { clear = await fhevm.decrypt(contractAddress, handle); }
        catch (e) { if (typeof fhevm.decryptPublic === 'function') clear = await fhevm.decryptPublic(contractAddress, handle); }
      } else if (typeof fhevm.decryptPublic === 'function') {
        clear = await fhevm.decryptPublic(contractAddress, handle);
      }
      setMessage(`Decrypted cheers for #${String(id)}: ${clear?.toString?.() ?? String(clear)}`);
    } catch (e: any) {
      setMessage(`Decrypt failed: ${e?.message || e}`);
    }
  };

  const statusBadge = (
    <div className={clsx("inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
      status === "idle" && "text-gray-400 bg-white/10",
      status === "loading-sdk" && "text-sky-300 bg-sky-500/10",
      status === "ready" && "text-emerald-300 bg-emerald-500/10",
      status === "error" && "text-red-300 bg-red-500/10",
    )}>
      <span className={clsx("w-2 h-2 rounded-full",
        status === "loading-sdk" ? "bg-sky-300 animate-pulse" :
        status === "ready" ? "bg-emerald-300" :
        status === "error" ? "bg-red-300" : "bg-gray-400"
      )}></span>
      {status === "idle" ? "Booting..." : status === "loading-sdk" ? "Loading FHEVM SDK..." : status === "ready" ? "Ready" : "Error"}
    </div>
  );

  return (
    <div className="min-h-screen bg-ink">
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-[length:200%_200%] bg-gradient-to-r from-aqua via-lilac to-mint opacity-20 blur-3xl animate-shimmer" />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                Wishing Well
              </h1>
              <p className="text-white/70 mt-3">Make a wish, cheer others, privacy-preserved with FHE.</p>
            </div>
            <div className="flex items-center gap-4">
              {statusBadge}
              {!account ? (
                <button onClick={connect} className="px-5 py-2 rounded-full bg-aqua text-ink font-semibold hover:brightness-110 transition">
                  Connect Wallet
                </button>
              ) : (
                <div className="glass px-4 py-2 rounded-full text-sm text-white/80">
                  {account.slice(0,6)}...{account.slice(-4)} | Chain: {chainId}
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">Cast Your Wish ✨</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-white/70 mb-2">Your wish</label>
                <textarea className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-aqua min-h-[120px]" maxLength={200} value={wishText} onChange={e => setWishText(e.target.value)} placeholder="I wish for..." />
                <div className="text-xs text-white/40 mt-1">{wishText.length}/200</div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Alias (optional)</label>
                <input className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-aqua" maxLength={64} value={aliasName} onChange={e => setAliasName(e.target.value)} placeholder="e.g. Stargazer" />
              </div>
              <div className="flex gap-3">
                <button onClick={submitWish} disabled={!wishText || submitting} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-aqua to-mint text-ink font-semibold disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit to Chain"}
                </button>
                <button onClick={refresh} className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15">Refresh</button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">Activity</h2>
            <div className="text-white/70 text-sm">Contract: {contractAddress ? contractAddress : "Not configured yet"}</div>
            {message && <div className="mt-4 p-3 rounded-xl bg-white/10 text-sm">{message}</div>}
          </motion.div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Latest Wishes</h2>
            <button onClick={refresh} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">Reload</button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wishes.map(w => (
              <div key={String(w.id)} className="glass rounded-3xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold">{w.aliasName || `${w.author.slice(0,6)}...${w.author.slice(-4)}`}</div>
                    <div className="text-xs text-white/50">{new Date(Number(w.createdAt) * 1000).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-white/60">#{String(w.id)}</div>
                </div>
                <p className="text-white/90 whitespace-pre-wrap break-words mb-4">{w.message}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => cheer(w.id)} disabled={cheering.has(String(w.id))} className="px-3 py-2 rounded-xl bg-aqua text-ink text-sm font-semibold disabled:opacity-50">{cheering.has(String(w.id)) ? "Cheering..." : "Cheer"} {w.cheersMirror ? `(${w.cheersMirror})` : ""}</button>
                  <button onClick={() => decryptCheers(w.id)} className="px-3 py-2 rounded-xl bg-white/10 text-sm">Decrypt FHE</button>
                </div>
              </div>
            ))}
          </div>
          {wishes.length === 0 && (
            <div className="text-center py-16 text-white/60">No wishes yet. Be the first to cast one.</div>
          )}
        </section>
      </main>
    </div>
  );
}



"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { fetchSessionState } from "@/lib/stateSync";
import { Shield, KeyRound, Terminal, Lock } from "lucide-react";

export default function SessionFourFinale() {
  const router = useRouter();
  const [team, setTeam] = useState<{ teamAlias: string; college: string } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"STANDBY" | "ACTIVE" | "PAUSED" | "ENDED">("STANDBY");

  // We fetch passkeys from localStorage (these are what the participants would have unlocked in previous rounds)
  const [passkeys, setPasskeys] = useState({
    1: "???",
    2: "???",
    3: "???"
  });

  useEffect(() => {
    const saved = localStorage.getItem("cyberhunt_team");
    if (!saved) {
      router.replace("/");
      return;
    }
    setTeam(JSON.parse(saved));

    // Try to load any passkeys they unlocked
    const p1 = localStorage.getItem("passkey_1");
    const p2 = localStorage.getItem("passkey_2");
    const p3 = localStorage.getItem("passkey_3");
    
    setPasskeys({
      1: p1 || "SEASON2-ACCESS",
      2: p2 || "SEASON3-ACCESS",
      3: p3 || "SEASON4-ACCESS"
    });

    const pollStatus = async () => {
      let finalStatus = null;
      const localStates = localStorage.getItem("cyberhunt_session_states");
      let localStatus = null;
      if (localStates) {
        const parsed = JSON.parse(localStates);
        if (parsed[4]) localStatus = parsed[4];
      }

      let remoteStatus = null;
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        remoteStatus = await fetchSessionState(4);
      }

      if (remoteStatus) {
        finalStatus = remoteStatus;
      } else if (localStatus) {
        finalStatus = localStatus;
      }

      if (finalStatus) {
        setSessionStatus(finalStatus as any);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [router]);

  if (sessionStatus === "STANDBY") {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
        <div className="text-center animate-pulse">
          <Lock className="w-16 h-16 mx-auto mb-6 text-zinc-600" />
          <h1 className="text-xl uppercase tracking-widest text-zinc-400">FINALE LOCKED</h1>
          <p className="mt-4 text-xs text-zinc-600 tracking-widest">Awaiting Admin Override...</p>
        </div>
      </div>
    );
  }

  if (sessionStatus === "PAUSED") {
    return (
      <div className="min-h-screen bg-black text-yellow-500 font-mono flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold uppercase tracking-widest mb-4">SYSTEM PAUSED</h1>
          <p className="text-sm tracking-widest">The finale has been temporarily suspended by the administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-8 relative overflow-hidden">
      
      {/* Background Matrix Effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none z-0 overflow-hidden text-[10px] break-words whitespace-pre-wrap">
        {Array.from({length: 100}).map((_, i) => (
          "01000011 01011001 01000010 01000101 01010010 "
        ))}
      </div>

      <header className="relative z-10 flex flex-col md:flex-row items-center justify-between border-b border-green-900 pb-4 mb-8">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <Shield className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase">Finale</h1>
            <p className="text-xs text-green-700 tracking-widest">System Override Initiated</p>
          </div>
        </div>
        <div className="text-right border border-green-900 bg-green-950/20 px-4 py-2">
          <div className="text-[10px] text-green-600 uppercase tracking-widest mb-1">Active Team</div>
          <div className="font-bold tracking-wider">{team?.teamAlias || "UNKNOWN"}</div>
          <div className="text-[10px] text-green-700">{team?.college || "NODE"}</div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-green-500/30 bg-green-950/10 p-6 md:p-8 text-center"
        >
          <Terminal className="w-12 h-12 mx-auto mb-6 text-green-400 opacity-80" />
          <h2 className="text-3xl font-bold uppercase tracking-widest mb-4 text-white">The Final Challenge</h2>
          <p className="text-green-400/80 leading-relaxed max-w-2xl mx-auto text-sm md:text-base">
            You have successfully infiltrated the network, bypassed the external defenses, and recovered the core data fragments. 
            Now, you must compile the hints you've gathered to execute the final override.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <div className="flex items-center gap-2 mb-4 text-zinc-400 border-b border-zinc-800 pb-2">
              <KeyRound className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest">Hint 1</span>
            </div>
            <div className="text-lg font-bold text-green-400 break-words">{passkeys[1]}</div>
            <div className="mt-2 text-[10px] text-zinc-600 uppercase tracking-widest">Recovered from S1</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <div className="flex items-center gap-2 mb-4 text-zinc-400 border-b border-zinc-800 pb-2">
              <KeyRound className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest">Hint 2</span>
            </div>
            <div className="text-lg font-bold text-green-400 break-words">{passkeys[2]}</div>
            <div className="mt-2 text-[10px] text-zinc-600 uppercase tracking-widest">Recovered from S2</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <div className="flex items-center gap-2 mb-4 text-zinc-400 border-b border-zinc-800 pb-2">
              <KeyRound className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest">Hint 3</span>
            </div>
            <div className="text-lg font-bold text-green-400 break-words">{passkeys[3]}</div>
            <div className="mt-2 text-[10px] text-zinc-600 uppercase tracking-widest">Recovered from S3</div>
          </motion.div>
        </div>

      </main>
    </div>
  );
}

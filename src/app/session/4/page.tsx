"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, KeyRound, Terminal, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchSessionState } from "@/lib/stateSync";

export default function SessionFourFinale() {
  const router = useRouter();
  const [team, setTeam] = useState<{ teamAlias: string; college: string } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"STANDBY" | "ACTIVE" | "PAUSED" | "ENDED">("STANDBY");
  const [inputValue, setInputValue] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [masterPasskey, setMasterPasskey] = useState("OVERRIDE-INIT");

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
    const p4 = localStorage.getItem("passkey_4");
    
    setPasskeys({
      1: p1 || "SEASON2-ACCESS",
      2: p2 || "SEASON3-ACCESS",
      3: p3 || "SEASON4-ACCESS"
    });

    if (p4) setMasterPasskey(p4);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim().toUpperCase() === masterPasskey.toUpperCase()) {
      setIsSuccess(true);
      setErrorMsg("");
      // Mark as completed
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        const saved = localStorage.getItem("cyberhunt_team");
        if (saved) {
           const teamData = JSON.parse(saved);
           // eslint-disable-next-line @typescript-eslint/no-require-imports
           const { supabase } = require("@/lib/supabase");
           supabase.from('teams').update({ status: 'COMPLETED' }).eq('team_alias', teamData.teamAlias).then(() => {});
        }
      }
    } else {
      setErrorMsg("ACCESS DENIED: INCORRECT PASSKEY");
      setInputValue("");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden" style={{ perspective: '1500px' }}>
        
        {/* The Suitcase */}
        <motion.div 
          initial={{ y: 200, opacity: 0, rotateX: 20 }}
          animate={{ y: 0, opacity: 1, rotateX: 10 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative w-64 h-48 sm:w-80 sm:h-56 z-20"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Bottom Half of Suitcase */}
          <div className="absolute inset-0 bg-zinc-800 border-2 border-zinc-700 rounded-lg shadow-2xl flex items-center justify-center z-10" style={{ transform: 'translateZ(-10px)' }}>
            
            {/* The Tesseract */}
            <motion.div
              initial={{ y: 0, scale: 0.5, opacity: 0 }}
              animate={{ 
                y: [0, -100, -200, -250], 
                scale: [0.5, 1, 2, 50],
                rotateX: [0, 180, 360, 720],
                rotateY: [0, 180, 360, 720],
                opacity: [0, 1, 1, 1],
                filter: ["brightness(1)", "brightness(2)", "brightness(5)", "brightness(20)"]
              }}
              transition={{ 
                duration: 6, 
                times: [0, 0.4, 0.8, 1], 
                ease: "easeInOut",
                delay: 2 // Wait for suitcase to open
              }}
              onAnimationComplete={() => router.push('/leaderboard-wait')}
              className="absolute z-20 w-16 h-16 bg-blue-500/80 border-2 border-cyan-300 shadow-[0_0_50px_rgba(59,130,246,1)]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Inner glowing core of tesseract */}
              <div className="absolute inset-2 bg-white/50 border border-white shadow-[0_0_20px_#fff] animate-pulse"></div>
            </motion.div>

          </div>

          {/* Top Half of Suitcase (Lid) */}
          <motion.div
            initial={{ rotateX: 0 }}
            animate={{ rotateX: 115 }}
            transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
            className="absolute inset-0 bg-zinc-700 border-2 border-zinc-600 rounded-lg origin-bottom z-30 flex items-start justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Suitcase Handle */}
            <div className="w-16 h-4 border-2 border-zinc-500 rounded-t-md -mt-4 bg-zinc-800"></div>
            
            {/* Suitcase Latches */}
            <div className="absolute top-0 left-8 w-4 h-6 bg-zinc-900 border border-zinc-500 -mt-2 rounded-sm"></div>
            <div className="absolute top-0 right-8 w-4 h-6 bg-zinc-900 border border-zinc-500 -mt-2 rounded-sm"></div>
          </motion.div>
        </motion.div>

        {/* The White Blast Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 6 }}
          className="absolute inset-0 bg-white z-50 pointer-events-none"
        ></motion.div>

        <div className="absolute bottom-10 left-0 right-0 text-center z-10">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, delay: 0.5 }}
            className="text-green-500 font-mono text-sm tracking-widest uppercase"
          >
            Access Granted. Opening Secure Container...
          </motion.p>
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-xl mx-auto mt-12"
        >
          <form onSubmit={handleSubmit} className="border border-green-500/50 bg-black p-6 md:p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-4 text-xs font-bold tracking-widest text-green-500 border border-green-500/50">
              EXECUTE OVERRIDE
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs uppercase tracking-widest text-zinc-500 text-center">
                Enter Master Passkey
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
                className="w-full bg-zinc-900/50 border border-green-900 text-white font-mono text-center text-xl tracking-[0.2em] px-4 py-4 focus:border-green-500 focus:bg-zinc-900 outline-none transition-all uppercase"
                placeholder="XXXX-XXXX-XXXX"
              />
              {errorMsg && (
                <p className="text-red-500 text-xs font-bold text-center tracking-widest animate-pulse">{errorMsg}</p>
              )}
              <button
                type="submit"
                className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/50 py-4 font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-3"
              >
                Submit Override <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>

      </main>
    </div>
  );
}

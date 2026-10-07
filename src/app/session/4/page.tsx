"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, KeyRound, Terminal, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchSessionState, fetchSessionPasskey, fetchSessionPasskeyHint } from "@/lib/stateSync";

export default function SessionFourFinale() {
  const router = useRouter();
  const [team, setTeam] = useState<{ teamAlias: string; college: string } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"STANDBY" | "ACTIVE" | "PAUSED" | "ENDED">("STANDBY");
  const [timeLeft, setTimeLeft] = useState<number>(1500);
  const [inputValue, setInputValue] = useState("");
  const [passkeyHint, setPasskeyHint] = useState("All subsystems compromised. Awaiting final master override sequence to capture the flag.");
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [masterPasskey, setMasterPasskey] = useState("OVERRIDE-INIT");
  const [isSubmittingPasskey, setIsSubmittingPasskey] = useState(false);

  useEffect(() => {
    if (isSuccess || sessionStatus !== "ACTIVE") return;

    let storedRemaining = localStorage.getItem("session_4_timeleft");
    let initialRemaining = storedRemaining ? parseInt(storedRemaining) : 1500; // 25 minutes
    setTimeLeft(initialRemaining);

    const updateTimer = () => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setSessionStatus("ENDED");
          return 0;
        }
        const newTime = prev - 1;
        localStorage.setItem("session_4_timeleft", newTime.toString());
        return newTime;
      });
    };

    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, sessionStatus]);
  useEffect(() => {
    const currentSession = parseInt(localStorage.getItem("cyberhunt_current_session") || "1");
    if (currentSession !== 4) {
      router.replace(currentSession >= 5 ? "/leaderboard-wait" : `/session/${currentSession}`);
    }
  }, [router]);
  // We fetch passkeys from localStorage (these are what the participants would have unlocked in previous rounds)
  const [passkeys, setPasskeys] = useState({
    1: "???",
    2: "???",
    3: "???"
  });

  useEffect(() => {
    const isPreviousCompleted = localStorage.getItem("session_3_completed") === "true";
    if (!isPreviousCompleted) {
      router.replace("/session/3");
      return;
    }
    
    const saved = localStorage.getItem("cyberhunt_team");
    if (!saved) {
      router.replace("/");
      return;
    }
    setTeam(JSON.parse(saved));

    const loadHints = async () => {
      const p1 = await fetchSessionPasskey(1);
      const p2 = await fetchSessionPasskey(2);
      const p3 = await fetchSessionPasskey(3);
      const p4 = await fetchSessionPasskey(4);

      setPasskeys({
        1: p1 || localStorage.getItem("passkey_1") || "SEASON2-ACCESS",
        2: p2 || localStorage.getItem("passkey_2") || "SEASON3-ACCESS",
        3: p3 || localStorage.getItem("passkey_3") || "SEASON4-ACCESS"
      });

      if (p4 || localStorage.getItem("passkey_4")) {
        setMasterPasskey(p4 || localStorage.getItem("passkey_4") || "OVERRIDE-INIT");
      }

      const savedHint = await fetchSessionPasskeyHint(4);
      if (savedHint) {
        setPasskeyHint(savedHint);
      } else {
        const localHint = localStorage.getItem('passkey_hint_4');
        if (localHint) setPasskeyHint(localHint);
      }
    };
    loadHints();

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
        if (remoteStatus === "RESET") {
          localStorage.removeItem("cyberhunt_session_states");
          localStorage.removeItem("cyberhunt_current_session");
          localStorage.removeItem("session_4_completed");
          localStorage.removeItem("session_4_endtime");
          window.location.href = "/";
          return;
        }

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

  // Ping progress to admin dashboard
  useEffect(() => {
    const pingProgress = async () => {
      try {
        if (team) {
          const alias = team.teamAlias;
          if (alias) {
            await fetch('/api/state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'ping_progress', team_alias: alias, session: 4, question: 1 })
            });
          }
        }
      } catch (e) {}
    };
    
    pingProgress();
    const interval = setInterval(pingProgress, 3000);
    return () => clearInterval(interval);
  }, [team]);

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
          <h1 className="text-4xl font-bold uppercase tracking-widest mb-4">SYSTEM LOCKED</h1>
          <p className="text-sm tracking-widest">The finale has been temporarily locked by the administrator.</p>
        </div>
      </div>
    );
  }

  if (sessionStatus === "ENDED") {
    return (
      <div className="min-h-screen bg-black text-red-500 font-mono flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold uppercase tracking-widest mb-4">TIME EXPIRED</h1>
          <p className="text-sm tracking-widest">The final override window has closed.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPasskey) return;
    setIsSubmittingPasskey(true);
    const remotePasskey = await fetchSessionPasskey(4);
    const expectedPasskey = remotePasskey || localStorage.getItem("passkey_4") || "OVERRIDE-INIT";

    if (inputValue.trim().toUpperCase() === expectedPasskey.toUpperCase()) {
      setIsSuccess(true);
      setErrorMsg("");

      // Calculate Score
      let score = 10; // Final passkey score

      // Calculate time taken
      const timeleftStr = localStorage.getItem("session_4_timeleft");
      const timeleft = timeleftStr ? parseInt(timeleftStr) : 0;
      const timeTaken = 1500 - timeleft;

      try {
        const teamDataStr = localStorage.getItem("cyberhunt_team");
        if (teamDataStr) {
          const teamData = JSON.parse(teamDataStr);
          await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'submit_score', team_alias: teamData.teamAlias || teamData.team_alias, session: 4, score, time_taken: timeTaken })
          });
        }
      } catch (e) {}

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
    setIsSubmittingPasskey(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          onAnimationComplete={() => setTimeout(() => router.push('/leaderboard-wait'), 2000)}
          className="text-center"
        >
          <div className="w-24 h-24 bg-green-950/30 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold uppercase tracking-widest mb-4 shadow-[0_0_10px_#0f0]">Access Granted</h1>
          <p className="text-green-500/70 tracking-widest uppercase text-sm">System Override Successful. Redirecting...</p>
        </motion.div>
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
            <p className="text-xs text-green-700 tracking-widest flex items-center gap-4">
              System Override Initiated
            </p>
          </div>
        </div>
        <div className="text-right border border-green-900 bg-green-950/20 px-4 py-2">
          <div className="text-[10px] text-green-600 uppercase tracking-widest mb-1">Active Team</div>
          <div className="font-bold tracking-wider">{team?.teamAlias || "UNKNOWN"}</div>
          <div className="text-[10px] text-green-700">{team?.college || "NODE"}</div>
        </div>
      </header>

      {/* CORNER TIMER */}
      <div className="fixed top-8 right-8 z-50 pointer-events-none flex flex-col items-end">
        <div className="text-[10px] uppercase tracking-widest text-green-700 mb-1 font-bold">Time Remaining</div>
        <div className={`text-2xl font-mono font-black tracking-widest ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.2)]'}`}>
          {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <main className="relative z-10 max-w-4xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-green-500/30 bg-green-950/10 p-6 md:p-8 text-center"
        >
          <Terminal className="w-12 h-12 mx-auto mb-6 text-green-400 opacity-80" />
          <h2 className="text-3xl font-bold uppercase tracking-widest mb-4 text-white">The Final Challenge</h2>
          <p className="text-green-400/80 leading-relaxed max-w-2xl mx-auto text-sm md:text-base whitespace-pre-wrap">
            {passkeyHint}
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

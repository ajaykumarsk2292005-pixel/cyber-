"use client";

import { useEffect, useState } from "react";
import { Lock, Unlock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchSessionState } from "@/lib/stateSync";

export default function WaitingRoom() {
  const router = useRouter();
  
  const [team, setTeam] = useState<{ teamAlias: string; college: string; status: string } | null>(null);
  const [currentSession, setCurrentSession] = useState(1);
  const [sessionStatus, setSessionStatus] = useState<"STANDBY" | "ACTIVE" | "PAUSED" | "ENDED">("STANDBY");

  // Fetch Team Info from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("cyberhunt_team");
    if (saved) {
      const data = JSON.parse(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTeam({ ...data, status: "WAITING" });
    } else {
      router.push("/register"); // Go back if no team
    }

    const session = parseInt(localStorage.getItem("cyberhunt_current_session") || "1");
    setCurrentSession(session);
  }, [router]);

  // Poll for Session Status
  useEffect(() => {
    const pollStatus = async () => {
      let finalStatus = null;
      let localStatus = null;
      let remoteStatus = null;

      // 1. Fetch Local Storage
      const localStates = localStorage.getItem("cyberhunt_session_states");
      if (localStates) {
        const parsed = JSON.parse(localStates);
        if (parsed[currentSession]) {
          localStatus = parsed[currentSession];
        }
      }

      // 2. Fetch Supabase (using our stateSync bypass)
      remoteStatus = await fetchSessionState(currentSession);

      // 3. Smart Merge Strategy
      if (remoteStatus) {
        // If Supabase says STANDBY but our local admin dashboard set it to ACTIVE/PAUSED (meaning RLS blocked the DB update)
        // we trust localStatus for local testing. Otherwise we trust the database.
        if (remoteStatus === "STANDBY" && localStatus && localStatus !== "STANDBY") {
          finalStatus = localStatus;
        } else {
          finalStatus = remoteStatus;
        }
      } else if (localStatus) {
        finalStatus = localStatus;
      }

      if (finalStatus) {
        setSessionStatus(finalStatus as any);
      }
    };

    pollStatus(); // Initial fetch
    const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds
    
    // Listen for storage events (cross-tab sync for local testing)
    const handleStorage = () => pollStatus();
    window.addEventListener("storage", handleStorage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [currentSession]);

  const isUnlocked = sessionStatus === "ACTIVE";

  return (
    <div className="min-h-screen bg-transparent text-white font-mono flex flex-col p-8 relative overflow-hidden">
      
      {/* Navbar Minimal */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 w-full mb-8">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <span>CYBER<span className="text-zinc-500">HUNT</span></span>
        </div>
      </nav>

      {/* Top Center Welcome Message */}
      <div className="relative z-10 text-center mb-12">
        <h2 className="text-xl md:text-2xl font-mono uppercase tracking-widest text-zinc-400">
          Welcome Team <span className="text-white font-bold">{team?.teamAlias || "UNKNOWN"}</span>
        </h2>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col justify-center space-y-12 relative z-10">
        
        <div>
          <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-widest mb-4 text-center">
            Registration <span className="text-zinc-500">Successful</span>
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed text-center">
            Your team tensor has been recorded. Please wait until the Admin initiates the global override. 
            Do not close this secure channel.
          </p>
        </div>

        {/* Monitor Wrapper */}
        <div className="relative p-3 rounded-2xl bg-zinc-950 border-4 border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.8)_inset,0_20px_50px_rgba(0,0,0,0.8)] max-w-xl mx-auto w-full">
          {/* Bevel effect */}
          <div className="absolute inset-0 rounded-xl border border-zinc-800 pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0.9 }}
            animate={{ 
              opacity: [0.95, 1, 0.9, 1, 0.98, 1],
              textShadow: ["0 0 4px rgba(255,255,255,0.1)", "0 0 0px rgba(0,0,0,0)"]
            }}
            transition={{ 
              duration: 0.15, 
              repeat: Infinity, 
              repeatType: "mirror",
              repeatDelay: 4 // Removed Math.random() to fix hydration mismatch
            }}
            className="p-8 border border-zinc-800 bg-[#030303] relative overflow-hidden rounded-xl shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"
          >
            {/* CRT Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 opacity-40 mix-blend-overlay" />
            
            {/* Screen Glare */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-xl z-40" />

            {/* Tech Corners */}
            <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-zinc-600 z-10"></div>
            <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-zinc-600 z-10"></div>
            <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-zinc-600 z-10"></div>
            <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-zinc-600 z-10"></div>
            
            {/* Inner Content */}
            <div className="relative z-20">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs uppercase tracking-widest text-zinc-500">Season {currentSession} Status</span>
                <span className={`${isUnlocked ? 'text-green-500' : 'text-yellow-500'} text-xs font-bold ${!isUnlocked ? 'animate-pulse' : ''} flex items-center gap-2`}>
                  <div className={`w-2 h-2 ${isUnlocked ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]'} rounded-full`}></div> 
                  {sessionStatus}
                </span>
              </div>

              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-6">
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {isUnlocked ? (
                      <Unlock className="w-16 h-16 text-green-500 mx-auto drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                    ) : (
                      <Lock className="w-16 h-16 text-zinc-700 mx-auto" />
                    )}
                  </motion.div>
                  <p className={`text-sm uppercase tracking-widest ${isUnlocked ? 'text-green-500 font-bold' : 'text-zinc-500'}`}>
                    {isUnlocked ? 'Override Granted' : 'Locked by Administrator'}
                  </p>
                </div>
              </div>

              <button 
                disabled={!isUnlocked}
                onClick={() => router.push(`/session/${currentSession}`)}
                className={`w-full py-4 flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-bold transition-all ${
                  isUnlocked 
                    ? "bg-green-500 text-black hover:bg-green-400 cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                }`}
              >
                Enter Cyber Hunt <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>

      </main>
    </div>
  );
}

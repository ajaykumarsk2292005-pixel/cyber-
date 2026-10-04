"use client";

import { useState, useEffect } from "react";
import { Shield, Terminal, ArrowRight, Lock, CheckCircle2, AlertTriangle, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getQuestions, Question } from "@/lib/questions";
import { fetchSessionState } from "@/lib/stateSync";

export default function SessionOne() {
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>([]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [passkeyError, setPasskeyError] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<"STANDBY" | "ACTIVE" | "PAUSED" | "ENDED">("ACTIVE");

  useEffect(() => {
    const pollStatus = async () => {
      let finalStatus = null;
      let localStatus = null;
      let remoteStatus = null;

      const localStates = localStorage.getItem("cyberhunt_session_states");
      if (localStates) {
        const parsed = JSON.parse(localStates);
        if (parsed[1]) {
          localStatus = parsed[1];
        }
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        remoteStatus = await fetchSessionState(1);
      }

      if (remoteStatus) {
        if (remoteStatus === "RESET") {
          localStorage.removeItem("cyberhunt_session_states");
          localStorage.removeItem("cyberhunt_current_session");
          localStorage.removeItem("session_1_completed");
          window.location.href = "/";
          return;
        }

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
    pollStatus();
    
    // Load questions dynamically
    setQuestions(getQuestions(1));

    const interval = setInterval(pollStatus, 2000);
    const handleStorage = () => { pollStatus(); setQuestions(getQuestions(1)); };
    window.addEventListener("storage", handleStorage);
    return () => { clearInterval(interval); window.removeEventListener("storage", handleStorage); };
  }, []);

  const currentQ = questions[currentIndex];

  const handleOptionSelect = (option: string, index: number) => {
    setSubmittedAnswers(prev => [...prev, option]);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      // You could evaluate the score here by comparing submittedAnswers with questions.answer
    }
  };

  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPasskey = localStorage.getItem("passkey_1") || "SEASON2-ACCESS";
    
    if (passkey.toUpperCase() === expectedPasskey.toUpperCase()) { 
      localStorage.setItem("cyberhunt_current_session", "2");
      router.push("/waiting"); 
    } else {
      setPasskeyError(true);
      setTimeout(() => setPasskeyError(false), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-mono text-white selection:bg-zinc-800 p-8 relative overflow-hidden">
      
      {/* Session State Overlays */}
      <AnimatePresence>
        {(sessionStatus === "PAUSED" || sessionStatus === "ENDED") && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
          >
            <div className="max-w-md w-full bg-zinc-950 border-4 border-zinc-900 p-8 text-center space-y-6">
              {sessionStatus === "PAUSED" ? (
                <>
                  <Pause className="w-16 h-16 text-yellow-500 mx-auto animate-pulse" />
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-yellow-500">SYSTEM LOCKED</h2>
                  <p className="text-zinc-400 text-sm">The administrator has paused the session. Please hold your position.</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-red-500">Session Terminated</h2>
                  <p className="text-zinc-400 text-sm">This session has been ended by the administrator.</p>
                  <button onClick={() => { localStorage.setItem("cyberhunt_current_session", "2"); router.push("/waiting"); }} className="mt-4 px-6 py-3 bg-red-500 text-black text-xs font-bold uppercase hover:bg-red-400 transition-all">
                    Return to Waiting Room
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between w-full mb-12">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <span>CYBER<span className="text-zinc-500">HUNT</span></span>
        </div>
        <div className="text-zinc-500 text-xs tracking-widest uppercase">
          {isCompleted ? "SEASON_1 :: COMPLETE" : `SEASON_1 :: PHASE_${currentIndex + 1}`}
        </div>
      </nav>

      <main className="flex-1 w-full max-w-3xl mx-auto flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          
          {/* QUESTION PHASE */}
          {!isCompleted && currentQ && (
            <motion.div
              key={`question-${currentIndex}`} // Force re-render animation on change
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full"
            >
              <div className="mb-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-black border border-zinc-700 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  {currentIndex + 1}
                </div>
                <div>
                  <h2 className="text-2xl tracking-widest uppercase font-bold text-zinc-100">Infiltration</h2>
                  <p className="text-zinc-500 text-xs tracking-widest uppercase">Challenge {currentIndex + 1} of 10</p>
                </div>
              </div>

              <div className="p-8 bg-black border border-zinc-800 shadow-2xl relative mb-8 min-h-[160px] flex items-center justify-center text-center">
                {/* Tech corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-zinc-500"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-zinc-500"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-zinc-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-zinc-500"></div>
                
                <p className="text-xl leading-relaxed text-zinc-200">
                  {currentQ.text}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(option, idx)}
                    className="p-6 border transition-all text-left flex items-center gap-4 group bg-black border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900 text-zinc-300"
                  >
                    <span className="text-xs font-bold tracking-widest uppercase text-zinc-600 group-hover:text-zinc-400">
                      {String.fromCharCode(65 + idx)} /
                    </span>
                    <span className="tracking-widest uppercase">{option}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* PASSKEY PHASE */}
          {isCompleted && (
            <motion.div
              key="passkey-phase"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 bg-green-950/30 border border-green-500/50 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-4xl font-bold uppercase tracking-widest mb-4">Season 1 Cleared</h1>
              <p className="text-zinc-500 tracking-widest max-w-md mx-auto mb-12">
                All logic gates bypassed. The inner network is sealed. Awaiting Season 2 authentication passkey from Administrator.
              </p>

              <form onSubmit={handlePasskeySubmit} className="w-full max-w-md mx-auto">
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${passkeyError ? 'text-red-500' : 'text-zinc-600'}`} />
                  <input 
                    type="text"
                    placeholder="ENTER SEASON 2 PASSKEY"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    className={`w-full pl-12 pr-6 py-4 bg-black border ${passkeyError ? 'border-red-500 text-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-zinc-700 text-white focus:border-zinc-400 focus:shadow-[0_0_15px_rgba(255,255,255,0.1)]'} outline-none tracking-widest uppercase transition-all text-center placeholder:text-zinc-800`}
                  />
                  {passkeyError && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <button 
                  type="submit"
                  className="w-full mt-4 py-4 bg-zinc-200 text-black font-bold tracking-widest uppercase hover:bg-white transition-all active:scale-[0.98]"
                >
                  Unlock Season 2
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

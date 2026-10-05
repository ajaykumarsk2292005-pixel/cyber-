"use client";

import { useState, useEffect } from "react";
import { Lock, CheckCircle2, AlertTriangle, Video, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getQuestions, Question } from "@/lib/questions";
import { fetchSessionState } from "@/lib/stateSync";

export default function SessionThree() {
  const router = useRouter();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>([]);
  
  const [customVideoUrl, setCustomVideoUrl] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [answerError, setAnswerError] = useState(false);

  useEffect(() => {
    const override = localStorage.getItem(`s3_vid_${currentIndex + 1}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomVideoUrl(override || "");
    setAnswerInput("");
  }, [currentIndex]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [passkeyError, setPasskeyError] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<"STANDBY" | "ACTIVE" | "PAUSED" | "ENDED">("ACTIVE");
  const [timeLeft, setTimeLeft] = useState<number>(1500);

  useEffect(() => {
    if (isCompleted || sessionStatus !== "ACTIVE") return;

    let endTimeStr = localStorage.getItem("session_3_endtime");
    let endTimestamp = 0;
    if (!endTimeStr) {
      endTimestamp = Date.now() + 1500 * 1000; // 25 minutes
      localStorage.setItem("session_3_endtime", endTimestamp.toString());
    } else {
      endTimestamp = parseInt(endTimeStr);
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        setIsCompleted(true);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [isCompleted, sessionStatus]);

  useEffect(() => {
    const pollStatus = async () => {
      let finalStatus = null;
      let localStatus = null;
      let remoteStatus = null;

      const localStates = localStorage.getItem("cyberhunt_session_states");
      if (localStates) {
        const parsed = JSON.parse(localStates);
        if (parsed[3]) {
          localStatus = parsed[3];
        }
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        remoteStatus = await fetchSessionState(3);
      }

      if (remoteStatus) {
        if (remoteStatus === "RESET") {
          localStorage.removeItem("cyberhunt_session_states");
          localStorage.removeItem("cyberhunt_current_session");
          localStorage.removeItem("session_3_completed");
          localStorage.removeItem("session_3_endtime");
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
    setQuestions(getQuestions(3));

    const interval = setInterval(pollStatus, 2000);
    const handleStorage = () => { pollStatus(); setQuestions(getQuestions(3)); };
    window.addEventListener("storage", handleStorage);
    return () => { clearInterval(interval); window.removeEventListener("storage", handleStorage); };
  }, []);

  // Ping progress to admin dashboard
  useEffect(() => {
    const pingProgress = async () => {
      try {
        const teamDataStr = localStorage.getItem("cyberhunt_team");
        if (teamDataStr) {
          const team = JSON.parse(teamDataStr);
          const alias = team.teamAlias || team.team_alias;
          if (alias) {
            await fetch('/api/state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'ping_progress', team_alias: alias, session: 3, question: currentIndex + 1 })
            });
          }
        }
      } catch (e) {}
    };
    
    pingProgress();
    const interval = setInterval(pingProgress, 3000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const currentQ = questions[currentIndex];

  const handleOptionSelect = (option: string, index: number) => {
    setSubmittedAnswers(prev => [...prev, option]);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPasskey = localStorage.getItem("passkey_3") || "SEASON4-ACCESS";

    if (passkey.toUpperCase() === expectedPasskey.toUpperCase()) { 
      // Calculate Score
      let score = 0; // Section 3 passkey gives 0 based on rules
      score += submittedAnswers.length * 10; // 10 marks per video challenge

      // Calculate time taken
      const endTimeStr = localStorage.getItem("session_3_endtime");
      const startTime = endTimeStr ? parseInt(endTimeStr) - 1500000 : Date.now() - 1500000;
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      try {
        const teamDataStr = localStorage.getItem("cyberhunt_team");
        if (teamDataStr) {
          const team = JSON.parse(teamDataStr);
          await fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'submit_score', team_alias: team.teamAlias || team.team_alias, session: 3, score, time_taken: timeTaken })
          });
        }
      } catch (e) {}

      localStorage.setItem("cyberhunt_current_session", "4");
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
                  <button onClick={() => { localStorage.setItem("cyberhunt_current_session", "4"); router.push("/waiting"); }} className="mt-4 px-6 py-3 bg-red-500 text-black text-xs font-bold uppercase hover:bg-red-400 transition-all">
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
        <Link href="/">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition-opacity">
            <span>CYBER<span className="text-zinc-500">HUNT</span></span>
          </div>
        </Link>
        <div className="text-zinc-500 text-xs tracking-widest uppercase flex items-center gap-6">
          <span>{isCompleted ? "SEASON_3 :: COMPLETE" : `SEASON_3 :: PHASE_${currentIndex + 1}`}</span>
        </div>
      </nav>

      {/* CORNER TIMER */}
      {!isCompleted && (
        <div className="fixed top-8 right-8 z-50 pointer-events-none flex flex-col items-end">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Time Remaining</div>
          <div className={`text-2xl font-mono font-black tracking-widest ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-zinc-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'}`}>
            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          
          {/* QUESTION PHASE */}
          {!isCompleted && currentQ && (
            <motion.div
              key={`question-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full flex flex-col lg:flex-row gap-8"
            >
              {/* Video Clue Section */}
              <div className="flex-1 bg-black border border-zinc-800 shadow-2xl relative p-4 flex flex-col min-h-[300px]">
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-zinc-500"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-zinc-500"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-zinc-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-zinc-500"></div>
                
                <div className="flex items-center justify-between mb-4 px-2 text-zinc-500 text-xs tracking-widest uppercase border-b border-zinc-800 pb-2">
                  <span className="flex items-center gap-2"><Video className="w-4 h-4 text-red-500 animate-pulse" /> Surveillance Feed</span>
                  <span>CAM_{currentIndex + 1}.REC</span>
                </div>
                
                <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden border border-zinc-900 group">
                  {currentQ?.mediaUrl ? (
                    <video 
                      src={customVideoUrl || currentQ.mediaUrl} 
                      controls
                      className="w-full h-full object-contain opacity-90 transition-opacity duration-300 relative z-20"
                      poster={`https://placehold.co/800x450/111/333?text=LOADING+SURVEILLANCE+FEED...`}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest h-full w-full flex items-center justify-center min-h-[300px]">No Media</div>
                  )}
                  {/* Subtle Scanline overlay on top of video container, below video controls if possible. Since video controls overlay everything, this sits below the video but adds a tint */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 mix-blend-overlay" />
                </div>
              </div>

              {/* Question & Options Section */}
              <div className="flex-1 flex flex-col justify-center max-w-lg w-full">
                <div className="mb-8 flex items-center gap-4">
                  <div className="w-12 h-12 bg-black border border-zinc-700 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    {currentIndex + 1}
                  </div>
                  <div>
                    <h2 className="text-2xl tracking-widest uppercase font-bold text-zinc-100">Forensics</h2>
                    <p className="text-zinc-500 text-xs tracking-widest uppercase">Challenge {currentIndex + 1} of 8</p>
                  </div>
                </div>

                <div className="mb-8 p-6 bg-black border border-zinc-800 relative">
                  <div className="absolute left-0 top-0 w-1 h-full bg-zinc-700" />
                  <p className="text-xl leading-relaxed text-zinc-200">
                    {currentQ.text}
                  </p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (answerInput.trim().toUpperCase() === currentQ.answer.toUpperCase()) {
                    handleOptionSelect(currentQ.answer, 0);
                    setAnswerInput("");
                    setAnswerError(false);
                  } else {
                    setAnswerError(true);
                    setTimeout(() => setAnswerError(false), 1500);
                  }
                }} className="w-full mt-8">
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${answerError ? 'text-red-500' : 'text-zinc-600'}`} />
                    <input 
                      type="text" 
                      placeholder="ENTER PASSKEY"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      className={`w-full pl-12 pr-6 py-4 bg-black border ${answerError ? 'border-red-500 text-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-zinc-700 text-white focus:border-zinc-400 focus:shadow-[0_0_15px_rgba(255,255,255,0.1)]'} outline-none tracking-widest uppercase transition-all text-center placeholder:text-zinc-800`}
                    />
                    {answerError && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <button type="submit" className="w-full mt-4 py-4 bg-zinc-200 text-black font-bold tracking-widest uppercase hover:bg-white transition-all active:scale-[0.98]">
                    Verify Passkey
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* PASSKEY PHASE */}
          {isCompleted && (
            <motion.div
              key="passkey-phase"
              initial={{ opacity: 0, scale: 0.5, rotateY: 90, rotateX: 45 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0, rotateX: 0 }}
              transition={{ type: "spring", stiffness: 80, damping: 20, duration: 1.5 }}
              className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center"
              style={{ perspective: 2000 }}
            >
              <motion.div
                whileHover={{ rotateY: -5, rotateX: 5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-full p-12 bg-black border-2 border-red-900/50 relative shadow-[0_0_100px_rgba(220,38,38,0.15)]"
              >
                {/* 3D depth layers */}
                <div className="absolute inset-0 border border-red-500/30 transform -translate-z-10 scale-95 pointer-events-none blur-sm" />
                <div className="absolute inset-0 border border-red-500/10 transform -translate-z-20 scale-90 pointer-events-none blur-md" />
                
                {/* Tech corners - Red theme */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>

                <motion.div
                  animate={{ 
                    textShadow: ["0 0 10px rgba(220,38,38,0.5)", "0 0 30px rgba(220,38,38,1)", "0 0 10px rgba(220,38,38,0.5)"],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transform: "translateZ(30px)" }}
                >
                  <Lock className="w-16 h-16 text-red-500 mx-auto mb-6" />
                  <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest mb-4 text-white">
                    The Last Passkey
                  </h1>
                </motion.div>
                
                <p className="text-red-400/80 tracking-widest mb-12 uppercase text-xs md:text-sm" style={{ transform: "translateZ(20px)" }}>
                  Critical infrastructure reached. System lockdown initiated. Final authentication required.
                </p>

                <form onSubmit={handlePasskeySubmit} className="w-full" style={{ transform: "translateZ(40px)" }}>
                  <div className="relative group">
                    <input 
                      type="password"
                      placeholder="ENTER THE LAST PASSKEY"
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value)}
                      className={`w-full px-6 py-6 bg-red-950/10 border ${passkeyError ? 'border-red-500 text-red-500' : 'border-red-900/80 text-white focus:border-red-500'} outline-none tracking-widest uppercase transition-all text-center text-lg md:text-xl placeholder:text-red-900/50 shadow-[inset_0_0_20px_rgba(0,0,0,1)] focus:shadow-[0_0_30px_rgba(220,38,38,0.3)] backdrop-blur-sm`}
                    />
                    {passkeyError && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-red-500">
                        <AlertTriangle className="w-6 h-6 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <button 
                    type="submit"
                    className="w-full mt-6 py-5 bg-red-950 hover:bg-red-800 text-white font-bold tracking-widest uppercase transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] border border-red-500/50"
                  >
                    Authenticate
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

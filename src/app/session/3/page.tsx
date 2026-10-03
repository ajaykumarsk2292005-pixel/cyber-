"use client";

import { useState, useEffect } from "react";
import { Lock, CheckCircle2, AlertTriangle, Video, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Placeholder questions for Season 3 with video clues
const QUESTIONS = [
  { id: 1, video: "https://www.w3schools.com/html/mov_bbb.mp4", text: "Watch the video footage. What port was open on the terminal screen?", options: ["21", "22", "80", "443"], answer: "22" },
  { id: 2, video: "https://www.w3schools.com/html/mov_bbb.mp4", text: "At 0:05, a command is executed. What was the command?", options: ["nmap -sV", "ping 8.8.8.8", "cat /etc/passwd", "ssh root@10.0.0.1"], answer: "nmap -sV" },
  { id: 3, video: "https://www.w3schools.com/html/mov_bbb.mp4", text: "Identify the malware signature shown in the sandbox environment.", options: ["WannaCry", "Stuxnet", "Emotet", "Mirai"], answer: "WannaCry" },
  { id: 4, video: "https://www.w3schools.com/html/mov_bbb.mp4", text: "Which user account was compromised during the brute force attack?", options: ["admin", "sysadmin", "guest", "ubuntu"], answer: "admin" },
  { id: 5, video: "https://www.w3schools.com/html/mov_bbb.mp4", text: "What is the physical location (GPS coordinates) flashed on the monitor?", options: ["37.7749° N", "51.5074° N", "40.7128° N", "34.0522° N"], answer: "51.5074° N" },
  { id: 6, video: "https://www.w3schools.com/html/mov_bbb.mp4", text: "What encryption key was intercepted in the packet capture?", options: ["0xDEADBEEF", "0xCAFEBABE", "0x8BADF00D", "0x1337C0DE"], answer: "0xDEADBEEF" },
  { id: 7, video: "https://www.w3schools.com/html/mov_bbb.mp4", text: "What was the name of the vulnerable service running?", options: ["vsftpd 2.3.4", "Apache 2.4.49", "ProFTPD 1.3.5", "Samba 3.5.0"], answer: "vsftpd 2.3.4" },
  { id: 8, video: "https://www.w3schools.com/html/mov_bbb.mp4", text: "Identify the final flag hidden in the audio spectrogram.", options: ["FLAG{h1dd3n_w4v}", "FLAG{sp3ctr0gr4m}", "FLAG{cYb3r_hunt}", "FLAG{s0und_bYt3s}"], answer: "FLAG{h1dd3n_w4v}" },
];

export default function SessionThree() {
  const router = useRouter();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>([]);
  
  const [customVideoUrl, setCustomVideoUrl] = useState("");

  useEffect(() => {
    const override = localStorage.getItem(`s3_vid_${currentIndex + 1}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomVideoUrl(override || "");
  }, [currentIndex]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [passkeyError, setPasskeyError] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<"STANDBY" | "ACTIVE" | "PAUSED" | "ENDED">("ACTIVE");

  useEffect(() => {
    const pollStatus = async () => {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        try {
          const { data, error } = await supabase.from('sessions').select('status').eq('session_number', 3).single();
          if (data && !error) {
            setSessionStatus(data.status);
            return;
          }
        } catch (err) {}
      }
      const localStates = localStorage.getItem("cyberhunt_session_states");
      if (localStates) {
        const parsed = JSON.parse(localStates);
        if (parsed[3]) setSessionStatus(parsed[3]);
      }
    };
    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    const handleStorage = () => pollStatus();
    window.addEventListener("storage", handleStorage);
    return () => { clearInterval(interval); window.removeEventListener("storage", handleStorage); };
  }, []);

  const currentQ = QUESTIONS[currentIndex];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOptionSelect = (option: string, index: number) => {
    setSubmittedAnswers(prev => [...prev, option]);
    
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPasskey = localStorage.getItem("passkey_3") || "SEASON4-ACCESS";

    if (passkey.toUpperCase() === expectedPasskey.toUpperCase()) { 
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
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-yellow-500">System Paused</h2>
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
        <div className="text-zinc-500 text-xs tracking-widest uppercase">
          {isCompleted ? "SEASON_3 :: COMPLETE" : `SEASON_3 :: PHASE_${currentIndex + 1}`}
        </div>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          
          {/* QUESTION PHASE */}
          {!isCompleted && (
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
                  <video 
                    src={customVideoUrl || currentQ.video} 
                    controls
                    className="w-full h-full object-contain opacity-90 transition-opacity duration-300 relative z-20"
                    poster={`https://placehold.co/800x450/111/333?text=LOADING+SURVEILLANCE+FEED...`}
                  >
                    Your browser does not support the video tag.
                  </video>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentQ.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option, idx)}
                      className="p-5 border transition-all text-left flex items-center gap-4 group bg-black border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900 text-zinc-300"
                    >
                      <span className="text-xs font-bold tracking-widest uppercase text-zinc-600 group-hover:text-zinc-400">
                        {String.fromCharCode(65 + idx)} /
                      </span>
                      <span className="tracking-widest uppercase">{option}</span>
                    </button>
                  ))}
                </div>
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

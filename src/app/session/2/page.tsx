"use client";

import { useState, useEffect } from "react";
import { Lock, CheckCircle2, AlertTriangle, ImageIcon, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Placeholder questions for Season 2 with image clues
const QUESTIONS = [
  { id: 1, image: "https://placehold.co/800x400/111/555?text=CLUE+1:+HIDDEN+IN+PLAIN+SIGHT", text: "Based on the visual clue above, what is the target IP address?", options: ["192.168.1.1", "10.0.0.5", "172.16.0.2", "127.0.0.1"], answer: "10.0.0.5" },
  { id: 2, image: "https://placehold.co/800x400/111/555?text=CLUE+2:+HEX+DUMP", text: "Analyze the hex dump. What file format is this?", options: ["ELF", "PE", "Mach-O", "COM"], answer: "PE" },
  { id: 3, image: "https://placehold.co/800x400/111/555?text=CLUE+3:+NETWORK+GRAPH", text: "Which node is acting as the command and control server?", options: ["Node Alpha", "Node Omega", "Node 0x99", "Node Beta"], answer: "Node 0x99" },
  { id: 4, image: "https://placehold.co/800x400/111/555?text=CLUE+4:+ENCRYPTED+PAYLOAD", text: "What encryption algorithm was likely used here?", options: ["AES-256", "RSA", "Base64", "RC4"], answer: "AES-256" },
  { id: 5, image: "https://placehold.co/800x400/111/555?text=CLUE+5:+SYSTEM+LOGS", text: "Identify the compromised user account from the logs.", options: ["root", "admin", "guest", "service_acct"], answer: "service_acct" },
  { id: 6, image: "https://placehold.co/800x400/111/555?text=CLUE+6:+STEGANOGRAPHY", text: "What is hidden inside the least significant bits?", options: ["A URL", "A password hash", "Coordinates", "A private key"], answer: "A URL" },
  { id: 7, image: "https://placehold.co/800x400/111/555?text=CLUE+7:+ARCHITECTURE", text: "What cloud service is being exploited in this diagram?", options: ["S3 Bucket", "EC2 Instance", "Lambda", "RDS"], answer: "S3 Bucket" },
];

export default function SessionTwo() {
  const router = useRouter();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>([]);
  
  const [customImageUrl, setCustomImageUrl] = useState("");

  useEffect(() => {
    const override = localStorage.getItem(`s2_img_${currentIndex + 1}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomImageUrl(override || "");
  }, [currentIndex]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [passkeyError, setPasskeyError] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<"STANDBY" | "ACTIVE" | "PAUSED" | "ENDED">("ACTIVE");

  useEffect(() => {
    const pollStatus = async () => {
      const localStates = localStorage.getItem("cyberhunt_session_states");
      if (localStates) {
        const parsed = JSON.parse(localStates);
        if (parsed[2]) {
          setSessionStatus(parsed[2]);
          return;
        }
      }
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        try {
          const { data, error } = await supabase.from('sessions').select('status').eq('session_number', 2).single();
          if (data && !error) {
            setSessionStatus(data.status);
          }
        } catch (err) {}
      }
    };
    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    const handleStorage = () => pollStatus();
    window.addEventListener("storage", handleStorage);
    return () => { clearInterval(interval); window.removeEventListener("storage", handleStorage); };
  }, []);

  const currentQ = QUESTIONS[currentIndex];

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
    const expectedPasskey = localStorage.getItem("passkey_2") || "SEASON3-ACCESS";
    
    if (passkey.toUpperCase() === expectedPasskey.toUpperCase()) { 
      localStorage.setItem("cyberhunt_current_session", "3");
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
                  <button onClick={() => { localStorage.setItem("cyberhunt_current_session", "3"); router.push("/waiting"); }} className="mt-4 px-6 py-3 bg-red-500 text-black text-xs font-bold uppercase hover:bg-red-400 transition-all">
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
          {isCompleted ? "SEASON_2 :: COMPLETE" : `SEASON_2 :: PHASE_${currentIndex + 1}`}
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          
          {/* QUESTION PHASE */}
          {!isCompleted && (
            <motion.div
              key={`question-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full flex flex-col md:flex-row gap-8"
            >
              {/* Image Clue Section */}
              <div className="flex-1 bg-black border border-zinc-800 shadow-2xl relative p-4 flex flex-col">
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-zinc-500"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-zinc-500"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-zinc-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-zinc-500"></div>
                
                <div className="flex items-center justify-between mb-4 px-2 text-zinc-500 text-xs tracking-widest uppercase border-b border-zinc-800 pb-2">
                  <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Visual Evidence</span>
                  <span>IMG_{currentIndex + 1}.DAT</span>
                </div>
                
                <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden border border-zinc-900 group">
                  {/* Using standard img tag to avoid next/image domain restrictions for placehold.co */}
                  <img 
                    src={customImageUrl || currentQ.image} 
                    alt={`Clue ${currentIndex + 1}`}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700"
                  />
                  {/* Scanline overlay for aesthetic */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 mix-blend-overlay" />
                </div>
              </div>

              {/* Question & Options Section */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="mb-8 flex items-center gap-4">
                  <div className="w-12 h-12 bg-black border border-zinc-700 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    {currentIndex + 1}
                  </div>
                  <div>
                    <h2 className="text-2xl tracking-widest uppercase font-bold text-zinc-100">Reconnaissance</h2>
                    <p className="text-zinc-500 text-xs tracking-widest uppercase">Challenge {currentIndex + 1} of 7</p>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-xl leading-relaxed text-zinc-200">
                    {currentQ.text}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 bg-green-950/30 border border-green-500/50 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-4xl font-bold uppercase tracking-widest mb-4">Season 2 Cleared</h1>
              <p className="text-zinc-500 tracking-widest max-w-md mx-auto mb-12">
                Visual reconnaissance complete. Target located. Awaiting Season 3 authentication passkey.
              </p>

              <form onSubmit={handlePasskeySubmit} className="w-full max-w-md mx-auto">
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${passkeyError ? 'text-red-500' : 'text-zinc-600'}`} />
                  <input 
                    type="text"
                    placeholder="ENTER SEASON 3 PASSKEY"
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
                  Unlock Season 3
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

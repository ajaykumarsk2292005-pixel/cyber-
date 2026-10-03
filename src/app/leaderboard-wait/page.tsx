"use client";

import { motion } from "framer-motion";
import { Shield, Clock, BarChart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LeaderboardWaitPage() {
  const [team, setTeam] = useState<{ teamAlias: string; college: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("cyberhunt_team");
    if (saved) {
      setTeam(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col relative overflow-hidden">
      {/* Background Matrix/Grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:30px_30px] opacity-20" />
      
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <Link href="/">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <Shield className="w-6 h-6 text-green-500" />
            <span>CYBER<span className="text-zinc-500">HUNT</span></span>
          </div>
        </Link>
        {team && (
          <div className="flex items-center gap-4 text-xs font-mono border border-zinc-800 px-4 py-2 bg-zinc-900/50">
            <span className="text-zinc-500 uppercase">Active Team</span>
            <span className="font-bold text-green-400">{team.teamAlias}</span>
          </div>
        )}
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl w-full"
        >
          <div className="mb-12 relative inline-block">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-2 border-green-500/20 rounded-full border-t-green-500/80"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-8 border-2 border-zinc-500/20 rounded-full border-b-green-500/50"
            />
            <div className="bg-green-950/30 p-8 rounded-full border border-green-500/30 backdrop-blur-sm">
              <BarChart className="w-16 h-16 text-green-400" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest text-white mb-6 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
            SYSTEM CONQUERED
          </h1>
          
          <div className="space-y-4 mb-12">
            <p className="text-green-400/80 text-lg md:text-xl tracking-widest">
              Master Override Executed Successfully.
            </p>
            <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
              Your infiltration time has been logged in the mainframe. 
              Please standby while the system administrator collates the final results and releases the leaderboard.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-700 px-6 py-4 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-zinc-300 font-bold">
              Awaiting Admin Broadcast...
            </span>
            <div className="flex gap-1 ml-2">
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }} className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 1 }} className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

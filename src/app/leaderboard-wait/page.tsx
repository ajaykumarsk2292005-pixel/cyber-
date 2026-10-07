"use client";

import { motion } from "framer-motion";
import { Shield, Clock, BarChart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSessionState } from "@/lib/stateSync";
import { supabase } from "@/lib/supabase";

export default function LeaderboardWaitPage() {
  const [team, setTeam] = useState<{ teamAlias: string; college: string } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>("STANDBY");
  const [teams, setTeams] = useState<any[]>([]);
  const [scoresData, setScoresData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("cyberhunt_team");
    if (saved) {
      setTeam(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const pollStatus = async () => {
      const state = await fetchSessionState(5);
      if (state) setSessionStatus(state);

      if (state === "ACTIVE") {
        try {
          // Fetch memory state (for deleted teams and live scores)
          const res = await fetch('/api/state', { cache: 'no-store' });
          let memDeleted: string[] = [];
          let allTeamsMap = new Map();
          let memoryTeams: any[] = [];
          if (res.ok) {
            const memoryState = await res.json();
            if (memoryState && memoryState.deleted_teams) memDeleted = memoryState.deleted_teams;
            if (memoryState && memoryState.scores) setScoresData(memoryState.scores);
            if (memoryState && memoryState.teams) memoryTeams = memoryState.teams;
          }

          if (Array.isArray(memoryTeams)) {
            memoryTeams.forEach(t => {
              const alias = t.team_alias || t.teamAlias;
              if (alias) allTeamsMap.set(alias, t);
            });
          }

          // Fetch DB teams
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
            const { data } = await supabase.from('teams').select('*');
            if (data) {
              data.forEach(t => {
                const alias = t.team_alias || t.teamAlias;
                if (alias) allTeamsMap.set(alias, t);
              });
            }
          }

          const memDelLower = memDeleted.map(d => String(d).trim().toLowerCase());
          const validTeams = Array.from(allTeamsMap.values()).filter(t => {
            const rawAlias = t.team_alias || t.teamAlias || "";
            const alias = String(rawAlias).trim().toLowerCase();
            return t.college !== 'SYS_STATE' && t.college !== 'SYS' && !memDelLower.includes(alias);
          });
          setTeams(validTeams);
        } catch (e) {}
        setIsLoading(false);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const getRankedTeams = () => {
    return teams.map(t => {
      const alias = t.teamAlias || t.team_alias;
      let totalScore = 0;
      let totalTime = 0;
      if (scoresData[alias]) {
        Object.values(scoresData[alias]).forEach((s: any) => {
          totalScore += (s.score || 0);
          totalTime += (s.time_taken || 0);
        });
      }
      return { ...t, totalScore, totalTime };
    }).sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.totalTime - b.totalTime;
    });
  };

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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center w-full max-w-5xl mx-auto">
        
        {sessionStatus !== "ACTIVE" ? (
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
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col h-full"
          >
            <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-widest text-white mb-4 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
              GLOBAL LEADERBOARD
            </h1>
            <p className="text-zinc-500 mb-8 uppercase tracking-widest">Final Infiltration Rankings</p>
            
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Clock className="w-12 h-12 text-green-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {getRankedTeams().map((t, i) => (
                  <motion.div 
                    layout 
                    key={t.team_alias || t.teamAlias || i} 
                    className={`flex items-center justify-between p-6 border ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/50' : i === 1 ? 'bg-zinc-300/10 border-zinc-400/50' : i === 2 ? 'bg-amber-700/10 border-amber-600/50' : 'bg-black/50 border-zinc-800 backdrop-blur-sm'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`font-mono text-3xl font-bold w-12 text-center ${i === 0 ? 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-600'}`}>
                        #{i + 1}
                      </div>
                      <div className="text-left">
                        <div className={`text-2xl font-bold tracking-widest uppercase ${i === 0 ? 'text-yellow-500' : 'text-white'}`}>
                          {t.teamAlias || t.team_alias}
                        </div>
                        <div className="text-sm text-zinc-500 font-mono uppercase mt-1">{t.college}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-black ${i === 0 ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'text-green-500'}`}>
                        {t.totalScore} <span className="text-sm text-zinc-500">PTS</span>
                      </div>
                      <div className="text-xs text-zinc-400 font-mono uppercase mt-1">
                        Total Time: {t.totalTime > 0 ? `${Math.floor(t.totalTime / 60)}m ${t.totalTime % 60}s` : 'N/A'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

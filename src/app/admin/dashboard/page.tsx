"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Users, LogOut, Activity, BarChart, Server, 
  Settings, Image as ImageIcon, Video, FileText, Download, Play, Square, XOctagon,
  Edit2, Save, X, Lock, Unlock
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { QuestionManager } from "@/components/QuestionManager";
import { broadcastSessionState, fetchSessionState } from "@/lib/stateSync";

interface Team {
  id?: number;
  team_alias: string;
  college: string;
  node_alpha: string;
  node_beta: string;
  status: string;
  created_at?: string;
  // Optional camelCase for local storage fallback
  teamAlias?: string;
  nodeAlpha?: string;
  nodeBeta?: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("event-control");
  const [sessionStates, setSessionStates] = useState<Record<number, "STANDBY" | "ACTIVE" | "PAUSED" | "ENDED">>({
    1: "STANDBY",
    2: "STANDBY",
    3: "STANDBY",
    4: "STANDBY",
    5: "STANDBY",
  });

  // Load session states on mount
  useEffect(() => {
    const loadSessionStates = async () => {
      const states: Record<number, any> = {};
      let hasRemoteData = false;
      for (let i = 1; i <= 5; i++) {
        const s = await fetchSessionState(i);
        if (s) {
          states[i] = s;
          hasRemoteData = true;
        }
      }
      
      if (hasRemoteData) {
        setSessionStates(prev => {
          const newStates = { ...prev, ...states };
          localStorage.setItem("cyberhunt_session_states", JSON.stringify(newStates));
          return newStates;
        });
      } else {
        const localStates = localStorage.getItem("cyberhunt_session_states");
        if (localStates) {
          setSessionStates(JSON.parse(localStates));
        }
      }
    };
    loadSessionStates();
  }, []);

  const handleUpdateSessionState = async (session: number, status: "STANDBY" | "ACTIVE" | "PAUSED" | "ENDED") => {
    // Optimistic UI update
    setSessionStates(prev => {
      const newStates = { ...prev, [session]: status };
      // Fallback save to localStorage
      localStorage.setItem("cyberhunt_session_states", JSON.stringify(newStates));
      return newStates;
    });
    
    // Save to Supabase if configured (fire and forget)
    await broadcastSessionState(session, status);
  };

  const [passkeys, setPasskeys] = useState({
    1: "SEASON2-ACCESS",
    2: "SEASON3-ACCESS",
    3: "SEASON4-ACCESS"
  });
  
  const [editingPasskey, setEditingPasskey] = useState<number | null>(null);
  const [tempPasskey, setTempPasskey] = useState("");

  const [teams, setTeams] = useState<Team[]>([]);
  const [progressData, setProgressData] = useState<Record<string, { session: number, question: number, timestamp: number }>>({});
  const [scoresData, setScoresData] = useState<Record<string, Record<string, { score: number, time_taken: number }>>>({});
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [editingTeamIndex, setEditingTeamIndex] = useState<number | null>(null);
  const [editingTeamData, setEditingTeamData] = useState<Team | null>(null);

  const handleDeleteTeam = async (index: number) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    const teamToDelete = teams[index];
    
    // Update local state
    const newTeams = [...teams];
    newTeams.splice(index, 1);
    setTeams(newTeams);
    
    const localTeams = JSON.parse(localStorage.getItem("cyberhunt_teams") || "[]");
    const updatedLocal = localTeams.filter((t: any) => t.teamAlias !== teamToDelete.teamAlias && t.team_alias !== teamToDelete.team_alias && t.teamAlias !== teamToDelete.team_alias && t.team_alias !== teamToDelete.teamAlias);
    localStorage.setItem("cyberhunt_teams", JSON.stringify(updatedLocal));

    // Persistent Admin Blacklist
    try {
      let localDeleted = JSON.parse(localStorage.getItem("cyberhunt_deleted_teams") || "[]");
      if (!Array.isArray(localDeleted)) localDeleted = [];
      const aliasToBlock = String(teamToDelete.team_alias || teamToDelete.teamAlias || "").trim().toLowerCase();
      if (aliasToBlock && !localDeleted.includes(aliasToBlock)) {
        localDeleted.push(aliasToBlock);
        localStorage.setItem("cyberhunt_deleted_teams", JSON.stringify(localDeleted));
      }
    } catch(e) {
      const aliasToBlock = String(teamToDelete.team_alias || teamToDelete.teamAlias || "").trim().toLowerCase();
      if (aliasToBlock) localStorage.setItem("cyberhunt_deleted_teams", JSON.stringify([aliasToBlock]));
    }
    // Update Supabase if connected
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        await supabase.from('teams').delete().eq('team_alias', teamToDelete.team_alias || teamToDelete.teamAlias);
      } catch(e) {}
    }
    
    // Update API memory state fallback
    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'delete_team', team_alias: teamToDelete.team_alias || teamToDelete.teamAlias })
      });
    } catch(e) {}
  };

  const handleSaveTeam = async (index: number) => {
    if (!editingTeamData) return;
    
    // Update local state
    const newTeams = [...teams];
    newTeams[index] = editingTeamData;
    setTeams(newTeams);
    setEditingTeamIndex(null);
    
    // Update local storage
    localStorage.setItem("cyberhunt_teams", JSON.stringify([...newTeams].reverse()));
    
    // Update Supabase if connected
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        await supabase.from('teams').update({
          college: editingTeamData.college,
          node_alpha: editingTeamData.node_alpha || editingTeamData.nodeAlpha,
          node_beta: editingTeamData.node_beta || editingTeamData.nodeBeta,
          status: editingTeamData.status
        }).eq('team_alias', editingTeamData.team_alias || editingTeamData.teamAlias);
      } catch(e) {}
    }

    // Update API memory state fallback
    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'update_team', team: editingTeamData })
      });
    } catch(e) {}
  };

  useEffect(() => {
    // Load custom passkeys if any
    const p1 = localStorage.getItem("passkey_1");
    const p2 = localStorage.getItem("passkey_2");
    const p3 = localStorage.getItem("passkey_3");
    if (p1 || p2 || p3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPasskeys({
        1: p1 || "SEASON2-ACCESS",
        2: p2 || "SEASON3-ACCESS",
        3: p3 || "SEASON4-ACCESS"
      });
    }
  }, []);

  useEffect(() => {
    if (activeTab === "registrations" || activeTab === "leaderboard" || activeTab === "monitoring") {
      const fetchTeams = async () => {
        setIsLoadingTeams(true);
        
        try {
          let memoryDeleted: string[] = [];
          let memoryTeams: any[] = [];
          try {
            const res = await fetch('/api/state', { cache: 'no-store' });
            if (res.ok) {
              const memoryState = await res.json();
              if (memoryState && memoryState.deleted_teams) memoryDeleted = memoryState.deleted_teams;
              if (memoryState && memoryState.teams) memoryTeams = memoryState.teams;
              if (memoryState && memoryState.progress) setProgressData(memoryState.progress);
              if (memoryState && memoryState.scores) setScoresData(memoryState.scores);
            }
          } catch(e) {
            console.error("API fetch error", e);
          }

          const filterRealTeams = (data: any[]) => {
            let localDeleted: string[] = [];
            try {
              const parsed = JSON.parse(localStorage.getItem("cyberhunt_deleted_teams") || "[]");
              if (Array.isArray(parsed)) localDeleted = parsed;
            } catch(e) {}
            
            return data.filter(t => {
              const rawAlias = t.team_alias || t.teamAlias || "";
              const alias = String(rawAlias).trim().toLowerCase();
              const memDelLower = memoryDeleted.map(d => String(d).trim().toLowerCase());
              const locDelLower = localDeleted.map(d => String(d).trim().toLowerCase());
              
              return t.college !== 'SYS_STATE' && 
                     t.college !== 'SYS' &&
                     !memDelLower.includes(alias) &&
                     !locDelLower.includes(alias);
            });
          };

          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
            const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
            if (!error && data) {
              setTeams(filterRealTeams(data));
              setIsLoadingTeams(false);
              return;
            }
          }
          
          // Fallback to in-memory API first
          if (memoryTeams && memoryTeams.length > 0) {
            setTeams(filterRealTeams(memoryTeams.reverse()));
            setIsLoadingTeams(false);
            return;
          }

          // Ultimate Fallback to localStorage array if Supabase is empty, failing, or not configured
          const localTeams = localStorage.getItem("cyberhunt_teams");
            if (localTeams) {
              setTeams(filterRealTeams(JSON.parse(localTeams).reverse()));
            } else {
              setTeams([]);
            }
        } catch (e) {
          // Silently fail and fallback to localStorage
          const localTeams = localStorage.getItem("cyberhunt_teams");
          if (localTeams) {
            setTeams(filterRealTeams(JSON.parse(localTeams).reverse()));
          }
        } finally {
          setIsLoadingTeams(false);
        }
      };
      
      // Initial fetch
      fetchTeams();

      // Setup polling for live updates
      const interval = setInterval(fetchTeams, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleSavePasskey = (seasonId: number) => {
    setPasskeys(prev => ({...prev, [seasonId]: tempPasskey}));
    localStorage.setItem(`passkey_${seasonId}`, tempPasskey);
    setEditingPasskey(null);
  };

  const exportToCSV = (data: Team[], filename: string) => {
    if (data.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    // Headers
    const headers = ['Rank', 'Team Alias', 'College', 'Participant 1', 'Participant 2', 'Status'];
    
    // Rows
    const rows = data.map((team, index) => {
      // Escape commas in strings
      const escapeStr = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      
      return [
        index + 1,
        escapeStr(team.teamAlias || team.team_alias || ''),
        escapeStr(team.college || ''),
        escapeStr(team.nodeAlpha || team.node_alpha || ''),
        escapeStr(team.nodeBeta || team.node_beta || ''),
        escapeStr(team.status || '')
      ].join(',');
    });
    
    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TABS = [
    { id: "event-control", label: "Event Control", icon: Settings },
    { id: "registrations", label: "Registrations", icon: Users },
    { id: "questions", label: "Question Mgmt", icon: FileText },
    { id: "image-challenge", label: "Image Challenge", icon: ImageIcon },
    { id: "video-challenge", label: "Video Challenge", icon: Video },
    { id: "finale-challenge", label: "Finale Challenge", icon: Lock },
    { id: "monitoring", label: "Node Monitor", icon: Server },
    { id: "leaderboard", label: "Leaderboard", icon: BarChart },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-zinc-800 selection:text-white font-sans flex overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-black/80 relative z-20 flex flex-col backdrop-blur-md shrink-0">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <Shield className="w-6 h-6 text-zinc-400" />
            <span>CYBER<span className="text-zinc-500">HUNT</span></span>
          </div>
          <p className="mt-2 text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500">Admin Override v2.0</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? "bg-zinc-900 border border-zinc-700 text-zinc-100 shadow-[inset_2px_0_0_#fff]" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-zinc-400 font-mono text-xs uppercase tracking-widest hover:text-white hover:bg-zinc-900 transition-colors">
            <LogOut className="w-4 h-4" /> Terminate Link
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex justify-between items-end border-b border-zinc-800 pb-4 mb-8">
            <div>
              <h1 className="text-3xl font-mono uppercase tracking-widest text-zinc-100">
                {TABS.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mt-2">
                System configuration and overrides
              </p>
            </div>
            <div className="px-3 py-1 border border-zinc-700 bg-zinc-900 text-zinc-300 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Admin Auth Active
            </div>
          </header>

          {/* EVENT CONTROL TAB */}
          {activeTab === "event-control" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="p-6 bg-black/50 border border-zinc-800 relative backdrop-blur-md">
                <div className="flex justify-between items-start mb-8 pb-6 border-b border-zinc-800">
                  <div>
                    <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-100 mb-2">Session Master Override</h2>
                    <p className="text-xs font-mono text-zinc-500">Deploy specific sessions to all active nodes. This action is instantaneous globally.</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all sessions? This will wipe all progress on participant nodes.')) {
                        [1, 2, 3, 4, 5].forEach(session => handleUpdateSessionState(session, "RESET" as any));
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-red-900/50 hover:border-red-500 hover:bg-red-950/20 text-red-500/80 hover:text-red-400 font-mono text-xs uppercase tracking-widest transition-all"
                  >
                    <XOctagon className="w-4 h-4" />
                    Reset Event
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3, 4].map((session) => {
                    const status = sessionStates[session];
                    const isActive = status === "ACTIVE";
                    const isPaused = status === "PAUSED";
                    const isEnded = status === "ENDED";
                    
                    let duration = "TBA";
                    let sessionPasskey = "N/A";
                    if (session === 1) { duration = "10:00 MIN"; sessionPasskey = passkeys[1] || "SEASON2-ACCESS"; }
                    if (session === 2) { duration = "20:00 MIN"; sessionPasskey = passkeys[2] || "SEASON3-ACCESS"; }
                    if (session === 3) { duration = "25:00 MIN"; sessionPasskey = passkeys[3] || "SEASON4-ACCESS"; }
                    if (session === 4) { duration = "25:00 MIN"; sessionPasskey = "N/A (Finale)"; }

                    return (
                      <div key={session} className={`flex flex-col p-4 border transition-all ${
                        isActive ? "border-green-500/50 bg-green-500/5" : 
                        isPaused ? "border-yellow-500/50 bg-yellow-500/5" :
                        isEnded ? "border-red-500/20 bg-red-500/5 opacity-50" :
                        "border-zinc-800 bg-zinc-900/50"
                      }`}>
                        <div className="flex flex-col md:flex-row items-center justify-between w-full">
                          <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
                            <div className={`w-10 h-10 flex items-center justify-center font-mono font-bold text-lg border ${
                              isActive ? "border-green-500 text-green-500" : 
                              isPaused ? "border-yellow-500 text-yellow-500" :
                              isEnded ? "border-red-500 text-red-500" :
                              "border-zinc-700 text-zinc-500"
                            }`}>
                              {session}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-sm font-bold uppercase tracking-widest">
                                  Session {session} {session === 1 ? "(Aptitude)" : session === 4 ? "(Finale)" : ""}
                                </h3>
                                {duration !== "TBA" && (
                                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-400 text-[9px] font-mono rounded-sm">
                                    {duration}
                                  </span>
                                )}
                                {sessionPasskey !== "N/A" && (
                                  <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-800 text-blue-400 text-[9px] font-mono rounded-sm flex items-center gap-1">
                                    <Lock className="w-2 h-2" /> PASSKEY: {sessionPasskey}
                                  </span>
                                )}
                              </div>
                              <p className={`text-[10px] font-mono uppercase mt-1 ${
                                isActive ? "text-green-400" : 
                                isPaused ? "text-yellow-400" :
                                isEnded ? "text-red-400" :
                                "text-zinc-500"
                              }`}>
                                {isActive ? "Currently Active" : isPaused ? "System Locked" : isEnded ? "Session Terminated" : "Standby Mode"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                          <button
                            disabled={isEnded}
                            onClick={() => handleUpdateSessionState(session, "ACTIVE")}
                            className={`flex-1 md:flex-none px-3 py-2 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-1 border transition-all ${
                              isActive 
                                ? "bg-green-500/20 text-green-400 border-green-500"
                                : "bg-black text-white border-zinc-700 hover:border-green-500 hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                          >
                            <Play className="w-3 h-3" /> Start
                          </button>
                          
                          <button
                            disabled={isEnded || status === "STANDBY"}
                            onClick={() => handleUpdateSessionState(session, "PAUSED")}
                            className={`flex-1 md:flex-none px-3 py-2 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-1 border transition-all ${
                              isPaused 
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500"
                                : "bg-black text-white border-zinc-700 hover:border-yellow-500 hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                          >
                            <Square className="w-3 h-3" /> Pause
                          </button>

                          <button
                            disabled={isEnded}
                            onClick={() => handleUpdateSessionState(session, "ENDED")}
                            className={`flex-1 md:flex-none px-3 py-2 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-1 border transition-all ${
                              isEnded
                                ? "bg-red-500/20 text-red-400 border-red-500"
                                : "bg-black text-white border-zinc-700 hover:border-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                          >
                            <XOctagon className="w-3 h-3" /> End
                          </button>

                          <button
                            disabled={isEnded || status === "STANDBY"}
                            onClick={() => handleUpdateSessionState(session, "PAUSED")}
                            className={`flex-1 md:flex-none px-3 py-2 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-1 border transition-all bg-black text-white border-zinc-700 hover:border-blue-500 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Lock className="w-3 h-3" /> Lock
                          </button>

                          <button
                            disabled={isEnded}
                            onClick={() => handleUpdateSessionState(session, "ACTIVE")}
                            className={`flex-1 md:flex-none px-3 py-2 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-1 border transition-all bg-black text-white border-zinc-700 hover:border-cyan-500 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Unlock className="w-3 h-3" /> Unlock
                          </button>
                        </div>
                        </div>
                        
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* REGISTRATIONS TAB */}
          {activeTab === "registrations" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="p-6 bg-black/50 border border-zinc-800 relative backdrop-blur-md">
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-zinc-800">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100 mb-2">Team Registrations</h2>
                    <p className="text-sm text-zinc-500 font-mono">
                      Live feed of registered teams and their current status.
                    </p>
                  </div>
                  <button 
                    onClick={() => exportToCSV(teams, 'cyberhunt_registrations')}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-green-500 text-zinc-300 hover:text-green-400 font-mono text-xs uppercase tracking-widest transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export to Excel
                  </button>
                </div>

                {isLoadingTeams ? (
                  <div className="text-center py-10">
                    <Activity className="w-8 h-8 text-zinc-700 mx-auto mb-4 animate-spin" />
                    <p className="text-xs font-mono uppercase text-zinc-500">Fetching Data...</p>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 font-mono text-sm uppercase tracking-widest">
                    No teams registered yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-sm">
                      <thead className="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-widest border-b border-zinc-800">
                        <tr>
                          <th className="p-4 font-normal">Team Alias</th>
                          <th className="p-4 font-normal">College</th>
                          <th className="p-4 font-normal">Participant 1</th>
                          <th className="p-4 font-normal">Participant 2</th>
                          <th className="p-4 font-normal">Status</th>
                          <th className="p-4 font-normal text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {teams.map((team, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                            {editingTeamIndex === idx ? (
                              <>
                                <td className="p-4 font-bold text-zinc-200">{team.teamAlias || team.team_alias}</td>
                                <td className="p-4">
                                  <input type="text" value={editingTeamData?.college} onChange={e => setEditingTeamData({...editingTeamData!, college: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 outline-none text-xs text-white" />
                                </td>
                                <td className="p-4">
                                  <input type="text" value={editingTeamData?.nodeAlpha || editingTeamData?.node_alpha} onChange={e => setEditingTeamData({...editingTeamData!, nodeAlpha: e.target.value, node_alpha: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 outline-none text-xs text-white" />
                                </td>
                                <td className="p-4">
                                  <input type="text" value={editingTeamData?.nodeBeta || editingTeamData?.node_beta || ""} onChange={e => setEditingTeamData({...editingTeamData!, nodeBeta: e.target.value, node_beta: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 outline-none text-xs text-white" />
                                </td>
                                <td className="p-4">
                                  <select value={editingTeamData?.status} onChange={e => setEditingTeamData({...editingTeamData!, status: e.target.value})} className="bg-zinc-900 border border-zinc-700 px-2 py-1 outline-none text-xs text-white">
                                    <option value="WAITING">WAITING</option>
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="DISQUALIFIED">DISQUALIFIED</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                  </select>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  <button onClick={() => handleSaveTeam(idx)} className="text-green-500 hover:text-green-400 text-xs uppercase tracking-widest font-bold">Save</button>
                                  <button onClick={() => setEditingTeamIndex(null)} className="text-zinc-500 hover:text-zinc-400 text-xs uppercase tracking-widest font-bold">Cancel</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-4 font-bold text-zinc-200">{team.teamAlias || team.team_alias}</td>
                                <td className="p-4 text-zinc-400">{team.college}</td>
                                <td className="p-4 text-zinc-500 text-xs">{team.nodeAlpha || team.node_alpha || "-"}</td>
                                <td className="p-4 text-zinc-500 text-xs">{team.nodeBeta || team.node_beta || "-"}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 bg-opacity-30 border text-[10px] uppercase tracking-widest ${
                                    team.status === "WAITING" ? "bg-zinc-800 border-zinc-600 text-zinc-400" :
                                    team.status === "ACTIVE" ? "bg-green-950 border-green-500/50 text-green-400" :
                                    team.status === "DISQUALIFIED" ? "bg-red-950 border-red-500/50 text-red-400" :
                                    "bg-blue-950 border-blue-500/50 text-blue-400"
                                  }`}>
                                    {team.status || "WAITING"}
                                  </span>
                                </td>
                                <td className="p-4 text-right space-x-4">
                                  <button onClick={() => { setEditingTeamIndex(idx); setEditingTeamData(team); }} className="text-blue-500 hover:text-blue-400 text-xs uppercase tracking-widest font-bold">Edit</button>
                                  <button onClick={() => handleDeleteTeam(idx)} className="text-red-500 hover:text-red-400 text-xs uppercase tracking-widest font-bold">Delete</button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* QUESTION MANAGEMENT TABS */}
          {activeTab === "questions" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <QuestionManager sessionNumber={1} />
            </motion.div>
          )}

          {activeTab === "image-challenge" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <QuestionManager sessionNumber={2} />
            </motion.div>
          )}

          {activeTab === "video-challenge" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <QuestionManager sessionNumber={3} />
            </motion.div>
          )}

          {activeTab === "finale-challenge" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-black/50 border border-zinc-800 p-6 relative">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500"></div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100 mb-2">Finale Configuration</h2>
                <p className="text-sm text-zinc-500 font-mono mb-6 pb-6 border-b border-zinc-800">
                  Manage the final section. These are the hints participants will use to crack the final override.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Discovered Passkeys (Hints)</h3>
                  <p className="text-xs text-zinc-500 font-mono mb-4">These are managed in their respective sections but are displayed here for reference.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 border border-zinc-800 bg-zinc-900/50 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Session 1 Passkey</div>
                      <div className="text-green-400 font-mono font-bold">{passkeys[1] || typeof window !== 'undefined' && localStorage.getItem('passkey_1') || "SEASON2-ACCESS"}</div>
                    </div>
                    <div className="p-4 border border-zinc-800 bg-zinc-900/50 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Session 2 Passkey</div>
                      <div className="text-green-400 font-mono font-bold">{passkeys[2] || typeof window !== 'undefined' && localStorage.getItem('passkey_2') || "SEASON3-ACCESS"}</div>
                    </div>
                    <div className="p-4 border border-zinc-800 bg-zinc-900/50 text-center">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Session 3 Passkey</div>
                      <div className="text-green-400 font-mono font-bold">{passkeys[3] || typeof window !== 'undefined' && localStorage.getItem('passkey_3') || "SEASON4-ACCESS"}</div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-800">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300 mb-2">Master Override Passkey</h3>
                    <p className="text-xs text-zinc-500 font-mono mb-4">The ultimate final answer participants must derive from the hints to win the Cyber Hunt.</p>
                    
                    <div className="flex items-center gap-4">
                      {editingPasskey === 4 ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={tempPasskey} 
                            onChange={(e) => setTempPasskey(e.target.value)}
                            className="bg-black border border-green-500/50 text-green-400 font-mono text-sm px-3 py-2 outline-none tracking-widest uppercase w-64"
                            placeholder="FINAL PASSWORD..."
                          />
                          <button onClick={() => {
                            localStorage.setItem("passkey_4", tempPasskey);
                            setEditingPasskey(null);
                          }} className="bg-green-950/50 border border-green-500/30 text-green-500 hover:text-green-400 transition-colors p-2"><Save className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="px-4 py-2 border border-zinc-800 bg-black min-w-[200px] text-center">
                            <span className="text-sm font-bold font-mono tracking-widest text-green-400">
                              {typeof window !== 'undefined' ? (localStorage.getItem("passkey_4") || "OVERRIDE-INIT") : "OVERRIDE-INIT"}
                            </span>
                          </div>
                          <button 
                            onClick={() => { 
                              setEditingPasskey(4); 
                              setTempPasskey(typeof window !== 'undefined' ? (localStorage.getItem("passkey_4") || "OVERRIDE-INIT") : ""); 
                            }} 
                            className="bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-colors p-2"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === "leaderboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-black/50 border border-zinc-800 p-6 relative">
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-zinc-800">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100 mb-2">Global Leaderboard</h2>
                    <p className="text-sm text-zinc-500 font-mono">
                      Live ranking of all participating nodes based on network infiltration status.
                    </p>
                  </div>
                  <button 
                    onClick={() => exportToCSV(teams, 'cyberhunt_leaderboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-green-500 text-zinc-300 hover:text-green-400 font-mono text-xs uppercase tracking-widest transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export to Excel
                  </button>
                </div>

                {teams.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 font-mono text-sm uppercase tracking-widest">
                    No nodes connected to mainframe.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teams
                      .map(t => {
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
                      })
                      .sort((a, b) => {
                        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                        return a.totalTime - b.totalTime;
                      })
                      .map((t, i) => (
                      <motion.div layout key={t.team_alias || t.teamAlias || i} className={`flex items-center justify-between p-4 border ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/50' : i === 1 ? 'bg-zinc-300/10 border-zinc-400/50' : i === 2 ? 'bg-amber-700/10 border-amber-600/50' : 'bg-zinc-900 border-zinc-800'}`}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-4">
                            <div className={`font-mono text-lg font-bold w-6 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-zinc-500'}`}>
                              #{i + 1}
                            </div>
                            <div>
                              <div className={`font-bold tracking-widest uppercase ${i === 0 ? 'text-yellow-500' : 'text-white'}`}>{t.teamAlias || t.team_alias}</div>
                              <div className="text-[10px] text-zinc-500 font-mono uppercase">{t.college}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-10">
                            {[1, 2, 3, 4].map(s => {
                              const sData = scoresData[t.teamAlias || t.team_alias]?.[s];
                              if (!sData) return null;
                              return (
                                <div key={s} className="px-2 py-1 bg-black border border-zinc-800 text-[9px] font-mono text-zinc-400">
                                  <span className="text-zinc-500">S{s}:</span> {sData.score}PTS <span className="text-zinc-600">|</span> {sData.time_taken}s
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">
                            {t.totalScore} <span className="text-xs text-zinc-500">PTS</span>
                          </div>
                          <div className="text-xs text-zinc-400 font-mono uppercase">
                            Total Time: {t.totalTime > 0 ? `${Math.floor(t.totalTime / 60)}m ${t.totalTime % 60}s` : 'N/A'}
                          </div>
                          <div className={`text-[10px] uppercase tracking-widest mt-1 ${t.status === 'COMPLETED' ? 'text-green-500' : t.status === 'DISQUALIFIED' ? 'text-red-500' : 'text-cyan-500'}`}>
                            {t.status === 'COMPLETED' ? 'System Conquered' : t.status === 'DISQUALIFIED' ? 'Terminated' : 'Infiltrating'}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* NODE MONITOR TAB */}
          {activeTab === "monitoring" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-black/50 border border-zinc-800 p-6 relative">
                <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100 mb-2">Node Monitor</h2>
                <p className="text-sm text-zinc-500 font-mono mb-6 pb-6 border-b border-zinc-800">
                  Real-time visualization of all connected client machines.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {teams.map((t, i) => {
                    const prog = progressData[t.teamAlias || t.team_alias];
                    const isLive = prog && (Date.now() - prog.timestamp < 10000); // within last 10s
                    return (
                      <div key={i} className={`border ${isLive ? 'border-green-500/50 bg-green-950/20' : 'border-zinc-800 bg-black'} p-4 relative group transition-colors duration-500`}>
                        <div className={`absolute top-0 right-0 w-2 h-2 ${isLive ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#0f0]' : t.status === 'COMPLETED' ? 'bg-green-500' : t.status === 'DISQUALIFIED' ? 'bg-red-500' : 'bg-cyan-500 opacity-50'}`}></div>
                        <Server className={`w-8 h-8 mb-4 transition-colors ${isLive ? 'text-green-500' : 'text-zinc-700 group-hover:text-cyan-500'}`} />
                        <div className="text-xs font-bold uppercase tracking-widest text-zinc-300 truncate">{t.teamAlias || t.team_alias}</div>
                        <div className="text-[9px] text-zinc-600 font-mono mt-1">NODE_{i.toString().padStart(3, '0')}</div>
                        
                        <div className="mt-4 text-[10px] uppercase font-bold tracking-widest text-zinc-500 border-t border-zinc-900 pt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span>Sess:</span>
                            <span className={prog ? 'text-white' : 'text-zinc-700'}>{prog ? prog.session : '-'}</span>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span>Task:</span>
                            <span className={prog ? 'text-white' : 'text-zinc-700'}>{prog ? prog.question : '-'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>State:</span>
                            <span className={t.status === 'COMPLETED' ? 'text-green-500' : t.status === 'DISQUALIFIED' ? 'text-red-500' : isLive ? 'text-green-400' : 'text-zinc-500'}>
                              {isLive ? 'ACTIVE' : t.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty Node Slots */}
                  {Array.from({ length: Math.max(0, 15 - teams.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="border border-zinc-900 bg-black/20 p-4 opacity-30">
                      <Server className="w-8 h-8 text-zinc-800 mb-4" />
                      <div className="text-xs font-bold uppercase tracking-widest text-zinc-800">OFFLINE</div>
                      <div className="text-[9px] text-zinc-800 font-mono mt-1">NO CONNECTION</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* OTHER TABS PLACEHOLDER */}
          {activeTab !== "event-control" && activeTab !== "questions" && activeTab !== "image-challenge" && activeTab !== "video-challenge" && activeTab !== "finale-challenge" && activeTab !== "registrations" && activeTab !== "leaderboard" && activeTab !== "monitoring" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex items-center justify-center min-h-[400px] border border-zinc-800 border-dashed"
            >
              <div className="text-center">
                <Settings className="w-8 h-8 text-zinc-700 mx-auto mb-4 animate-[spin_4s_linear_infinite]" />
                <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Module Loading...</p>
                <p className="text-xs text-zinc-600 mt-2">This module is currently being calibrated.</p>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}

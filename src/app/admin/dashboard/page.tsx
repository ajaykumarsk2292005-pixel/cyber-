"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Users, LogOut, Activity, BarChart, Server, 
  Settings, Image as ImageIcon, Video, FileText, Download, Play, Square, XOctagon,
  Edit2, Save, X
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { time: "00:00", score: 20 },
  { time: "04:00", score: 45 },
  { time: "08:00", score: 30 },
  { time: "12:00", score: 80 },
  { time: "16:00", score: 65 },
  { time: "20:00", score: 90 },
];

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
      // 1. Try to load from Supabase if configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        try {
          const { data, error } = await supabase.from('sessions').select('*');
          if (data && !error) {
            const states: Record<number, string> = {};
            data.forEach((s: { session_number: number, status: string }) => { states[s.session_number] = s.status; });
            setSessionStates(prev => ({ ...prev, ...(states as unknown as Record<number, "STANDBY" | "ACTIVE" | "PAUSED" | "ENDED">) }));
            // Sync to local storage for local fallback
            localStorage.setItem("cyberhunt_session_states", JSON.stringify({ ...sessionStates, ...states }));
            return;
          }
        } catch (err) {}
      }
      // 2. Fallback to localStorage
      const localStates = localStorage.getItem("cyberhunt_session_states");
      if (localStates) {
        setSessionStates(JSON.parse(localStates));
      }
    };
    loadSessionStates();
  }, []);

  const handleUpdateSessionState = async (session: number, status: "STANDBY" | "ACTIVE" | "PAUSED" | "ENDED") => {
    // Optimistic UI update
    const newStates = { ...sessionStates, [session]: status };
    setSessionStates(newStates);
    
    // Fallback save to localStorage
    localStorage.setItem("cyberhunt_session_states", JSON.stringify(newStates));
    
    // Save to Supabase if configured (fire and forget)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        await supabase.from('sessions').update({ status }).eq('session_number', session);
      } catch (err) {}
    }
  };

  const [passkeys, setPasskeys] = useState({
    1: "SEASON2-ACCESS",
    2: "SEASON3-ACCESS",
    3: "SEASON4-ACCESS"
  });
  
  const [editingPasskey, setEditingPasskey] = useState<number | null>(null);
  const [tempPasskey, setTempPasskey] = useState("");

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

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
    if (activeTab === "registrations") {
      const fetchTeams = async () => {
        setIsLoadingTeams(true);
        try {
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
            const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
            if (data && data.length > 0) {
              setTeams(data);
              setIsLoadingTeams(false);
              return;
            }
          }
          
          // Fallback to localStorage array if Supabase is empty, failing, or not configured
          const localTeams = localStorage.getItem("cyberhunt_teams");
            if (localTeams) {
              setTeams(JSON.parse(localTeams).reverse());
            } else {
              setTeams([]);
            }
        } catch (e) {
          // Silently fail and fallback to localStorage
          const localTeams = localStorage.getItem("cyberhunt_teams");
          if (localTeams) {
            setTeams(JSON.parse(localTeams).reverse());
          }
        } finally {
          setIsLoadingTeams(false);
        }
      };
      fetchTeams();
    }
  }, [activeTab]);

  const handleSavePasskey = (seasonId: number) => {
    setPasskeys(prev => ({...prev, [seasonId]: tempPasskey}));
    localStorage.setItem(`passkey_${seasonId}`, tempPasskey);
    setEditingPasskey(null);
  };

  const TABS = [
    { id: "telemetry", label: "Telemetry", icon: Activity },
    { id: "event-control", label: "Event Control", icon: Settings },
    { id: "registrations", label: "Registrations", icon: Users },
    { id: "questions", label: "Question Mgmt", icon: FileText },
    { id: "image-challenge", label: "Image Challenge", icon: ImageIcon },
    { id: "video-challenge", label: "Video Challenge", icon: Video },
    { id: "monitoring", label: "Node Monitor", icon: Server },
    { id: "leaderboard", label: "Leaderboard", icon: BarChart },
    { id: "export", label: "Result Export", icon: Download },
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

          {/* TELEMETRY TAB */}
          {activeTab === "telemetry" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Active Nodes", value: "142", icon: Users },
                  { label: "Data Throughput", value: "8.4 TB", icon: Server },
                  { label: "Global Score Avg", value: "76.5", icon: BarChart },
                  { label: "System Load", value: "34%", icon: Activity }
                ].map((stat, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 bg-black/50 border border-zinc-800 relative backdrop-blur-md"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-zinc-500"></div>
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-zinc-500"></div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className="w-5 h-5 text-zinc-500" />
                      <span className="text-[10px] font-mono text-zinc-600 uppercase">Live</span>
                    </div>
                    <div className="text-3xl font-mono text-zinc-100 mb-1">{stat.value}</div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-black/50 border border-zinc-800 relative backdrop-blur-md"
              >
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-500"></div>
                
                <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-6">Global Scoring Vector</h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#d4af37' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#d4af37" fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          )}

          {/* EVENT CONTROL TAB */}
          {activeTab === "event-control" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="p-6 bg-black/50 border border-zinc-800 relative backdrop-blur-md">
                <h2 className="text-sm font-mono uppercase tracking-widest text-zinc-100 mb-2">Session Master Override</h2>
                <p className="text-xs font-mono text-zinc-500 mb-8">Deploy specific sessions to all active nodes. This action is instantaneous globally.</p>

                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3, 4, 5].map((session) => {
                    const status = sessionStates[session];
                    const isActive = status === "ACTIVE";
                    const isPaused = status === "PAUSED";
                    const isEnded = status === "ENDED";
                    
                    let duration = "TBA";
                    if (session === 1) duration = "15:00 MIN";
                    if (session === 2) duration = "18:00 MIN";
                    if (session === 3) duration = "20:00 MIN";

                    return (
                      <div key={session} className={`flex flex-col md:flex-row items-center justify-between p-4 border transition-all ${
                        isActive ? "border-green-500/50 bg-green-500/5" : 
                        isPaused ? "border-yellow-500/50 bg-yellow-500/5" :
                        isEnded ? "border-red-500/20 bg-red-500/5 opacity-50" :
                        "border-zinc-800 bg-zinc-900/50"
                      }`}>
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
                                Session {session} {session === 1 ? "(Aptitude)" : session === 5 ? "(Finale)" : ""}
                              </h3>
                              {duration !== "TBA" && (
                                <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-400 text-[9px] font-mono rounded-sm">
                                  {duration}
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] font-mono uppercase mt-1 ${
                              isActive ? "text-green-400" : 
                              isPaused ? "text-yellow-400" :
                              isEnded ? "text-red-400" :
                              "text-zinc-500"
                            }`}>
                              {isActive ? "Currently Active" : isPaused ? "System Paused" : isEnded ? "Session Terminated" : "Standby Mode"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <button
                            disabled={isEnded}
                            onClick={() => handleUpdateSessionState(session, "ACTIVE")}
                            className={`flex-1 md:flex-none px-4 py-2 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${
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
                            className={`flex-1 md:flex-none px-4 py-2 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${
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
                            className={`flex-1 md:flex-none px-4 py-2 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${
                              isEnded
                                ? "bg-red-500/20 text-red-400 border-red-500"
                                : "bg-black text-white border-zinc-700 hover:border-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            }`}
                          >
                            <XOctagon className="w-3 h-3" /> End
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* QUESTION MGMT TAB */}
          {activeTab === "questions" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {[
                {
                  title: "Season 1: Infiltration (Text Puzzles)",
                  passkeyToUnlockNext: "SEASON2-ACCESS",
                  questions: [
                    { q: "What is the standard port for HTTPS communication?", a: "Port 443" },
                    { q: "Decode this string: YWRtaW4=", a: "admin" },
                    { q: "What does XSS stand for?", a: "Cross Site Scripting" },
                    { q: "What protocol resolves IP addresses to MAC addresses?", a: "ARP" },
                    { q: "A widely used 128-bit hash function that is considered cryptographically broken.", a: "MD5" },
                    { q: "What type of attack involves overwhelming a target server with traffic?", a: "DDoS" },
                    { q: "Which widely used tool is known as a network protocol analyzer?", a: "Wireshark" },
                    { q: "In Linux, what is the absolute path to the file containing hashed user passwords?", a: "/etc/shadow" },
                    { q: "What is the practice of hiding a secret message inside an ordinary file (like an image)?", a: "Steganography" },
                    { q: "What command line tool is used to discover the path a packet takes to a destination network?", a: "traceroute" },
                  ]
                },
                {
                  title: "Season 2: Reconnaissance (Image Clues)",
                  passkeyToUnlockNext: "SEASON3-ACCESS",
                  questions: [
                    { q: "Based on the visual clue above, what is the target IP address?", a: "10.0.0.5" },
                    { q: "Analyze the hex dump. What file format is this?", a: "PE" },
                    { q: "Which node is acting as the command and control server?", a: "Node 0x99" },
                    { q: "What encryption algorithm was likely used here?", a: "AES-256" },
                    { q: "Identify the compromised user account from the logs.", a: "service_acct" },
                    { q: "What is hidden inside the least significant bits?", a: "A URL" },
                    { q: "What cloud service is being exploited in this diagram?", a: "S3 Bucket" },
                  ]
                },
                {
                  title: "Season 3: Forensics (Video Clues)",
                  passkeyToUnlockNext: "SEASON4-ACCESS",
                  questions: [
                    { q: "Watch the video footage. What port was open on the terminal screen?", a: "22" },
                    { q: "At 0:05, a command is executed. What was the command?", a: "nmap -sV" },
                    { q: "Identify the malware signature shown in the sandbox environment.", a: "WannaCry" },
                    { q: "Which user account was compromised during the brute force attack?", a: "admin" },
                    { q: "What is the physical location (GPS coordinates) flashed on the monitor?", a: "51.5074° N" },
                    { q: "What encryption key was intercepted in the packet capture?", a: "0xDEADBEEF" },
                    { q: "What was the name of the vulnerable service running?", a: "vsftpd 2.3.4" },
                    { q: "Identify the final flag hidden in the audio spectrogram.", a: "FLAG{h1dd3n_w4v}" },
                  ]
                }
              ].map((season, sIdx) => (
                <div key={sIdx} className="bg-black/50 border border-zinc-800 p-6 relative">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                    <h3 className="text-xl font-bold uppercase tracking-widest text-zinc-100 mb-2 md:mb-0">
                      {season.title}
                    </h3>
                    <div className="flex items-center gap-2 bg-green-950/30 border border-green-500/50 px-4 py-2">
                      <span className="text-xs uppercase font-mono text-zinc-400">Unlock Next Season:</span>
                      
                      {editingPasskey === sIdx + 1 ? (
                        <div className="flex items-center gap-2 ml-2">
                          <input 
                            type="text" 
                            value={tempPasskey} 
                            onChange={(e) => setTempPasskey(e.target.value)}
                            className="bg-black border border-green-500/50 text-green-400 font-mono text-sm px-2 py-1 outline-none w-40 tracking-widest uppercase"
                          />
                          <button onClick={() => handleSavePasskey(sIdx + 1)} className="text-green-500 hover:text-green-400 transition-colors p-1"><Save className="w-4 h-4"/></button>
                          <button onClick={() => setEditingPasskey(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"><X className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-sm font-bold font-mono tracking-widest text-green-400">{passkeys[(sIdx + 1) as keyof typeof passkeys]}</span>
                          <button 
                            onClick={() => { 
                              setEditingPasskey(sIdx + 1); 
                              setTempPasskey(passkeys[(sIdx + 1) as keyof typeof passkeys]); 
                            }} 
                            className="text-zinc-500 hover:text-green-400 transition-colors p-1"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {season.questions.map((q, qIdx) => (
                      <div key={qIdx} className="flex flex-col md:flex-row gap-4 p-4 border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/80 transition-colors">
                        <div className="flex-1">
                          <span className="text-zinc-600 font-bold mr-3">{String(qIdx + 1).padStart(2, '0')}.</span>
                          <span className="text-zinc-300 text-sm tracking-wide">{q.q}</span>
                        </div>
                        <div className="md:w-1/3 flex items-center">
                          <div className="text-xs tracking-widest font-mono text-green-500 bg-green-950/20 px-3 py-1 border border-green-900/50 w-full text-center md:text-left">
                            {q.a}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* IMAGE CHALLENGE TAB (SEASON 2) */}
          {activeTab === "image-challenge" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-6 bg-black/50 border border-zinc-800 p-6 relative"
            >
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500"></div>
              <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100 mb-2">Season 2: Image Overrides</h2>
              <p className="text-sm text-zinc-500 font-mono mb-6 pb-6 border-b border-zinc-800">
                Provide public URLs for the images you want to use for each challenge. These will instantly update the screens for all active participants.
              </p>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                  const storageKey = `s2_img_${num}`;
                  return (
                    <div key={num} className="flex flex-col md:flex-row gap-4 p-4 border border-zinc-800/50 bg-zinc-900/30 items-start md:items-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-black border border-zinc-700 font-bold">{num}</div>
                      <div className="flex-1 w-full relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          suppressHydrationWarning
                          type="text" 
                          placeholder={`Enter Image URL for Challenge ${num} (e.g. https://...)`}
                          defaultValue={typeof window !== 'undefined' ? localStorage.getItem(storageKey) || "" : ""}
                          onBlur={(e) => {
                            if(e.target.value) {
                              localStorage.setItem(storageKey, e.target.value);
                            } else {
                              localStorage.removeItem(storageKey);
                            }
                          }}
                          className="w-full bg-black border border-zinc-800 text-zinc-300 font-mono text-xs pl-10 pr-4 py-3 outline-none focus:border-zinc-500 transition-colors"
                        />
                      </div>
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Auto-saves on blur</div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* VIDEO CHALLENGE TAB (SEASON 3) */}
          {activeTab === "video-challenge" && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-6 bg-black/50 border border-zinc-800 p-6 relative"
            >
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500"></div>
              <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100 mb-2">Season 3: Video Overrides</h2>
              <p className="text-sm text-zinc-500 font-mono mb-6 pb-6 border-b border-zinc-800">
                Provide public URLs (.mp4) for the surveillance footage used in Season 3.
              </p>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                  const storageKey = `s3_vid_${num}`;
                  return (
                    <div key={num} className="flex flex-col md:flex-row gap-4 p-4 border border-zinc-800/50 bg-zinc-900/30 items-start md:items-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-black border border-zinc-700 font-bold">{num}</div>
                      <div className="flex-1 w-full relative">
                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          suppressHydrationWarning
                          type="text" 
                          placeholder={`Enter Video URL (.mp4) for Challenge ${num}`}
                          defaultValue={typeof window !== 'undefined' ? localStorage.getItem(storageKey) || "" : ""}
                          onBlur={(e) => {
                            if(e.target.value) {
                              localStorage.setItem(storageKey, e.target.value);
                            } else {
                              localStorage.removeItem(storageKey);
                            }
                          }}
                          className="w-full bg-black border border-zinc-800 text-zinc-300 font-mono text-xs pl-10 pr-4 py-3 outline-none focus:border-zinc-500 transition-colors"
                        />
                      </div>
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Auto-saves on blur</div>
                    </div>
                  )
                })}
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
                <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-100 mb-2">Team Registrations</h2>
                <p className="text-sm text-zinc-500 font-mono mb-6 pb-6 border-b border-zinc-800">
                  Live feed of registered teams and their current status.
                </p>

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
                          <th className="p-4 font-normal">Node Alpha</th>
                          <th className="p-4 font-normal">Node Beta</th>
                          <th className="p-4 font-normal">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {teams.map((team, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-4 font-bold text-zinc-200">{team.teamAlias || team.team_alias}</td>
                            <td className="p-4 text-zinc-400">{team.college}</td>
                            <td className="p-4 text-zinc-500 text-xs">{team.nodeAlpha || team.node_alpha || "-"}</td>
                            <td className="p-4 text-zinc-500 text-xs">{team.nodeBeta || team.node_beta || "-"}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-green-950/30 border border-green-500/50 text-green-400 text-[10px] uppercase tracking-widest">
                                {team.status || "WAITING"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* OTHER TABS PLACEHOLDER */}
          {activeTab !== "telemetry" && activeTab !== "event-control" && activeTab !== "questions" && activeTab !== "image-challenge" && activeTab !== "video-challenge" && activeTab !== "registrations" && (
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

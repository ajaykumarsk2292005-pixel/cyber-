"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, UserPlus, Users, GraduationCap, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Register() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("register");
  
  const [formData, setFormData] = useState({
    teamAlias: "",
    nodeAlpha: "",
    nodeBeta: "",
    college: ""
  });
  
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save locally for fallback/optimistic UI
    localStorage.setItem("cyberhunt_team", JSON.stringify(formData));
    
    // Save ALL registrations locally for the admin dashboard fallback
    const existingTeams = JSON.parse(localStorage.getItem("cyberhunt_teams") || "[]");
    existingTeams.push({ ...formData, status: "WAITING", created_at: new Date().toISOString() });
    localStorage.setItem("cyberhunt_teams", JSON.stringify(existingTeams));

    // Instantly transition the user for a fast experience
    router.push("/waiting");

    // Fire and forget Supabase insert in the background ONLY if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        await supabase.from('teams').insert([{
          team_alias: formData.teamAlias,
          node_alpha: formData.nodeAlpha,
          node_beta: formData.nodeBeta,
          college: formData.college
        }]);
      } catch (err) {
        // Silently fail if Supabase is not configured yet
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-zinc-800 selection:text-white font-sans flex flex-col overflow-hidden">
      {/* Background is globally managed by layout.tsx */}

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 w-full">
        <Link href="/">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition-opacity">
            <span>CYBER<span className="text-zinc-500">HUNT</span></span>
          </div>
        </Link>
        <div className="flex gap-4">
          <Link href="/" className="px-5 py-2 text-xs font-mono tracking-widest text-zinc-400 hover:text-white transition-colors uppercase">
            Return [esc]
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {activeTab === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, scale: 0.8, rotateX: 30, y: 50 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: -20, y: -50 }}
              transition={{ type: "spring", stiffness: 150, damping: 15 }}
              className="flex items-center justify-center min-h-[70vh]"
              style={{ perspective: 1200 }}
            >
              <div className="w-full max-w-4xl mx-auto" style={{ perspective: 1000 }}>
                <motion.div 
                  whileHover={{ rotateX: 2, rotateY: -2, scale: 1.02, boxShadow: "0 30px 60px -12px rgba(161, 161, 170, 0.25)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="max-w-md mx-auto p-8 rounded-none bg-black border border-zinc-800 shadow-2xl relative"
                >
                  {/* Tech corners */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-zinc-500"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-zinc-500"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-zinc-500"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-zinc-500"></div>

                  <div className="text-center mb-10">
                    <h1 className="text-2xl font-mono tracking-widest uppercase mb-2 text-zinc-100">Registration</h1>
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Connect to tensor field</p>
                  </div>

                    <motion.form 
                      className="space-y-6" 
                      onSubmit={handleRegistration}
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { staggerChildren: 0.1 }
                        }
                      }}
                    >
                      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="space-y-2">
                        <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-3 h-3" /> Team Alias
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formData.teamAlias}
                          onChange={e => setFormData({...formData, teamAlias: e.target.value})}
                          className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/80 focus:border-zinc-500 focus:bg-zinc-900 focus:ring-1 focus:ring-zinc-500 focus:shadow-[0_0_15px_rgba(161,161,170,0.15)] outline-none transition-all text-white placeholder:text-zinc-700 font-mono text-sm"
                        />
                      </motion.div>

                      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="space-y-2">
                        <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <UserPlus className="w-3 h-3" /> Name 1 (Captain)
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formData.nodeAlpha}
                          onChange={e => setFormData({...formData, nodeAlpha: e.target.value})}
                          className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/80 focus:border-zinc-500 focus:bg-zinc-900 focus:ring-1 focus:ring-zinc-500 focus:shadow-[0_0_15px_rgba(161,161,170,0.15)] outline-none transition-all text-white placeholder:text-zinc-700 font-mono text-sm"
                        />
                      </motion.div>

                      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="space-y-2">
                        <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <UserPlus className="w-3 h-3" /> Name 2 (Teammate)
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formData.nodeBeta}
                          onChange={e => setFormData({...formData, nodeBeta: e.target.value})}
                          className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/80 focus:border-zinc-500 focus:bg-zinc-900 focus:ring-1 focus:ring-zinc-500 focus:shadow-[0_0_15px_rgba(161,161,170,0.15)] outline-none transition-all text-white placeholder:text-zinc-700 font-mono text-sm"
                        />
                      </motion.div>

                      <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="space-y-2">
                        <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <GraduationCap className="w-3 h-3" /> Origin Sector (College)
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formData.college}
                          onChange={e => setFormData({...formData, college: e.target.value})}
                          className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/80 focus:border-zinc-500 focus:bg-zinc-900 focus:ring-1 focus:ring-zinc-500 focus:shadow-[0_0_15px_rgba(161,161,170,0.15)] outline-none transition-all text-white placeholder:text-zinc-700 font-mono text-sm"
                        />
                      </motion.div>

                      <motion.button 
                        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                        whileHover={{ scale: 1.02, backgroundColor: "#ffffff", boxShadow: "0 0 20px rgba(255,255,255,0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        className="w-full mt-10 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-200 text-black font-mono font-bold transition-all tracking-widest uppercase text-sm group"
                      >
                        Establish Link <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                      </motion.button>
                    </motion.form>
                  </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

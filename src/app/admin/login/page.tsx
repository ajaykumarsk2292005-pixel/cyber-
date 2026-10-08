"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Invalid credentials. Access denied.");
      }
      router.replace("/admin/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to authenticate.");
    } finally {
      setIsSubmitting(false);
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
        <Link href="/" className="px-5 py-2 text-xs font-mono tracking-widest text-zinc-400 hover:text-white transition-colors uppercase">
          Return [esc]
        </Link>
      </nav>

      {/* Login Form */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm p-8 bg-black border border-zinc-800 shadow-2xl relative"
        >
          {/* Tech corners */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-zinc-500"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-zinc-500"></div>
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-zinc-500"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-zinc-500"></div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full mb-4">
              <Lock className="w-5 h-5 text-zinc-300" />
            </div>
            <h1 className="text-xl font-mono uppercase tracking-widest mb-2 text-zinc-100">Auth Gateway</h1>
            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.2em]">Administrative override required</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-500 text-xs font-mono text-center uppercase tracking-widest">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Ident</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-zinc-500 outline-none transition-colors text-white font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Passkey</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-zinc-500 outline-none transition-colors text-white font-mono text-sm tracking-widest"
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full mt-8 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-100 text-black font-mono font-bold hover:bg-zinc-300 transition-all uppercase tracking-widest text-xs disabled:opacity-50">
              {isSubmitting ? "Authenticating" : "Authenticate"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

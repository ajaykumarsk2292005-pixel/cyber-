"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Shield } from "lucide-react";
import Link from "next/link";

const ScrollSection = ({ title, subtitle, children }: { title: string, subtitle: string, children: React.ReactNode }) => (
  <motion.section 
    initial={{ opacity: 0, y: 100 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-20%" }}
    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    className="min-h-screen flex flex-col justify-center max-w-4xl mx-auto px-8 py-24 relative"
  >
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-1/2 bg-gradient-to-b from-transparent via-zinc-500 to-transparent opacity-30 hidden md:block"></div>
    
    <div className="mb-4">
      <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">{subtitle}</span>
    </div>
    <h2 className="text-3xl md:text-5xl font-mono tracking-widest text-zinc-100 uppercase mb-12 shadow-zinc-900 drop-shadow-2xl">
      {title}
    </h2>
    <div className="text-zinc-400 font-mono text-xs md:text-sm leading-loose space-y-6 max-w-4xl bg-black/50 p-8 border border-zinc-900 backdrop-blur-sm">
      {children}
    </div>
  </motion.section>
);

export default function Home() {
  const { scrollYProgress } = useScroll();
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  // The "Tunnel" effect only applies to the LOGO wrapper now
  const canvasScale = useTransform(smoothProgress, [0, 0.15], [1, 4]);
  const canvasOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);


  return (
    <div className="bg-transparent text-white font-sans">
      {/* Background is now globally handled by Layout.tsx */}

      {/* Logo Reveal - Cinematic Focus/Blur Animation replacing the particle dot effect */}
      <motion.div 
        style={{ scale: canvasScale, opacity: canvasOpacity }} 
        className="fixed inset-0 z-10 pointer-events-none origin-center flex items-center justify-center will-change-transform"
      >
        <motion.img 
          src="/logo.png"
          alt="CYBER HUNT"
          initial={{ opacity: 0, scale: 3, filter: "blur(60px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 5, ease: [0.16, 1, 0.3, 1] }}
          className="w-[70vw] max-w-[1200px] object-contain drop-shadow-[0_0_30px_rgba(161,161,170,0.5)]"
        />
      </motion.div>

      {/* Navbar (Sticky) */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 w-full mix-blend-difference">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-2 font-bold text-xl tracking-tighter text-white"
        >
          <span>CYBER<span className="text-zinc-500">HUNT</span></span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="flex gap-4 items-center"
        >
          <Link href="/admin/login" className="px-5 py-2 text-xs font-mono tracking-widest text-zinc-400 hover:text-white transition-all duration-500 uppercase hover:bg-white/5 rounded-sm border border-transparent hover:border-zinc-700">
            Admin
          </Link>
          <Link href="/register" className="px-5 py-2 text-xs font-mono tracking-widest bg-zinc-200 text-black hover:bg-white transition-all duration-500 uppercase hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] rounded-sm">
            Registration
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section Spacer */}
      <div className="h-screen w-full relative z-20 flex flex-col items-center justify-end pb-24 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 2 }}
          className="animate-bounce"
        >
          <span className="text-[9px] font-mono tracking-[0.4em] text-zinc-500 uppercase">Scroll to Initiate</span>
          <div className="w-px h-12 bg-gradient-to-b from-zinc-500 to-transparent mx-auto mt-4"></div>
        </motion.div>
      </div>

      {/* Scrolling Content */}
      <div className="relative z-30 pb-32">
        <ScrollSection title="Event Format" subtitle="001 // Architecture">
          <p>
            Our technical event is designed in a game-like format to make the experience more interactive, challenging, and engaging. The event focuses on <strong className="text-zinc-100 font-bold">cybersecurity-related questions and challenges</strong>, where participants need to use their technical knowledge, observation skills, and logical thinking to progress through different rounds.
          </p>
          <p>
            Instead of only traditional MCQ questions, participants will solve challenges using <strong className="text-zinc-100 font-bold">images, videos, hidden clues, and problem-solving tasks</strong>. Some challenges require identifying cybersecurity clues from images, while others involve watching videos and finding the correct answer.
          </p>
          <p>
            There are also thinking-based challenges where participants need to analyze the given information and discover the solution. This combination of <strong className="text-zinc-100 font-bold">cybersecurity, visual clues, videos, and logical challenges</strong> makes the event feel more like a real cyber game or <strong className="text-zinc-100 font-bold">Cyber Hunt</strong> rather than a regular technical quiz.
          </p>
        </ScrollSection>

        <ScrollSection title="Rules & Regulations" subtitle="002 // Protocols">
          <ul className="list-none space-y-4">
            <li className="flex items-start gap-4">
              <span className="text-zinc-500">[{`>`}]</span>
              <span>All nodes (teams) must consist of exactly 2 operators. Solo infiltration is prohibited.</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-zinc-500">[{`>`}]</span>
              <span>External communication devices, physical data drives, and unauthorized hardware are strictly forbidden during the active session.</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-zinc-500">[{`>`}]</span>
              <span>Time constraints are absolute. When the terminal locks, the session terminates.</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-zinc-500">[{`>`}]</span>
              <span>Any attempt to exploit the registration or testing infrastructure will result in immediate global banishment from the grid.</span>
            </li>
          </ul>
        </ScrollSection>

        <ScrollSection title="Season 1: Infiltration" subtitle="003 // Phase Alpha">
          <p>
            The initial breach. Teams face a rapid-fire barrage of logic gates, pattern recognition matrices, and foundational cryptographic puzzles. Speed is the only metric that matters here.
          </p>
          <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800">
            <span className="block text-zinc-300 mb-2">Primary Objective:</span>
            <span className="text-zinc-500">Survive the culling. Top 50% advance to the inner network.</span>
          </div>
        </ScrollSection>

        <ScrollSection title="Season 2: Decryption" subtitle="004 // Phase Beta">
          <p>
            The firewall has been bypassed. Operators are now subjected to complex algorithmic decryption, steganography extraction, and reverse-engineering tasks. The data is corrupted; you must find the signal in the noise.
          </p>
          <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800">
            <span className="block text-zinc-300 mb-2">Primary Objective:</span>
            <span className="text-zinc-500">Extract the payload. Only the elite Top 10 nodes will proceed.</span>
          </div>
        </ScrollSection>

        <ScrollSection title="Season 3: The Core" subtitle="005 // Phase Omega">
          <p>
            The heart of the mainframe. A grueling, multi-stage gauntlet combining real-time threat analysis, live server exploitation, and physical puzzle integration. There is no guidance. There is no mercy.
          </p>
          <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800">
            <span className="block text-zinc-300 mb-2">Primary Objective:</span>
            <span className="text-zinc-500">Total System Domination. Establish the ultimate link and claim the title.</span>
          </div>
        </ScrollSection>
      </div>

    </div>
  );
}

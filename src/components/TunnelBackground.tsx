"use client";

import { useEffect, useRef } from "react";

export default function TunnelBackground() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    
    const bgCtx = bgCanvas.getContext("2d", { alpha: false });
    if (!bgCtx) return;

    interface TunnelParticle {
      angle: number;
      radius: number;
      z: number;
      speedOffset: number;
    }
    let tunnelParticles: TunnelParticle[] = [];
    let animationFrameId: number;

    const initTunnel = () => {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;

      tunnelParticles = [];
      for (let i = 0; i < 600; i++) {
        tunnelParticles.push({
          angle: Math.random() * Math.PI * 2,
          radius: 400 + Math.random() * 400,
          z: Math.random() * 2000,
          speedOffset: Math.random() * 2
        });
      }
    };

    const animate = () => {
      const width = bgCanvas.width;
      const height = bgCanvas.height;

      bgCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      bgCtx.fillRect(0, 0, width, height);

      const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
      const fov = 500;
      const baseSpeed = 1.5; 
      const scrollSpeed = scrollY * 0.005; 
      const totalSpeed = baseSpeed + scrollSpeed;

      for (let i = 0; i < tunnelParticles.length; i++) {
        const p = tunnelParticles[i];
        p.z -= (totalSpeed + p.speedOffset);
        p.angle += 0.001; 
        
        if (p.z <= 1) {
          p.z = 2000;
          p.angle = Math.random() * Math.PI * 2;
        }

        const x3d = Math.cos(p.angle) * p.radius;
        const y3d = Math.sin(p.angle) * p.radius;
        const scale = fov / p.z;
        const x2d = (x3d * scale) + width / 2;
        const y2d = (y3d * scale) + height / 2;

        if (x2d > -100 && x2d < width + 100 && y2d > -100 && y2d < height + 100) {
          const size = Math.max((1 - p.z / 2000) * 3, 0.5); 
          const opacity = Math.max(1 - p.z / 2000, 0); 
          
          bgCtx.fillStyle = `rgba(161, 161, 170, ${opacity * 0.8})`; 
          bgCtx.beginPath();
          bgCtx.arc(x2d, y2d, size, 0, Math.PI * 2);
          bgCtx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    initTunnel();
    animate();

    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      initTunnel();
      animate();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Background 3D Tunnel - Fixed and DOES NOT scale on scroll */}
      <canvas 
        ref={bgCanvasRef} 
        className="fixed inset-0 z-0 pointer-events-none w-full h-full"
      />
      {/* Tech Grid Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)]" />
    </>
  );
}

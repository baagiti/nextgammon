import React, { useState, useEffect } from 'react';
import { RotateCw, Smartphone, Monitor } from 'lucide-react';

export const PortraitGuard: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [bypassed, setBypassed] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if viewport is mobile/tablet size and in portrait orientation
      const isTouchOrSmall = window.innerWidth <= 1024;
      const isPortraitAspect = window.innerHeight > window.innerWidth;
      
      setIsPortrait(isTouchOrSmall && isPortraitAspect);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || bypassed) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#05050a]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white selection:bg-[#00ffff] selection:text-black">
      {/* Animated Cyber Phone Rotation Illustration */}
      <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
        {/* Glowing background ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00ffff]/40 animate-[spin_8s_linear_infinite]" />
        
        {/* Phone icon rotating */}
        <div className="relative animate-[bounce_2s_infinite]">
          <Smartphone className="w-16 h-16 text-[#00ffff] rotate-90 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]" />
        </div>

        <RotateCw className="absolute top-0 right-0 w-8 h-8 text-[#ff00ff] animate-spin" />
      </div>

      {/* Cyberpunk Title */}
      <span className="px-3 py-1 rounded-full bg-[#151525] border border-[#ff00ff] text-[#ff00ff] font-mono text-[10px] font-bold uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(255,0,255,0.3)]">
        MANDATORY LANDSCAPE MODE
      </span>

      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mb-2 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
        PLEASE ROTATE YOUR DEVICE
      </h2>

      <p className="text-slate-300 text-xs sm:text-sm max-w-sm font-medium leading-relaxed mb-6">
        Nextgammon requires a <span className="text-[#00ffff] font-extrabold">Horizontal (Landscape)</span> screen view to render all 24 board points, cards, and dice cleanly. Please turn your phone sideways!
      </p>

      {/* Help Tip */}
      <div className="bg-[#0a0a15] border border-[#2a2a4a] rounded-xl p-3 max-w-xs text-[11px] text-slate-400 font-mono mb-6 flex items-center gap-2">
        <RotateCw className="w-4 h-4 text-[#00ffff] shrink-0 animate-pulse" />
        <span>Tip: Ensure portrait orientation lock is disabled on your phone settings.</span>
      </div>

      {/* Bypass / Force Preview Button */}
      <button
        onClick={() => setBypassed(true)}
        className="px-4 py-2 rounded-lg bg-[#151525] border border-[#2a2a4a] hover:border-[#00ffff] text-slate-400 hover:text-white text-xs font-mono font-bold transition-all flex items-center gap-2"
      >
        <Monitor className="w-3.5 h-3.5 text-[#00ffff]" />
        <span>Preview Landscape Mode Anyway</span>
      </button>
    </div>
  );
};

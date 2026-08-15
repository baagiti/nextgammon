import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import groundClose from '../assets/cyber-ground-final.png';
import groundForward from '../assets/cyber-ground-forward.png';
import streetPanorama from '../assets/cyber-lookaround.png';
import menuSkyline from '../assets/cyber-istanbul-street-2.png';

export type ViewStage = 'table' | 'peek' | 'panorama';

interface CyberSkylineProps {
  /** table = close-up looking straight down (default play view)
      peek = pulled back half-way, board shrinks toward the edge
      panorama = fully looked up, no board, just the street */
  stage?: ViewStage;
  /** menu = main menu / non-match screens, shows the full wide skyline instead of the stage photos */
  screen?: 'menu' | 'game';
}

export const CyberSkyline: React.FC<CyberSkylineProps> = ({ stage = 'table', screen = 'game' }) => {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const smoothX = useSpring(rawX, { stiffness: 40, damping: 20, mass: 0.6 });
  const smoothY = useSpring(rawY, { stiffness: 40, damping: 20, mass: 0.6 });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      rawX.set(nx);
      rawY.set(ny);
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [rawX, rawY]);

  const parallaxAmount = stage === 'panorama' ? 26 : stage === 'peek' ? 16 : 8;
  const cityX = useTransform(smoothX, (v) => v * parallaxAmount);
  const cityY = useTransform(smoothY, (v) => v * (parallaxAmount / 2));

  const isMenu = screen === 'menu';
  const isTable = !isMenu && stage === 'table';
  const isPeek = !isMenu && stage === 'peek';
  const isPanorama = !isMenu && stage === 'panorama';

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Base tone behind the image edges */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, var(--sky-top) 0%, var(--sky-bottom) 62%, var(--sky-bottom) 100%)' }}
      />

      {/* Menu — full wide skyline shot for the main menu / non-match screens. */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: isMenu ? 1 : 0 }}
        transition={{ duration: 0.9 }}
        style={{
          x: cityX,
          y: cityY,
          backgroundImage: `url(${menuSkyline})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Stage 1 — TABLE: close first-person POV looking straight down. */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: isTable ? 1 : 0 }}
        transition={{ duration: 0.9 }}
        style={{
          x: cityX,
          y: cityY,
          backgroundImage: `url(${groundClose})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Stage 2 — PEEK: leaned back, half ground / half street ahead. */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: isPeek ? 1 : 0 }}
        transition={{ duration: 0.9 }}
        style={{
          x: cityX,
          y: cityY,
          backgroundImage: `url(${groundForward})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Stage 3 — PANORAMA: fully looked up, the wide rainy street, no board. */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: isPanorama ? 1 : 0, scale: isPanorama ? 1.08 : 1 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
        style={{
          x: cityX,
          y: cityY,
          backgroundImage: `url(${streetPanorama})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Rain */}
      <div className="rain-layer absolute inset-0" />

      {/* Bottom fade so the scene blends into the UI/table area instead of a hard cutoff —
          lifted mostly out of the way in panorama, so the street reads full-height. */}
      <motion.div
        className="absolute inset-x-0 bottom-0"
        animate={{ opacity: isPanorama || isMenu ? 0.25 : 1 }}
        transition={{ duration: 0.8 }}
        style={{
          height: '30vh',
          background: 'linear-gradient(to bottom, transparent 0%, var(--ink) 100%)',
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ boxShadow: isPanorama || isMenu ? 'inset 0 0 10vh 2vh rgba(0,0,0,0.3)' : 'inset 0 0 18vh 4vh rgba(0,0,0,0.55)' }}
        transition={{ duration: 0.8 }}
      />
    </div>
  );
};

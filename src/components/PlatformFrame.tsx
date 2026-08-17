import React from 'react';
import { GameSettings } from '../types';
import { Tv, Volume2, VolumeX, Sparkles, Cpu, Layers, RotateCw, Palette, Home } from 'lucide-react';
import { PortraitGuard } from './PortraitGuard';
import { CyberSkyline, ViewStage } from './CyberSkyline';

interface PlatformFrameProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onOpenMetaLab: () => void;
  onGoToMenu?: () => void;
  neonChips: number;
  viewStage?: ViewStage;
  screen?: 'menu' | 'game';
  // Only the live match board needs to sit off-center to leave the AR street scene visible on
  // its left; every other screen (menu, map, equip, etc.) should stay centered in the viewport.
  offsetForBoard?: boolean;
  bossProtocolActive?: boolean;
  children: React.ReactNode;
}

export const PlatformFrame: React.FC<PlatformFrameProps> = ({
  settings,
  onUpdateSettings,
  onOpenMetaLab,
  onGoToMenu,
  neonChips,
  viewStage = 'table',
  screen = 'game',
  offsetForBoard = false,
  bossProtocolActive = false,
  children,
}) => {
  return (
    <div
      data-theme={settings.boardTheme}
      data-boss={bossProtocolActive ? 'protocol' : undefined}
      className="h-screen w-full bg-ink text-text flex flex-col font-sans overflow-hidden selection:bg-player selection:text-black transition-colors duration-700"
    >
      {/* Mandatory Portrait Guard for Mobile Devices */}
      <PortraitGuard />

      {/* Cyber-Istanbul parallax backdrop — the whole app sits on a table inside this scene */}
      <CyberSkyline stage={viewStage} screen={screen} />

      {/* Top Application Header / Controls */}
      <header className="relative overflow-hidden grain w-full bg-ink-2 border-b border-line px-2 sm:px-4 py-1 flex items-center justify-between gap-2 sm:gap-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-40 shrink-0">
        {/* Game Title Logo */}
        <div className="relative flex items-center gap-1.5 sm:gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-panel border border-player shadow-[0_0_10px_var(--player)]/30 flex items-center justify-center shrink-0">
            <span className="font-display font-black italic text-player text-[10px] sm:text-xs tracking-tighter">NX</span>
          </div>
          <h1 className="font-display text-[10px] sm:text-sm font-black italic tracking-tighter text-player drop-shadow-[0_0_8px_var(--player)]">
            NEXTGAMMON
          </h1>
        </div>

        {/* Right Controls: Meta Lab, Theme, Sound */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Return to Main Menu — only shown once you've actually left it */}
          {screen !== 'menu' && onGoToMenu && (
            <button
              onClick={onGoToMenu}
              className="p-1 sm:p-1.5 rounded-lg bg-panel border border-line hover:border-player text-text hover:text-player transition-colors"
              title="Return to Main Menu"
            >
              <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}

          {/* Permanent Cyber Lab Button */}
          <button
            onClick={onOpenMetaLab}
            className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-ink-2 border border-player hover:bg-player/10 text-player font-bold text-xs flex items-center gap-1 transition-all shadow-[0_0_12px_var(--player)]/20 group"
          >
            <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-player group-hover:rotate-45 transition-transform" />
            <span className="text-[9px] bg-panel text-success px-1 py-0.5 rounded font-mono font-bold border border-line">
              {neonChips}
            </span>
          </button>

          {/* Board Theme (Skin) Toggle */}
          <button
            onClick={() =>
              onUpdateSettings({
                boardTheme: settings.boardTheme === 'kiraathane' ? 'neon' : 'kiraathane',
              })
            }
            className="p-1 sm:p-1.5 rounded-lg bg-panel border border-line hover:border-player text-text transition-colors"
            title={`Board Skin: ${settings.boardTheme === 'kiraathane' ? 'Kıraathane 2088' : 'Neon Rogue'} (click to switch)`}
          >
            <Palette className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-player" />
          </button>

          {/* Audio Toggle + Volume Bar */}
          <div className="flex items-center gap-1 sm:gap-1.5 pl-1 pr-1.5 sm:pr-2 py-1 rounded-lg bg-panel border border-line">
            <button
              onClick={() => {
                if (settings.soundEnabled && settings.sfxVolume > 0) {
                  onUpdateSettings({ soundEnabled: false });
                } else {
                  onUpdateSettings({ soundEnabled: true, sfxVolume: settings.sfxVolume > 0 ? settings.sfxVolume : 0.5 });
                }
              }}
              className="p-0.5 text-text hover:text-player transition-colors shrink-0"
              title="Toggle Audio"
            >
              {settings.soundEnabled && settings.sfxVolume > 0 ? <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-player" /> : <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-text-muted" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.soundEnabled ? settings.sfxVolume : 0}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onUpdateSettings({ sfxVolume: v, soundEnabled: v > 0 });
              }}
              className="w-10 sm:w-16 h-1 cursor-pointer"
              style={{ accentColor: 'var(--player)' }}
              title="Volume"
            />
          </div>
        </div>
      </header>

      {/* Main Container Wrapper — always full-screen; the app targets iPad/desktop only, no
          mobile frame mockup. Offset right only for the live board so the AR street scene stays
          visible on its left; every other screen (including the menu) is centered. */}
      <main className="flex-1 min-h-0 flex items-center justify-center py-1 sm:py-2 px-2 sm:px-4 relative overflow-hidden">
        <div
          className={`w-full max-w-[900px] max-h-full flex flex-col justify-center overflow-hidden ${
            offsetForBoard ? 'ml-[22%] mr-2 sm:ml-[26%] sm:mr-4' : 'mx-auto'
          }`}
        >
          {children}
        </div>
      </main>

      {/* Footer bar styled per theme */}
      <footer className="h-7 bg-black border-t border-line flex items-center px-4 justify-between text-[9px] uppercase tracking-[0.2em] opacity-60 font-bold text-text-muted shrink-0">
        <span>Build v0.9.12-ALPHA (IPAD_READY)</span>
        <span className="text-player">© 2026 NEON_ROGUE_STUDIOS</span>
      </footer>

      {/* Optional CRT Scanlines Layer Overlay */}
      {settings.crtEffect && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      )}
    </div>
  );
};


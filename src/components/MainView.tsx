import * as React from "react";
import { Loader, Sun, Moon, RotateCw, Maximize } from "lucide-react";
import { Renderer3D } from "./Renderer3D.tsx";
import { useTranslation } from "react-i18next";

interface MainViewProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  agentInfo: { name: string; label: string };
  checkpointId: string | null;
  loading: boolean;
  elements: any[];
  autoRotateEnabled: boolean;
  setAutoRotateEnabled: (enabled: boolean) => void;
  cameraTarget: any;
  setCameraTarget: (target: any) => void;
}

/**
 * Main View component for the 3D-Render app.
 * Renders the header, main 3D scene, and footer.
 */
export function MainView({
  theme,
  setTheme,
  agentInfo,
  checkpointId,
  loading,
  elements,
  autoRotateEnabled,
  setAutoRotateEnabled,
  cameraTarget,
  setCameraTarget
}: MainViewProps) {
  const { t } = useTranslation('common');

  const resetCamera = () => {
    setCameraTarget({ position: [15, 10, 15], target: [0, 0, 0] });
  };

  return (
    <div className={`flex flex-col w-full h-full bg-transparent overflow-hidden text-[10px] ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      <header className={`px-4 py-2 ${theme === 'dark' ? 'bg-zinc-950/90 border-white/10' : 'bg-white/95 border-zinc-200'} backdrop-blur-xl border-b flex justify-between items-center z-10 shrink-0 shadow-sm transition-colors duration-500`}>
        <div className="flex items-center gap-2">
          <span className={`font-black tracking-tight text-xs ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{agentInfo.name}</span>
          <span className="text-zinc-500 opacity-50">-</span>
          <span className={`font-bold tracking-widest uppercase text-[9px] ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{agentInfo.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {checkpointId && (
            <span className={`font-mono font-bold ${theme === 'dark' ? 'text-zinc-400 bg-white/5 border-white/5' : 'text-zinc-500 bg-zinc-100 border-zinc-200'} px-2 py-1 rounded-lg text-[8px] border tabular-nums`}>
              {checkpointId.slice(0, 8)}...
            </span>
          )}
          {loading && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg">
              <Loader strokeWidth={3} className="w-2.5 h-2.5 animate-spin" />
              <span className="font-black uppercase tracking-widest text-[7px] leading-none">{t("generating")}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex items-center justify-center">
        <Renderer3D
          elements={elements}
          autoRotate={autoRotateEnabled}
          cameraTarget={cameraTarget}
          theme={theme}
        />
      </main>

      <footer className={`px-4 py-2 ${theme === 'dark' ? 'bg-zinc-950/90 border-white/10' : 'bg-white/95 border-zinc-200'} backdrop-blur-xl border-t flex items-center justify-between shrink-0 shadow-lg transition-colors duration-500`}>
        <div className="flex gap-4">
          <ParamItem label="Elements" value={elements.length} theme={theme} />
          <ParamItem label="Status" value="Live" theme={theme} active />
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-zinc-500/5 rounded-xl border border-white/5">
          <ControlButton
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            theme={theme}
          >
            {theme === 'dark' ? <Sun size={12} strokeWidth={2.5} /> : <Moon size={12} strokeWidth={2.5} />}
          </ControlButton>

          <ControlButton
            onClick={resetCamera}
            title="Reset Camera"
            theme={theme}
          >
            <Maximize size={12} strokeWidth={2.5} />
          </ControlButton>

          <ControlButton
            onClick={() => setAutoRotateEnabled(!autoRotateEnabled)}
            title="Auto-Rotate"
            theme={theme}
            active={autoRotateEnabled}
          >
            <RotateCw size={12} strokeWidth={2.5} className={autoRotateEnabled ? "animate-[spin_4s_linear_infinite]" : ""} />
          </ControlButton>

          <div className="mx-1 h-3 w-px bg-zinc-500/20" />

          <div className={`px-2 font-black uppercase tracking-[0.2em] text-[8px] ${theme === 'dark' ? 'text-zinc-700' : 'text-zinc-300'}`}>
            v1.0.0
          </div>
        </div>
      </footer>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  title,
  theme,
  active = false
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  theme: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center
        ${active
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
          : theme === 'dark'
            ? 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
            : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
      title={title}
    >
      {children}
    </button>
  );
}

function ParamItem({ label, value, theme, active = false }: { label: string; value: any; theme?: string; active?: boolean }) {
  return (
    <div className={`flex gap-2 items-center`}>
      <span className={`font-black uppercase tracking-[0.2em] text-[8px] ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>{label}</span>
      <div className={`px-2 py-0.5 rounded-full font-bold text-[9px] tabular-nums
        ${active
          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
          : theme === 'dark' ? 'bg-white/5 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
        }`}>
        {value}
      </div>
    </div>
  );
}

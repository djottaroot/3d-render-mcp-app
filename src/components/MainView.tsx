import { Loader, Sun, Moon } from "lucide-react";
import { Renderer3D } from "./Renderer3D.tsx";
import { useTranslation } from "react-i18next";
import pkg from "../../package.json";

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
  cameraTarget
}: MainViewProps) {
  const { t } = useTranslation('common');

  return (
    <div className={`flex flex-col w-full h-full bg-transparent overflow-hidden text-[10px] ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
      <header className={`px-3 py-1 ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-white/5' : 'bg-white/80 border-black/5'} backdrop-blur-md border-b flex justify-between items-center z-10 shrink-0`}>
        <div className="flex items-center gap-2">
          <span className={`font-black tracking-tight ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{agentInfo.name}</span>
          <span className="text-zinc-600">-</span>
          <span className={`font-bold tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{agentInfo.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {checkpointId && (
            <span className={`font-mono ${theme === 'dark' ? 'text-zinc-500 bg-white/5' : 'text-zinc-400 bg-black/5'} px-1.5 py-0.5 rounded text-[9px]`}>
              ID: {checkpointId}
            </span>
          )}
          {loading && (
            <div className="flex items-center gap-1.5 text-blue-400/80">
              <Loader strokeWidth={3} className="w-1.5 h-1.5 animate-spin" />
              <span className="font-bold tracking-widest text-[6px] leading-none">{t("generating")}</span>
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

      {elements.length > 0 && (
        <footer className={`px-3 py-1 ${theme === 'dark' ? 'bg-[#1a1a1a]/80 border-white/5' : 'bg-white/80 border-black/5'} backdrop-blur-md border-t flex items-center justify-between shrink-0`}>
          <div className="flex gap-3">
            {/* <ParamItem label="Elements" value={elements.length} theme={theme} /> */}
            <ParamItem label="Status" value="Live" theme={theme} />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-1 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300' : 'hover:bg-black/5 text-zinc-400 hover:text-zinc-600'}`}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={10} /> : <Moon size={10} />}
            </button>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={autoRotateEnabled}
                onChange={(e) => setAutoRotateEnabled(e.target.checked)}
                className={`w-2.5 h-2.5 rounded border-white/10 text-blue-500 focus:ring-0 focus:ring-offset-0 transition-all opacity-40 group-hover:opacity-100 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}
              />
              <span className={`font-bold uppercase tracking-widest text-[8px] transition-colors ${theme === 'dark' ? 'text-zinc-600 group-hover:text-zinc-400' : 'text-zinc-400 group-hover:text-zinc-600'}`}>Auto-Rotate</span>
            </label>
            <div className={`font-bold uppercase tracking-widest text-[8px] ${theme === 'dark' ? 'text-zinc-800' : 'text-zinc-300'}`}>
              v{pkg.version}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function ParamItem({ label, value, theme }: { label: string; value: any; theme?: string }) {
  return (
    <div className={`flex gap-1.5 items-baseline`}>
      <span className={`font-bold uppercase tracking-widest text-[8px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}:</span>
      <span className={`font-black ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{value}</span>
    </div>
  );
}

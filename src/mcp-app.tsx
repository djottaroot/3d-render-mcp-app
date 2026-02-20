import { useApp } from "@modelcontextprotocol/ext-apps/react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { useTranslation } from "react-i18next";
// import { ErrorScreen } from "./components/ErrorScreen.tsx";
import { LoadingScreen } from "./components/LoadingScreen.tsx";
import { MainView } from "./components/MainView.tsx";
import "./i18n.ts";
import "./index.css";

/**
 * Main Application component for the 3D-Render MCP App.
 * Handles state management, MCP app initialization, and UI layout.
 */
function App() {
  const { t } = useTranslation('common');
  const [elements, setElements] = useState<any[]>([]);
  const [checkpointId, setCheckpointId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentInfo, setAgentInfo] = useState({ name: '🤖 @Kéré', label: '3D Scene' });
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<any>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const { app } = useApp({
    appInfo: { name: "xlab-3d-render-mcp-app", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app: any) => {
      const getAgentInfo = (toolName: string) => {
        let name = '🤖 @Kéré';
        let label = toolName;

        switch (toolName.toLocaleLowerCase()) {
          case '3d_render_scene':
            label = '3D Scene';
            break;
          case 'read_checkpoint':
          case 'save_checkpoint':
            label = toolName === 'read_checkpoint' ? 'Lecture' : 'Sauvegarde';
            break;
        }
        return { name, label };
      };

      const restoreCheckpoint = async (elementsStr: string) => {
        try {
          const parsed = JSON.parse(elementsStr);
          const restoreEl = parsed.find((el: any) => el.type === "restoreCheckpoint");
          if (restoreEl?.id) {
            // @ts-ignore - callTool is available via bridge
            const result = await app.callTool("3d_read_checkpoint", { id: restoreEl.id });
            const content = (result as any)?.content?.[0]?.text;
            if (content) {
              const baseData = JSON.parse(content);
              if (baseData?.elements) {
                setElements(baseData.elements);
              }
            }
          }
        } catch (e) {
          console.warn("[3D-Render] Failed to auto-restore checkpoint:", e);
        }
      };

      app.ontoolinput = (input) => {
        setLoading(true);

        const toolName = (input as any).name || (input as any).toolName;
        if (toolName) {
          setAgentInfo(getAgentInfo(toolName));
        }

        const elementsStr = (input.arguments as any)?.elements;
        if (elementsStr) {
          restoreCheckpoint(elementsStr);
        }
      };

      app.ontoolresult = (result) => {
        setLoading(false);

        // Try structured content first
        let data = (result as any)?.structuredContent;

        // Fallback to parsing text content like Tic-Tac-Toe
        if (!data) {
          const content = (result as any)?.content?.[0]?.text;
          if (content) {
            try {
              data = JSON.parse(content);
            } catch (e) {
              console.error("[3D-Render] Failed to parse tool result content:", e);
            }
          }
        }

        if (data?.elements) {
          setElements(data.elements);
        }
        if (data?.checkpointId) {
          setCheckpointId(data.checkpointId);
        }
        if (data?.camera) {
          setCameraTarget(data.camera);
        }
      };
    },
  });

  // !!! Ne décommente pas !!!
  // if (error) return (
  //   <div className="flex flex-col items-center justify-center h-screen w-full bg-transparent text-white p-8 animate-in fade-in duration-700">
  //     <div className="glass-effect p-8 rounded-5xl flex flex-col items-center gap-6 max-w-sm text-center shadow-2xl border border-red-500/20">
  //       <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-2xl font-bold">!</div>
  //       <div className="space-y-2">
  //         <h1 className="text-2xl font-black tracking-tight">{t('mcp_error')}</h1>
  //         <p className="text-zinc-400 font-medium text-sm leading-relaxed lowercase">{error.message}</p>
  //       </div>
  //       <button
  //         onClick={() => window.location.reload()}
  //         className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold transition-all duration-300 hover:scale-105"
  //       >
  //         {t('retry')}
  //       </button>
  //     </div>
  //   </div>
  // );

  if (!app) return <LoadingScreen theme={theme} label={t('initialization')} />;

  return (
    <MainView
      theme={theme}
      setTheme={setTheme}
      agentInfo={agentInfo}
      checkpointId={checkpointId}
      loading={loading}
      elements={elements}
      autoRotateEnabled={autoRotateEnabled}
      setAutoRotateEnabled={setAutoRotateEnabled}
      cameraTarget={cameraTarget}
      setCameraTarget={setCameraTarget}
    />
  );
}


const root = createRoot(document.getElementById("root")!);
root.render(<App />);

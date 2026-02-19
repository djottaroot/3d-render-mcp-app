import { createMcpHandler } from "mcp-handler";
import path from "node:path";
import { registerTools } from "../src/server.js";
import { fileURLToPath } from "node:url";

const mcpHandler = createMcpHandler(
  (server) => {
    try {
      // Chemin robuste pour Vercel
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const distDir = path.resolve(__dirname, "../dist");
      console.log("[XLab 3D Render] Registering tools with distDir:", distDir);
      registerTools(server, distDir);
    } catch (error) {
      console.error("[XLab 3D Render] Fatal error during registerTools:", error);
    }
  },
  { serverInfo: { name: "XLab-3D-Render", version: "1.0.0" } },
  {
    basePath: "/mcp",
    maxDuration: 60,
    redisUrl: process.env.REDIS_URL
  },
);

const handler = async (request: Request) => {
  try {
    const url = new URL(request.url);

    // Support des deux chemins : direct (/mcp) et via rewrite (/api/mcp)
    if (url.pathname === "/api/mcp" || url.pathname.startsWith("/api/mcp/")) {
      url.pathname = url.pathname.replace("/api/mcp", "/mcp");
    } else if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      // Cas générique pour rester compatible avec le template
      url.pathname = url.pathname.replace("/api", "/mcp");
    }

    return await mcpHandler(new Request(url.toString(), request));
  } catch (error: any) {
    console.error("[XLab 3D Render] Global Handler Error:", error);
    return new Response(JSON.stringify({
      error: "Internal Server Error",
      message: error.message,
      stack: error.stack,
      path: new URL(request.url).pathname
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export { handler as GET, handler as POST, handler as DELETE };

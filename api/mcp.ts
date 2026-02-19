import { createMcpHandler } from "mcp-handler";
import path from "node:path";
import process from "node:process";
import { registerTools } from "../src/server.js";

const mcpHandler = createMcpHandler(
  (server) => {
    // In Vercel environment, the dist directory is at the root of the project after build
    // but sometimes it's nested or we need to fall back to process.cwd()
    const distDir = path.join(process.cwd(), "dist");
    console.log(`[MCP] Registering tools with distDir: ${distDir}`);
    registerTools(server, distDir);
  },
  { serverInfo: { name: "3D-Render", version: "1.0.0" } },
  { basePath: "", maxDuration: 60, sessionIdGenerator: undefined },
);

const handler = async (request: Request) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    url.pathname = url.pathname.replace("/api/", "/");
    return mcpHandler(new Request(url.toString(), request));
  }
  return mcpHandler(request);
};

export { handler as GET, handler as POST, handler as DELETE };

import { createMcpHandler } from "mcp-handler";
import path from "node:path";
import { registerTools } from "../src/server.js";

import { fileURLToPath } from "node:url";

const mcpHandler = createMcpHandler(
  (server) => {
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const distDir = path.resolve(__dirname, "../dist");
      registerTools(server, distDir);
    } catch (error) {
      console.error("[XLab 3D Render] Fatal error during registerTools:", error);
    }
  },
  { serverInfo: { name: "XLab 3D Render", version: "1.0.0" } },
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

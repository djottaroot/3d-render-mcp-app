import { createMcpHandler } from "mcp-handler";
import path from "node:path";
import process from "node:process";
import { registerTools } from "../src/server.js";

const mcpHandler = createMcpHandler(
  (server) => {
    try {
      // In Vercel environment, the dist directory is at the root of the project after build
      // but sometimes it's nested or we need to fall back to process.cwd()
      const distDir = path.join(process.cwd(), "dist");
      console.log(`[MCP] Registering tools with distDir: ${distDir}`);
      registerTools(server, distDir);
      console.log(`[MCP] Tools registered successfully`);
    } catch (error) {
      console.error(`[MCP] Error during tool registration:`, error);
      throw error;
    }
  },
  { serverInfo: { name: "3D-Render", version: "1.0.0" } },
  { basePath: "", maxDuration: 60, sessionIdGenerator: undefined },
);

const handler = async (request: Request) => {
  try {
    const url = new URL(request.url);
    console.log(`[MCP] Handling ${request.method} request to ${url.pathname}`);

    if (url.pathname.startsWith("/api/")) {
      const newUrl = new URL(url.toString());
      newUrl.pathname = url.pathname.replace("/api/", "/");
      return await mcpHandler(new Request(newUrl.toString(), request as any));
    }
    return await mcpHandler(request);
  } catch (error) {
    console.error(`[MCP] Critical handler error:`, error);
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32603, message: "Internal server error", data: String(error) },
      id: null,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export { handler as GET, handler as POST, handler as DELETE };

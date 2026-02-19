import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import { RECALL_CHEAT_SHEET } from "./utils.js";
import { RedisCheckpointStore, MemoryCheckpointStore, type CheckpointStore } from "./checkpoint-store.js";

const DIST_DIR = (import.meta as any).filename?.endsWith(".ts")
  ? path.join((import.meta as any).dirname, "..", "dist")
  : (import.meta as any).dirname || process.cwd();

// Initialize Checkpoint Store
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const store: CheckpointStore = (redisUrl && redisToken)
  ? RedisCheckpointStore.getInstance(redisUrl, redisToken)
  : MemoryCheckpointStore.getInstance();

if (store instanceof MemoryCheckpointStore) {
  console.warn("[3D-Render] Using MemoryCheckpointStore (Redis credentials missing)");
}

/**
 * Registers 3D Render tools and resources with the MCP server.
 */
export function registerTools(server: McpServer, distDir: string): void {
  const resourceUri = "ui://3d-render/mcp-app.html";

  // 1. 3d_read_me tool
  server.registerTool(
    "3d_read_me",
    {
      description: "Returns the 3D Scene element format reference with primitives, state management tips, and examples. Call this BEFORE using 3d_render_scene for the first time.",
      annotations: { readOnlyHint: true },
    },
    async (): Promise<CallToolResult> => {
      return { content: [{ type: "text", text: RECALL_CHEAT_SHEET }] };
    },
  );

  // 2. 3d_render_scene tool
  registerAppTool(server,
    "3d_render_scene",
    {
      title: "Render 3D Scene",
      description: `Renders a 3D scene using primitives like cubes, spheres, and cylinders.
Elements are streamed for progressive updates.
Call 3d_read_me first to learn the element format.`,
      inputSchema: z.object({
        elements: z.string().describe(
          "JSON array string of 3D elements. Must be valid JSON. Keep compact. Call 3d_read_me first for format reference."
        ),
        camera: z.object({
          position: z.array(z.number()).length(3).describe("Camera position [x, y, z]"),
          target: z.array(z.number()).length(3).optional().describe("Camera target [x, y, z]")
        }).optional().describe("Explicit camera override for cinematic shots.")
      }),
      annotations: { readOnlyHint: true },
      _meta: { ui: { resourceUri } },
    },
    async ({ elements, camera: cameraArg }): Promise<CallToolResult> => {
      let parsed: any[];
      try {
        parsed = JSON.parse(elements);
      } catch (e) {
        return {
          content: [{ type: "text", text: `Invalid JSON in elements: ${(e as Error).message}. Ensure proper quoting and no trailing commas.` }],
          isError: true,
        };
      }

      // Resolve restoreCheckpoint references
      const restoreEl = parsed.find((el: any) => el.type === "restoreCheckpoint");
      let resolvedElements: any[];

      if (restoreEl?.id) {
        const base = await store.load(restoreEl.id);
        if (!base) {
          return {
            content: [{ type: "text", text: `Checkpoint "${restoreEl.id}" not found. It may have expired or never existed.` }],
            isError: true,
          };
        }

        const deleteIds = new Set<string>();
        for (const el of parsed) {
          if (el.type === "delete") {
            for (const id of String(el.ids || el.id).split(",")) deleteIds.add(id.trim());
          }
        }

        const baseFiltered = base.elements.filter((el: any) => !deleteIds.has(el.id));
        const newEls = parsed.filter((el: any) => el.type !== "restoreCheckpoint" && el.type !== "delete");
        resolvedElements = [...baseFiltered, ...newEls];
      } else {
        resolvedElements = parsed.filter((el: any) => el.type !== "delete" && el.type !== "restoreCheckpoint");
      }

      const checkpointId = crypto.randomUUID().replace(/-/g, "").slice(0, 18);
      await store.save(checkpointId, { elements: resolvedElements });


      return {
        content: [{
          type: "text",
          text: `3D Scene updated! Checkpoint ID: "${checkpointId}".\nTo modify this scene, use: [{"type":"restoreCheckpoint","id":"${checkpointId}"}, ...]`
        }],
        structuredContent: { checkpointId, elements: resolvedElements, camera: cameraArg },
      };
    },
  );

  // 3. Private tools for widget synchronization
  server.registerTool("3d_read_checkpoint",
    {
      description: "Private: Loads a checkpoint.",
      inputSchema: z.object({ id: z.string() }),
      annotations: { readOnlyHint: true }
    },
    async ({ id }) => {
      const data = await store.load(id);
      return { content: [{ type: "text", text: JSON.stringify(data || { elements: [] }) }] };
    }
  );

  server.registerTool("3d_save_checkpoint",
    {
      description: "Private: Saves a checkpoint from manual edits.",
      inputSchema: z.object({ id: z.string(), elements: z.array(z.any()) })
    },
    async ({ id, elements }) => {
      await store.save(id, { elements });
      return { content: [{ type: "text", text: "Saved" }] };
    }
  );

  registerAppResource(server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const pathsToTry = [
        path.join(distDir, "mcp-app.html"),
        path.join(distDir, "src", "mcp-app.html"),
        path.join(process.cwd(), "dist", "mcp-app.html"),
        path.join(process.cwd(), "mcp-app.html"),
      ];

      let html = "";
      for (const p of pathsToTry) {
        try {
          html = await fs.readFile(p, "utf-8");
          console.log(`[3D-Render] Successfully read mcp-app.html from: ${p}`);
          break;
        } catch (e) {
          console.log(`[3D-Render] Checked path ${p}: Not found`);
          continue;
        }
      }

      if (!html) {
        const error = `Could not find mcp-app.html in any of: ${pathsToTry.join(", ")}`;
        console.error(`[3D-Render] ${error}`);
        throw new Error(error);
      }

      return {
        contents: [{
          uri: resourceUri,
          mimeType: RESOURCE_MIME_TYPE,
          text: html,
          _meta: {
            ui: {
              prefersBorder: true,
              permissions: { clipboardWrite: {} },
            },
          },
        }],
      };
    }
  );
}

/**
 * Creates and initializes the 3D Render MCP server.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "3D-Render",
    version: "1.0.0",
  });

  registerTools(server, DIST_DIR);
  return server;
}

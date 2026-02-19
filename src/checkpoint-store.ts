import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL!;
const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

export interface CheckpointData {
  elements: any[];
}

export interface CheckpointStore {
  save(id: string, data: CheckpointData): Promise<void>;
  load(id: string): Promise<CheckpointData | null>;
}

export class RedisCheckpointStore implements CheckpointStore {
  private static instance: RedisCheckpointStore | null = null;
  private redis: Redis;

  private constructor() {
    this.redis = new Redis({
      url,
      token,
    });
  }

  public static getInstance(): RedisCheckpointStore | null {
    try {
      if (!RedisCheckpointStore.instance) {
        RedisCheckpointStore.instance = new RedisCheckpointStore();
      }
      return RedisCheckpointStore.instance;
    } catch (error) {
      console.error("Failed to initialize RedisCheckpointStore:", error);
      return null;
    }
  }

  async save(id: string, data: CheckpointData): Promise<void> {
    await this.redis.set(`checkpoint:${id}`, JSON.stringify(data), { ex: 60 * 60 * 24 * 7 }); // 7 days expiry
  }

  async load(id: string): Promise<CheckpointData | null> {
    const data = await this.redis.get<string>(`checkpoint:${id}`);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  }
}

export class MemoryCheckpointStore implements CheckpointStore {
  private static instance: MemoryCheckpointStore | null = null;
  private store = new Map<string, CheckpointData>();

  private constructor() { }

  public static getInstance(): MemoryCheckpointStore {
    if (!MemoryCheckpointStore.instance) {
      MemoryCheckpointStore.instance = new MemoryCheckpointStore();
    }
    return MemoryCheckpointStore.instance;
  }

  async save(id: string, data: CheckpointData): Promise<void> {
    this.store.set(id, data);
  }

  async load(id: string): Promise<CheckpointData | null> {
    return this.store.get(id) || null;
  }
}

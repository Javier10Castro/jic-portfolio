interface StoreAdapter {
  getName(): string;
  getState(): Record<string, unknown>;
  setState(data: Record<string, unknown>): void;
  getBackendState(): Promise<Record<string, unknown>>;
  merge(backend: Record<string, unknown>, local: Record<string, unknown>): Record<string, unknown>;
  validate(state: Record<string, unknown>): string[];
}

interface SyncStatus {
  synced: boolean;
  lastSync: number | null;
  dirty: boolean;
  validationErrors: string[];
  reconciling: boolean;
}

interface SyncEngineConfig {
  storagePrefix?: string;
  autoSyncInterval?: number;
  debug?: boolean;
}

type ReconnectHandler = () => void | Promise<void>;

const DEFAULT_CONFIG: Required<SyncEngineConfig> = {
  storagePrefix: 'studio:sync:',
  autoSyncInterval: 30000,
  debug: false,
};

const UI_ONLY_FIELDS: Record<string, string[]> = {
  conversation: ['isStreaming', 'isGenerating', 'editing'],
  pipeline: [],
  deployment: [],
};

class PersistentCache {
  private prefix: string;

  constructor(prefix: string = 'studio:sync:') {
    this.prefix = prefix;
  }

  save(key: string, data: unknown): void {
    try {
      const serialized = JSON.stringify(data);
      sessionStorage.setItem(this.prefix + key, serialized);
    } catch {
      if (typeof console !== 'undefined') {
        console.warn(`[sync] Failed to persist key "${key}"`);
      }
    }
  }

  load<T = unknown>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(this.prefix + key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  clear(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }

  clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(this.prefix)) {
        keys.push(k);
      }
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  }
}

function findArraysWithIds(obj: unknown): Array<Array<Record<string, unknown>>> {
  const results: Array<Array<Record<string, unknown>>> = [];
  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && 'id' in (value[0] as Record<string, unknown>)) {
        results.push(value as Array<Record<string, unknown>>);
      }
      value.forEach(walk);
    } else if (typeof value === 'object' && value !== null) {
      Object.values(value as Record<string, unknown>).forEach(walk);
    }
  }
  walk(obj);
  return results;
}

function defaultValidate(state: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (!state || typeof state !== 'object') {
    errors.push('State is null or not an object');
    return errors;
  }

  const arrays = findArraysWithIds(state);
  for (const arr of arrays) {
    const ids = arr.map((item) => item.id as string | undefined).filter(Boolean);
    const seen = new Set<string>();
    for (const id of ids) {
      if (!id) continue;
      if (seen.has(id)) {
        errors.push(`Duplicate entity ID found: "${id}"`);
      }
      seen.add(id);
    }
  }

  const allIds = new Map<string, string[]>();
  for (const arr of arrays) {
    for (const item of arr) {
      const id = item.id as string | undefined;
      if (id) {
        const type = ((item as Record<string, unknown>).type as string) || 'entity';
        if (!allIds.has(type)) allIds.set(type, []);
        allIds.get(type)!.push(id);
      }
    }
  }
  const idSet = new Set<string>();
  for (const [, ids] of allIds) ids.forEach((id) => idSet.add(id));

  for (const arr of arrays) {
    for (const item of arr) {
      for (const [key, value] of Object.entries(item)) {
        if (key.endsWith('Id') && typeof value === 'string' && value.length > 0) {
          if (!idSet.has(value)) {
            errors.push(`Orphaned reference "${key}: ${value}"`);
          }
        }
        if (key.endsWith('Ids') && Array.isArray(value)) {
          for (const refId of value as string[]) {
            if (typeof refId === 'string' && refId.length > 0 && !idSet.has(refId)) {
              errors.push(`Orphaned reference "${key}: ${refId}"`);
            }
          }
        }
      }
    }
  }

  const STATUS_TRANSITIONS: Record<string, string[]> = {
    idle: ['running'],
    running: ['completed', 'failed', 'paused'],
    paused: ['running'],
    completed: [],
    failed: ['running'],
    active: ['archived', 'completed'],
    draft: ['active'],
    archived: [],
    pending: ['running'],
  };

  const validStatuses = new Set(Object.keys(STATUS_TRANSITIONS));

  function findStatusFields(obj: Record<string, unknown>, path: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'status' && typeof value === 'string') {
        if (!validStatuses.has(value)) {
          errors.push(`Invalid status value "${value}" at ${path}${key}`);
        }
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        findStatusFields(value as Record<string, unknown>, `${path}${key}.`);
      }
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === 'object' && value[i] !== null) {
            findStatusFields(value[i] as Record<string, unknown>, `${path}${key}[${i}].`);
          }
        }
      }
    }
  }
  findStatusFields(state);

  const requiredFields = ['id', 'name', 'title', 'status', 'createdAt'];
  for (const arr of arrays) {
    for (const item of arr) {
      for (const field of requiredFields) {
        if (field === 'title' && 'name' in item) continue;
        if (field === 'name' && 'title' in item) continue;
        if (field === 'createdAt' && 'timestamp' in item) continue;
        if (!(field in item) || item[field] === undefined || item[field] === null || item[field] === '') {
          errors.push(`Missing required field "${field}" in entity "${(item.id as string) || 'unknown'}"`);
        }
      }
    }
  }

  return errors;
}

function defaultMerge(
  backend: Record<string, unknown>,
  local: Record<string, unknown>,
  uiFields: string[]
): Record<string, unknown> {
  const merged = { ...backend };
  for (const field of uiFields) {
    if (field in local) {
      merged[field] = local[field];
    }
  }
  return merged;
}

class SyncManager {
  private adapters = new Map<string, StoreAdapter>();
  private statuses = new Map<string, SyncStatus>();
  private cache: PersistentCache;
  private config: Required<SyncEngineConfig>;
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectHandlers: ReconnectHandler[] = [];
  private log: (...args: unknown[]) => void;

  constructor(config?: SyncEngineConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new PersistentCache(this.config.storagePrefix);
    this.log = this.config.debug
      ? (...args: unknown[]) => console.log('[sync]', ...args)
      : () => {};
  }

  registerStore(name: string, adapter: StoreAdapter): void {
    if (this.adapters.has(name)) {
      this.log(`Store "${name}" already registered, overwriting`);
    }
    this.adapters.set(name, adapter);
    this.statuses.set(name, {
      synced: false,
      lastSync: null,
      dirty: true,
      validationErrors: [],
      reconciling: false,
    });
    this.log(`Registered store "${name}"`);

    if (this.adapters.size === 1 && this.config.autoSyncInterval > 0) {
      this.startAutoSync();
    }
  }

  private startAutoSync(): void {
    if (this.autoSyncTimer) clearInterval(this.autoSyncTimer);
    this.autoSyncTimer = setInterval(() => {
      this.sync().catch((err) => this.log('Auto-sync failed', err));
    }, this.config.autoSyncInterval);
  }

  private stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  onReconnect(handler: ReconnectHandler): () => void {
    this.reconnectHandlers.push(handler);
    return () => {
      const idx = this.reconnectHandlers.indexOf(handler);
      if (idx !== -1) this.reconnectHandlers.splice(idx, 1);
    };
  }

  async reconnect(): Promise<void> {
    this.log('Reconnecting SSE...');
    for (const handler of this.reconnectHandlers) {
      try {
        await handler();
      } catch (err) {
        this.log('Reconnect handler failed', err);
      }
    }
    await this.sync();
  }

  async sync(): Promise<void> {
    this.log('Running full sync...');
    const promises: Promise<void>[] = [];
    for (const [name] of this.adapters) {
      promises.push(this.syncOne(name));
    }
    await Promise.allSettled(promises);
    this.persist();
  }

  private async syncOne(name: string): Promise<void> {
    const adapter = this.adapters.get(name);
    if (!adapter) return;

    const status = this.statuses.get(name)!;
    status.reconciling = true;

    try {
      const backend = await adapter.getBackendState();
      const local = adapter.getState();
      const uiFields = UI_ONLY_FIELDS[name] || [];
      const merged = adapter.merge(backend, local);
      const finalMerged = merged === backend || merged === local
        ? defaultMerge(backend, local, uiFields)
        : merged;
      const errors = adapter.validate(finalMerged);

      if (errors.length > 0) {
        status.validationErrors = errors;
        status.synced = false;
        status.dirty = true;
        this.log(`Sync validation failed for "${name}"`, errors);
        return;
      }

      adapter.setState(finalMerged);
      status.synced = true;
      status.lastSync = Date.now();
      status.dirty = false;
      status.validationErrors = [];
      this.log(`Synced store "${name}"`);
    } catch (err) {
      status.synced = false;
      status.dirty = true;
      status.validationErrors = [`Sync failed: ${String(err)}`];
      this.log(`Sync error for "${name}"`, err);
    } finally {
      status.reconciling = false;
    }
  }

  async refresh(name: string): Promise<void> {
    this.log(`Refreshing store "${name}"`);
    await this.syncOne(name);
    this.persist();
  }

  invalidate(name: string): void {
    const status = this.statuses.get(name);
    if (status) {
      status.dirty = true;
      status.synced = false;
      this.log(`Invalidated store "${name}"`);
    }
  }

  hydrate(): void {
    this.log('Hydrating from cache...');
    for (const [name, adapter] of this.adapters) {
      const cached = this.cache.load<Record<string, unknown>>(name);
      if (cached !== null) {
        const errors = adapter.validate(cached);
        if (errors.length === 0) {
          adapter.setState(cached);
          const status = this.statuses.get(name);
          if (status) {
            status.synced = true;
            status.lastSync = Date.now();
            status.dirty = false;
            status.validationErrors = [];
          }
          this.log(`Hydrated store "${name}"`);
        } else {
          this.log(`Hydration validation failed for "${name}"`, errors);
        }
      }
    }
  }

  async reconcile(name: string): Promise<void> {
    const adapter = this.adapters.get(name);
    if (!adapter) return;

    const status = this.statuses.get(name);
    if (!status) return;

    this.log(`Reconciling store "${name}"`);
    status.reconciling = true;

    try {
      const backend = await adapter.getBackendState();
      const local = adapter.getState();

      if (JSON.stringify(backend) === JSON.stringify(local)) {
        status.dirty = false;
        status.synced = true;
        status.lastSync = Date.now();
        this.log(`Store "${name}" already in sync`);
        return;
      }

      const uiFields = UI_ONLY_FIELDS[name] || [];
      const merged = defaultMerge(backend, local, uiFields);
      const errors = adapter.validate(merged);

      if (errors.length > 0) {
        status.validationErrors = errors;
        status.synced = false;
        this.log(`Reconciliation validation failed for "${name}"`, errors);
        return;
      }

      adapter.setState(merged);
      status.synced = true;
      status.lastSync = Date.now();
      status.dirty = false;
      status.validationErrors = [];
      this.log(`Reconciled store "${name}"`);
      this.persist();
    } catch (err) {
      status.validationErrors = [`Reconciliation failed: ${String(err)}`];
      this.log(`Reconciliation error for "${name}"`, err);
    } finally {
      status.reconciling = false;
    }
  }

  getStatus(name: string): SyncStatus | null {
    return this.statuses.get(name) ?? null;
  }

  getAllStatus(): Record<string, SyncStatus> {
    const result: Record<string, SyncStatus> = {};
    for (const [name, status] of this.statuses) {
      result[name] = { ...status };
    }
    return result;
  }

  persist(): void {
    this.log('Persisting state...');
    for (const [name, adapter] of this.adapters) {
      const state = adapter.getState();
      this.cache.save(name, state);
    }
  }

  destroy(): void {
    this.stopAutoSync();
    this.adapters.clear();
    this.statuses.clear();
    this.reconnectHandlers = [];
    this.log('SyncManager destroyed');
  }
}

const singletonConfig =
  typeof globalThis !== 'undefined' &&
  (globalThis as Record<string, unknown>)['__SYNC_ENGINE_CONFIG']
    ? ((globalThis as Record<string, unknown>)[
        '__SYNC_ENGINE_CONFIG'
      ] as SyncEngineConfig)
    : undefined;

export const syncEngine = new SyncManager(singletonConfig);

export type { StoreAdapter, SyncStatus, SyncEngineConfig };
export { PersistentCache, SyncManager };

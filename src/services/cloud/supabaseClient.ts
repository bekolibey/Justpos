import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface CloudRuntimeConfig {
  url: string;
  anonKey: string;
  tableName: string;
}

const CLOUD_CONFIG_STORAGE_KEY = 'restoran-pos-cloud-config-v1';

const normalizeConfig = (config: Partial<CloudRuntimeConfig> | null | undefined): CloudRuntimeConfig | null => {
  const url = config?.url?.trim() ?? '';
  const anonKey = config?.anonKey?.trim() ?? '';
  const tableName = config?.tableName?.trim() || import.meta.env.VITE_SUPABASE_STATE_TABLE?.trim() || 'pos_snapshots';

  if (!url || !anonKey) {
    return null;
  }

  return {
    url,
    anonKey,
    tableName,
  };
};

const getEnvConfig = () =>
  normalizeConfig({
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    tableName: import.meta.env.VITE_SUPABASE_STATE_TABLE,
  });

const getStoredConfig = (): CloudRuntimeConfig | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(CLOUD_CONFIG_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeConfig(JSON.parse(raw) as Partial<CloudRuntimeConfig>);
  } catch (_error) {
    window.localStorage.removeItem(CLOUD_CONFIG_STORAGE_KEY);
    return null;
  }
};

const clientCache = new Map<string, SupabaseClient>();

export const REQUIRED_CLOUD_TABLES = [
  'pos_workspaces',
  'pos_waiters',
  'pos_terminals',
  'pos_menu_items',
  'pos_modifier_groups',
  'pos_modifier_options',
  'pos_tables',
  'pos_order_items',
  'pos_order_item_modifiers',
  'pos_order_audit_logs',
  'pos_transactions',
] as const;

export const getCloudRuntimeConfig = () => getStoredConfig() ?? getEnvConfig();

export const saveCloudRuntimeConfig = (config: Partial<CloudRuntimeConfig>) => {
  if (typeof window === 'undefined') {
    return null;
  }

  const normalized = normalizeConfig(config);
  if (!normalized) {
    throw new Error('Supabase URL ve Anon Key zorunludur.');
  }

  window.localStorage.setItem(CLOUD_CONFIG_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

export const clearCloudRuntimeConfig = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(CLOUD_CONFIG_STORAGE_KEY);
};

export const isCloudSyncEnabled = () => Boolean(getCloudRuntimeConfig());

export const getSupabaseStateTable = () => getCloudRuntimeConfig()?.tableName ?? 'pos_snapshots';

export const getSupabaseClient = () => {
  const config = getCloudRuntimeConfig();
  if (!config) {
    return null;
  }

  const cacheKey = `${config.url}::${config.anonKey}`;
  const cachedClient = clientCache.get(cacheKey);
  if (cachedClient) {
    return cachedClient;
  }

  const client = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  clientCache.set(cacheKey, client);
  return client;
};

export const testCloudConnection = async () => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cloud ayarı bulunamadı.');
  }

  const { error } = await client.from('pos_workspaces').select('code', { head: true, count: 'exact' }).limit(1);

  if (error) {
    throw error;
  }

  return true;
};

export interface CloudTableInspection {
  table: string;
  ok: boolean;
  errorCode?: string;
}

export const inspectCloudTables = async (): Promise<CloudTableInspection[]> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Cloud ayarı bulunamadı.');
  }

  const results = await Promise.all(
    REQUIRED_CLOUD_TABLES.map(async (table) => {
      const { error } = await client.from(table).select('*', { head: true, count: 'exact' }).limit(1);

      return {
        table,
        ok: !error,
        errorCode: error?.code,
      };
    }),
  );

  return results;
};

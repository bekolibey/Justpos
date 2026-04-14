import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { MENU_ITEMS } from '../data/menu';
import { INITIAL_TABLES } from '../data/mockTables';
import { INITIAL_TRANSACTIONS } from '../data/mockTransactions';
import { TERMINALS } from '../data/terminals';
import { WAITER_NAMES } from '../data/waiters';
import { MOCK_USER } from '../data/users';
import {
  normalizeWorkspaceCode,
  readCloudSnapshot,
  writeCloudSnapshot,
} from '../services/cloud/cloudState';
import { inspectCloudTables, isCloudSyncEnabled } from '../services/cloud/supabaseClient';
import type {
  MenuCategory,
  MenuItem,
  ModifierOption,
  OperationResult,
  OrderAuditAction,
  OrderAuditLog,
  OrderItem,
  OrderItemStatus,
  PaymentStatus,
  PaymentTransaction,
  PaymentType,
  PortionMultiplier,
  ServiceStatus,
  SplitPartMethod,
  Table,
  TableStatus,
  Terminal,
  ToastMessage,
} from '../types/pos';
import {
  createAdisyonNo,
  createMenuItemId,
  createOrderLogId,
  createRefundReferenceNo,
  createToastId,
  createTransactionId,
} from '../utils/ids';
import { resolveStatusAfterOrderChange } from '../utils/order';

interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  role: string;
  workplace: string;
}

interface LoginInput {
  username: string;
  password: string;
  workplace: string;
}

interface LoginResult {
  ok: boolean;
  message?: string;
}

interface CreateTransactionInput {
  tableId: string;
  terminalId: string;
  waiterName?: string;
  paymentType: PaymentType;
  amount: number;
  status: PaymentStatus;
  splitMethod?: SplitPartMethod;
  referenceNo?: string;
  errorCode?: string;
}

interface RefundTransactionInput {
  transactionId: string;
  amount?: number;
  note?: string;
  terminalId?: string;
}

interface AddMenuItemInput {
  name: string;
  category: MenuCategory;
  price: number;
}

interface AddProductConfig {
  portionMultiplier?: PortionMultiplier;
  seatNo?: number;
  modifiers?: ModifierOption[];
  note?: string;
}

interface POSContextValue {
  user: AuthUser | null;
  menuItems: MenuItem[];
  favoriteMenuItemIds: string[];
  recentMenuItemIds: string[];
  tableServiceStatusById: Record<string, ServiceStatus>;
  waiters: readonly string[];
  terminals: Terminal[];
  tables: Table[];
  transactions: PaymentTransaction[];
  toasts: ToastMessage[];
  cloudStatus: {
    enabled: boolean;
    mode: 'local' | 'cloud';
    hydrationState: 'idle' | 'loading' | 'ready' | 'error';
    syncState: 'idle' | 'syncing' | 'synced' | 'error';
    lastSyncedAt: string | null;
    lastError: string | null;
    missingTables: string[];
  };
  login: (input: LoginInput) => LoginResult;
  logout: () => void;
  addMenuItem: (input: AddMenuItemInput) => OperationResult;
  toggleFavoriteMenuItem: (menuItemId: string) => void;
  addConfiguredProductToTable: (tableId: string, item: MenuItem, config?: AddProductConfig) => void;
  addProductToTable: (tableId: string, item: MenuItem, portionMultiplier?: PortionMultiplier) => void;
  incrementOrderItem: (tableId: string, menuItemId: string) => void;
  decrementOrderItem: (tableId: string, menuItemId: string) => void;
  setOrderItemSeat: (tableId: string, menuItemId: string, seatNo: number) => void;
  markOrderItem: (tableId: string, menuItemId: string, status: Extract<OrderItemStatus, 'IPTAL' | 'IKRAM'>, reason: string) => OperationResult;
  restoreOrderItem: (tableId: string, menuItemId: string) => OperationResult;
  setTableGuestCount: (tableId: string, guestCount: number) => void;
  setTableCover: (tableId: string, enabled: boolean) => void;
  setTableWaiter: (tableId: string, waiterName: string) => void;
  setTableServiceStatus: (tableId: string, serviceStatus: ServiceStatus) => void;
  setTableStatus: (tableId: string, status: TableStatus) => void;
  markTableAsPaymentWaiting: (tableId: string) => void;
  markTableAsPaid: (tableId: string) => void;
  closeTable: (tableId: string) => void;
  mergeTables: (sourceTableId: string, targetTableId: string) => OperationResult;
  moveTable: (sourceTableId: string, targetTableId: string) => OperationResult;
  splitTable: (sourceTableId: string, targetTableId: string, ratio: number) => OperationResult;
  createTransaction: (input: CreateTransactionInput) => PaymentTransaction | null;
  getRefundableAmount: (transactionId: string) => number;
  refundTransaction: (input: RefundTransactionInput) => OperationResult;
  forceCloudSync: () => Promise<OperationResult>;
  pushToast: (message: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (toastId: string) => void;
}

const POSContext = createContext<POSContextValue | null>(null);

const SESSION_STORAGE_KEY = 'vakif-pos-auth-v1';
const APP_STORAGE_KEY = 'vakif-pos-state-v2';
const RECENT_MENU_ITEMS_STORAGE_KEY = 'vakif-pos-recent-menu-items-v1';
const FAVORITE_MENU_ITEMS_STORAGE_KEY = 'vakif-pos-favorite-menu-items-v1';
const TABLE_SERVICE_STATUS_STORAGE_KEY = 'vakif-pos-table-service-status-v1';
const DEFAULT_FAVORITE_MENU_ITEM_IDS = [
  'main-adana-kebap',
  'main-tavuk-sis',
  'drink-ayran',
  'drink-kola',
];
const DEFAULT_TABLE_SERVICE_STATUSES: Record<string, ServiceStatus> = {
  'table-2': 'MUTFAKTA',
  'table-5': 'HAZIR',
  'table-7': 'SERVISTE',
  'table-11': 'MUTFAKTA',
};

interface PersistedAppState {
  menuItems: MenuItem[];
  tables: Table[];
  transactions: PaymentTransaction[];
}

const loadPersistedSession = (): AuthUser | null => {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch (_error) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

const loadPersistedAppState = (): PersistedAppState => {
  const raw = localStorage.getItem(APP_STORAGE_KEY);
  if (!raw) {
    return {
      menuItems: MENU_ITEMS,
      tables: INITIAL_TABLES,
      transactions: INITIAL_TRANSACTIONS,
    };
  }

  try {
    const parsed = JSON.parse(raw) as PersistedAppState;

    if (!Array.isArray(parsed.tables) || !Array.isArray(parsed.transactions)) {
      return {
        menuItems: MENU_ITEMS,
        tables: INITIAL_TABLES,
        transactions: INITIAL_TRANSACTIONS,
      };
    }

    const restoredMenuItems = Array.isArray(parsed.menuItems) && parsed.menuItems.length > 0 ? parsed.menuItems : MENU_ITEMS;

    return {
      menuItems: restoredMenuItems,
      tables: parsed.tables,
      transactions: parsed.transactions,
    };
  } catch (_error) {
    localStorage.removeItem(APP_STORAGE_KEY);
    return {
      menuItems: MENU_ITEMS,
      tables: INITIAL_TABLES,
      transactions: INITIAL_TRANSACTIONS,
    };
  }
};

const loadPersistedRecentMenuItems = (): string[] => {
  const raw = localStorage.getItem(RECENT_MENU_ITEMS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
  } catch (_error) {
    localStorage.removeItem(RECENT_MENU_ITEMS_STORAGE_KEY);
    return [];
  }
};

const loadPersistedFavoriteMenuItems = (): string[] => {
  const raw = localStorage.getItem(FAVORITE_MENU_ITEMS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_FAVORITE_MENU_ITEM_IDS;
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
  } catch (_error) {
    localStorage.removeItem(FAVORITE_MENU_ITEMS_STORAGE_KEY);
    return [];
  }
};

const loadPersistedTableServiceStatuses = (): Record<string, ServiceStatus> => {
  const raw = localStorage.getItem(TABLE_SERVICE_STATUS_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_TABLE_SERVICE_STATUSES;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, ServiceStatus>;
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) =>
        ['BEKLIYOR', 'MUTFAKTA', 'HAZIR', 'SERVISTE'].includes(value),
      ),
    ) as Record<string, ServiceStatus>;
  } catch (_error) {
    localStorage.removeItem(TABLE_SERVICE_STATUS_STORAGE_KEY);
    return {};
  }
};

const createOrderList = (items: OrderItem[], target: MenuItem, config?: AddProductConfig): OrderItem[] => {
  const portionMultiplier = config?.portionMultiplier ?? 1;
  const seatNo = config?.seatNo && config.seatNo > 0 ? Math.floor(config.seatNo) : undefined;
  const note = config?.note?.trim() ? config.note.trim() : undefined;
  const modifiers =
    config?.modifiers?.map((modifier) => ({
      id: modifier.id,
      name: modifier.name,
      price: Number(modifier.price.toFixed(2)),
    })) ?? [];
  const modifiersTotal = modifiers.reduce((sum, modifier) => sum + modifier.price, 0);
  const itemName = portionMultiplier === 1 ? target.name : `${target.name} (${portionMultiplier} Porsiyon)`;
  const unitPrice = Number((target.price * portionMultiplier + modifiersTotal).toFixed(2));
  const modifierKey = modifiers
    .map((modifier) => modifier.id)
    .sort()
    .join('|');
  const lineKey = `${target.id}::p${portionMultiplier}::s${seatNo ?? 0}::m${modifierKey}::n${note ?? ''}`;
  const existing = items.find((item) => item.menuItemId === lineKey && (item.itemStatus ?? 'AKTIF') === 'AKTIF');

  if (existing) {
    return items.map((item) =>
      item.menuItemId === lineKey
        ? {
            ...item,
            quantity: item.quantity + 1,
          }
        : item,
    );
  }

  return [
    ...items,
    {
      menuItemId: lineKey,
      baseMenuItemId: target.id,
      name: itemName,
      category: target.category,
      price: unitPrice,
      quantity: 1,
      portionMultiplier,
      seatNo,
      modifiers: modifiers.length > 0 ? modifiers : undefined,
      note,
      itemStatus: 'AKTIF',
    },
  ];
};

const appendTableAuditLog = (table: Table, action: OrderAuditAction, message: string, menuItemId?: string): OrderAuditLog[] => [
  ...(table.auditLogs ?? []),
  {
    id: createOrderLogId(),
    createdAt: new Date().toISOString(),
    action,
    message,
    menuItemId,
  },
];

const clearTable = (table: Table): Table => ({
  ...table,
  status: 'BOS',
  guestCount: 0,
  openedAt: null,
  adisyonNo: null,
  orderItems: [],
  auditLogs: [],
  coverEnabled: false,
  coverPerGuest: table.coverPerGuest ?? 35,
  waiterName: null,
});

const isTableEmpty = (table: Table) => table.orderItems.length === 0 && table.status === 'BOS';

const mergeOrderItems = (baseItems: OrderItem[], incomingItems: OrderItem[]): OrderItem[] => {
  const merged = new Map<string, OrderItem>();

  const mergeItem = (item: OrderItem) => {
    const existing = merged.get(item.menuItemId);

    if (existing) {
      merged.set(item.menuItemId, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
      return;
    }

    merged.set(item.menuItemId, { ...item });
  };

  baseItems.forEach(mergeItem);
  incomingItems.forEach(mergeItem);

  return [...merged.values()];
};

const earliestOpenTime = (left: string | null, right: string | null) => {
  if (left && right) {
    return left <= right ? left : right;
  }

  return left ?? right;
};

export const POSProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(() => loadPersistedSession());
  const persisted = useMemo(() => loadPersistedAppState(), []);
  const cloudSyncEnabled = useMemo(() => isCloudSyncEnabled(), []);
  const [favoriteMenuItemIds, setFavoriteMenuItemIds] = useState<string[]>(() => loadPersistedFavoriteMenuItems());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(persisted.menuItems);
  const [recentMenuItemIds, setRecentMenuItemIds] = useState<string[]>(() => loadPersistedRecentMenuItems());
  const [tableServiceStatusById, setTableServiceStatusById] = useState<Record<string, ServiceStatus>>(
    () => loadPersistedTableServiceStatuses(),
  );
  const [tables, setTables] = useState<Table[]>(persisted.tables);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(persisted.transactions);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [cloudReadyWorkspaces, setCloudReadyWorkspaces] = useState<Record<string, boolean>>({});
  const [cloudStatus, setCloudStatus] = useState<POSContextValue['cloudStatus']>({
    enabled: cloudSyncEnabled,
    mode: cloudSyncEnabled ? 'cloud' : 'local',
    hydrationState: cloudSyncEnabled ? 'idle' : 'ready',
    syncState: 'idle',
    lastSyncedAt: null,
    lastError: null,
    missingTables: [],
  });
  const workspaceCode = useMemo(
    () => normalizeWorkspaceCode(user?.workplace ?? 'demo-isyeri'),
    [user?.workplace],
  );
  const lastPersistedStateRef = useRef('');
  const cloudReadyWorkspacesRef = useRef<Set<string>>(new Set());
  const lastCloudPersistedByWorkspaceRef = useRef<Record<string, string>>({});

  const serializedAppState = useMemo(
    () =>
      JSON.stringify({
        menuItems,
        tables,
        transactions,
      }),
    [menuItems, tables, transactions],
  );

  useEffect(() => {
    setCloudStatus((current) => ({
      ...current,
      enabled: cloudSyncEnabled,
      mode: cloudSyncEnabled ? 'cloud' : 'local',
      hydrationState: cloudSyncEnabled ? current.hydrationState : 'ready',
    }));
  }, [cloudSyncEnabled]);

  useEffect(() => {
    if (!cloudSyncEnabled) {
      return;
    }

    if (cloudReadyWorkspacesRef.current.has(workspaceCode)) {
      return;
    }

    let cancelled = false;

    const hydrateCloudState = async () => {
      setCloudStatus((current) => ({
        ...current,
        hydrationState: 'loading',
        lastError: null,
      }));

      try {
        const snapshot = await readCloudSnapshot(workspaceCode);
        const tableChecks = await inspectCloudTables();

        if (cancelled) {
          return;
        }

        const missingTables = tableChecks.filter((entry) => !entry.ok).map((entry) => entry.table);

        setCloudStatus((current) => ({
          ...current,
          hydrationState: 'ready',
          missingTables,
          lastError: missingTables.length > 0 ? 'Eksik cloud tabloları var.' : null,
        }));

        if (!snapshot) {
          return;
        }

        const serializedSnapshot = JSON.stringify(snapshot);
        lastPersistedStateRef.current = serializedSnapshot;
        lastCloudPersistedByWorkspaceRef.current[workspaceCode] = serializedSnapshot;

        setMenuItems(snapshot.menuItems);
        setTables(snapshot.tables);
        setTransactions(snapshot.transactions);
      } catch (error) {
        console.error('Cloud state okunamadı, local state kullanılmaya devam ediliyor.', error);
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Cloud state okunamadı.';
          setCloudStatus((current) => ({
            ...current,
            hydrationState: 'error',
            lastError: message,
          }));
        }
      } finally {
        if (!cancelled) {
          cloudReadyWorkspacesRef.current.add(workspaceCode);
          setCloudReadyWorkspaces((current) => ({ ...current, [workspaceCode]: true }));
        }
      }
    };

    void hydrateCloudState();

    return () => {
      cancelled = true;
    };
  }, [cloudSyncEnabled, workspaceCode]);

  useEffect(() => {
    if (serializedAppState === lastPersistedStateRef.current) {
      return;
    }

    const persist = () => {
      localStorage.setItem(APP_STORAGE_KEY, serializedAppState);
      lastPersistedStateRef.current = serializedAppState;
    };

    const idleApi = globalThis as typeof globalThis & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof idleApi.requestIdleCallback === 'function' && typeof idleApi.cancelIdleCallback === 'function') {
      const idleId = idleApi.requestIdleCallback(persist, { timeout: 1200 });
      return () => idleApi.cancelIdleCallback?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(persist, 200);
    return () => globalThis.clearTimeout(timeoutId);
  }, [serializedAppState]);

  useEffect(() => {
    localStorage.setItem(RECENT_MENU_ITEMS_STORAGE_KEY, JSON.stringify(recentMenuItemIds));
  }, [recentMenuItemIds]);

  useEffect(() => {
    localStorage.setItem(FAVORITE_MENU_ITEMS_STORAGE_KEY, JSON.stringify(favoriteMenuItemIds));
  }, [favoriteMenuItemIds]);

  useEffect(() => {
    localStorage.setItem(TABLE_SERVICE_STATUS_STORAGE_KEY, JSON.stringify(tableServiceStatusById));
  }, [tableServiceStatusById]);

  useEffect(() => {
    if (!cloudSyncEnabled) {
      return;
    }

    if (!cloudReadyWorkspacesRef.current.has(workspaceCode) && !cloudReadyWorkspaces[workspaceCode]) {
      return;
    }

    if (lastCloudPersistedByWorkspaceRef.current[workspaceCode] === serializedAppState) {
      return;
    }

    let cancelled = false;
    setCloudStatus((current) => ({
      ...current,
      syncState: 'syncing',
      lastError: current.missingTables.length > 0 ? 'Eksik cloud tabloları var.' : null,
    }));
    const timeoutId = globalThis.setTimeout(() => {
      void writeCloudSnapshot(workspaceCode, {
        menuItems,
        tables,
        transactions,
      })
        .then(() => {
          if (!cancelled) {
            lastCloudPersistedByWorkspaceRef.current[workspaceCode] = serializedAppState;
            setCloudStatus((current) => ({
              ...current,
              syncState: 'synced',
              lastSyncedAt: new Date().toISOString(),
              lastError: current.missingTables.length > 0 ? 'Eksik cloud tabloları var.' : null,
            }));
          }
        })
        .catch((error) => {
          console.error('Cloud state yazılamadı, local state korunuyor.', error);
          if (!cancelled) {
            const message = error instanceof Error ? error.message : 'Cloud state yazılamadı.';
            setCloudStatus((current) => ({
              ...current,
              syncState: 'error',
              lastError: message,
            }));
          }
        });
    }, 900);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, [cloudReadyWorkspaces, cloudSyncEnabled, menuItems, serializedAppState, tables, transactions, workspaceCode]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [user]);

  useEffect(() => {
    setTableServiceStatusById((current) => {
      const nextEntries = tables.flatMap((table) => {
        if (table.orderItems.length === 0 || table.status === 'ODENDI' || table.status === 'BOS') {
          return [];
        }

        return [[table.id, current[table.id] ?? 'BEKLIYOR'] as const];
      });

      const next = Object.fromEntries(nextEntries) as Record<string, ServiceStatus>;
      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);

      if (
        currentKeys.length === nextKeys.length &&
        currentKeys.every((key) => current[key] === next[key])
      ) {
        return current;
      }

      return next;
    });
  }, [tables]);

  const updateTable = useCallback((tableId: string, updater: (table: Table) => Table) => {
    setTables((prevTables) => prevTables.map((table) => (table.id === tableId ? updater(table) : table)));
  }, []);

  const pushToast = useCallback((message: string, tone: ToastMessage['tone'] = 'info') => {
    const toastId = createToastId();

    setToasts((prev) => [...prev, { id: toastId, message, tone }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 3_500);
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  const rememberRecentMenuItem = useCallback((menuItemId: string) => {
    setRecentMenuItemIds((prev) => [menuItemId, ...prev.filter((entry) => entry !== menuItemId)].slice(0, 8));
  }, []);

  const toggleFavoriteMenuItem = useCallback((menuItemId: string) => {
    setFavoriteMenuItemIds((prev) =>
      prev.includes(menuItemId) ? prev.filter((entry) => entry !== menuItemId) : [menuItemId, ...prev].slice(0, 12),
    );
  }, []);

  const forceCloudSync = useCallback(async (): Promise<OperationResult> => {
    if (!cloudSyncEnabled) {
      return {
        ok: false,
        message: 'Cloud bağlantısı aktif değil.',
      };
    }

    try {
      setCloudStatus((current) => ({
        ...current,
        syncState: 'syncing',
        lastError: null,
      }));

      const tableChecks = await inspectCloudTables();
      const missingTables = tableChecks.filter((entry) => !entry.ok).map((entry) => entry.table);

      setCloudStatus((current) => ({
        ...current,
        missingTables,
      }));

      await writeCloudSnapshot(workspaceCode, {
        menuItems,
        tables,
        transactions,
      });

      lastCloudPersistedByWorkspaceRef.current[workspaceCode] = serializedAppState;
      setCloudReadyWorkspaces((current) => ({ ...current, [workspaceCode]: true }));
      setCloudStatus((current) => ({
        ...current,
        syncState: 'synced',
        lastSyncedAt: new Date().toISOString(),
        lastError: missingTables.length > 0 ? 'Eksik cloud tabloları var.' : null,
      }));

      return {
        ok: true,
        message: 'Cloud senkron başarıyla tamamlandı.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cloud senkron başarısız oldu.';
      setCloudStatus((current) => ({
        ...current,
        syncState: 'error',
        lastError: message,
      }));

      return {
        ok: false,
        message,
      };
    }
  }, [cloudSyncEnabled, menuItems, serializedAppState, tables, transactions, workspaceCode]);

  const login = useCallback((input: LoginInput): LoginResult => {
    const username = input.username.trim();
    const password = input.password.trim();

    if (!username || !password || !input.workplace) {
      return {
        ok: false,
        message: 'Kullanıcı adı, şifre ve iş yeri bilgisi zorunludur.',
      };
    }

    if (password !== '123456') {
      return {
        ok: false,
        message: 'Şifre hatalı. Demo şifresi: 123456',
      };
    }

    const fullName = username === MOCK_USER.username ? MOCK_USER.fullName : `${username[0].toUpperCase()}${username.slice(1)}`;

    setUser({
      id: MOCK_USER.id,
      fullName,
      username,
      role: MOCK_USER.role,
      workplace: input.workplace,
    });

    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const addMenuItem = useCallback((input: AddMenuItemInput): OperationResult => {
    const name = input.name.trim();
    const price = Number(input.price);

    if (!name) {
      return {
        ok: false,
        message: 'Ürün adı zorunludur.',
      };
    }

    if (!Number.isFinite(price) || price <= 0) {
      return {
        ok: false,
        message: 'Ürün fiyatı 0\'dan büyük olmalıdır.',
      };
    }

    const normalizedName = name.toLocaleLowerCase('tr');
    const exists = menuItems.some(
      (item) =>
        item.category === input.category && item.name.toLocaleLowerCase('tr') === normalizedName,
    );

    if (exists) {
      return {
        ok: false,
        message: 'Aynı kategoride bu isimde bir ürün zaten mevcut.',
      };
    }

    const nextItem: MenuItem = {
      id: createMenuItemId(),
      name,
      category: input.category,
      price: Number(price.toFixed(2)),
    };

    setMenuItems((prev) => [nextItem, ...prev]);

    return {
      ok: true,
      message: `${nextItem.name} menüye eklendi.`,
    };
  }, [menuItems]);

  const addConfiguredProductToTable = useCallback(
    (tableId: string, item: MenuItem, config?: AddProductConfig) => {
      rememberRecentMenuItem(item.id);
      updateTable(tableId, (table) => {
        const nextOrderItems = createOrderList(table.orderItems, item, config);
        const nextStatus = resolveStatusAfterOrderChange(nextOrderItems, table.status);
        const configParts = [
          config?.portionMultiplier && config.portionMultiplier !== 1 ? `${config.portionMultiplier} porsiyon` : null,
          config?.seatNo ? `Kişi ${config.seatNo}` : null,
          config?.modifiers && config.modifiers.length > 0 ? `Mod: ${config.modifiers.map((entry) => entry.name).join(', ')}` : null,
        ].filter(Boolean);
        const logMessage =
          configParts.length > 0 ? `${item.name} eklendi (${configParts.join(' • ')})` : `${item.name} eklendi`;

        return {
          ...table,
          orderItems: nextOrderItems,
          status: nextStatus,
          openedAt: table.openedAt ?? new Date().toISOString(),
          guestCount: Math.max(1, table.guestCount),
          adisyonNo: table.adisyonNo ?? createAdisyonNo(table.number),
          waiterName: table.waiterName ?? WAITER_NAMES[0],
          auditLogs: appendTableAuditLog(table, 'EKLEME', logMessage),
        };
      });
    },
    [rememberRecentMenuItem, updateTable],
  );

  const addProductToTable = useCallback(
    (tableId: string, item: MenuItem, portionMultiplier: PortionMultiplier = 1) => {
      addConfiguredProductToTable(tableId, item, { portionMultiplier });
    },
    [addConfiguredProductToTable],
  );

  const incrementOrderItem = useCallback(
    (tableId: string, menuItemId: string) => {
      updateTable(tableId, (table) => {
        const nextOrderItems = table.orderItems.map((item) =>
          item.menuItemId === menuItemId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );

        return {
          ...table,
          orderItems: nextOrderItems,
          status: resolveStatusAfterOrderChange(nextOrderItems, table.status),
        };
      });
    },
    [updateTable],
  );

  const decrementOrderItem = useCallback(
    (tableId: string, menuItemId: string) => {
      updateTable(tableId, (table) => {
        const nextOrderItems = table.orderItems
          .map((item) =>
            item.menuItemId === menuItemId
              ? {
                  ...item,
                  quantity: item.quantity - 1,
                }
              : item,
          )
          .filter((item) => item.quantity > 0);

        const nextStatus = resolveStatusAfterOrderChange(nextOrderItems, table.status);

        return {
          ...table,
          orderItems: nextOrderItems,
          status: nextStatus,
          openedAt: nextOrderItems.length > 0 ? table.openedAt : null,
          guestCount: nextOrderItems.length > 0 ? table.guestCount : 0,
          adisyonNo: nextOrderItems.length > 0 ? table.adisyonNo : null,
        };
      });
    },
    [updateTable],
  );

  const setOrderItemSeat = useCallback(
    (tableId: string, menuItemId: string, seatNo: number) => {
      updateTable(tableId, (table) => {
        const nextSeatNo = Math.max(1, Math.floor(seatNo));
        const targetItem = table.orderItems.find((item) => item.menuItemId === menuItemId);

        if (!targetItem) {
          return table;
        }

        const nextOrderItems = table.orderItems.map((item) =>
          item.menuItemId === menuItemId
            ? {
                ...item,
                seatNo: nextSeatNo,
              }
            : item,
        );

        return {
          ...table,
          orderItems: nextOrderItems,
          auditLogs: appendTableAuditLog(table, 'SEAT', `${targetItem.name} -> Kişi ${nextSeatNo}`, menuItemId),
        };
      });
    },
    [updateTable],
  );

  const markOrderItem = useCallback(
    (
      tableId: string,
      menuItemId: string,
      status: Extract<OrderItemStatus, 'IPTAL' | 'IKRAM'>,
      reason: string,
    ): OperationResult => {
      const cleanReason = reason.trim();

      if (!cleanReason) {
        return {
          ok: false,
          message: 'İşlem nedeni zorunludur.',
        };
      }

      let result: OperationResult = {
        ok: false,
        message: 'Satır güncellenemedi.',
      };

      updateTable(tableId, (table) => {
        const targetItem = table.orderItems.find((item) => item.menuItemId === menuItemId);

        if (!targetItem) {
          result = {
            ok: false,
            message: 'Ürün satırı bulunamadı.',
          };
          return table;
        }

        if ((targetItem.itemStatus ?? 'AKTIF') !== 'AKTIF') {
          result = {
            ok: false,
            message: 'Bu satır zaten iptal/ikram durumunda.',
          };
          return table;
        }

        const nextOrderItems: OrderItem[] = table.orderItems.map((item) =>
          item.menuItemId === menuItemId
            ? {
                ...item,
                itemStatus: status,
                voidReason: cleanReason,
                voidedAt: new Date().toISOString(),
              }
            : item,
        );
        const nextStatus = resolveStatusAfterOrderChange(nextOrderItems, table.status);

        result = {
          ok: true,
          message: status === 'IPTAL' ? 'Ürün satırı iptal edildi.' : 'Ürün satırı ikram edildi.',
        };

        return {
          ...table,
          orderItems: nextOrderItems,
          status: nextStatus,
          openedAt: nextStatus === 'BOS' ? null : table.openedAt,
          guestCount: nextStatus === 'BOS' ? 0 : table.guestCount,
          adisyonNo: nextStatus === 'BOS' ? null : table.adisyonNo,
          auditLogs: appendTableAuditLog(
            table,
            status,
            `${targetItem.name} ${status === 'IPTAL' ? 'iptal' : 'ikram'} edildi • Neden: ${cleanReason}`,
            menuItemId,
          ),
        };
      });

      return result;
    },
    [updateTable],
  );

  const restoreOrderItem = useCallback(
    (tableId: string, menuItemId: string): OperationResult => {
      let result: OperationResult = {
        ok: false,
        message: 'Satır geri alınamadı.',
      };

      updateTable(tableId, (table) => {
        const targetItem = table.orderItems.find((item) => item.menuItemId === menuItemId);

        if (!targetItem) {
          result = {
            ok: false,
            message: 'Ürün satırı bulunamadı.',
          };
          return table;
        }

        if ((targetItem.itemStatus ?? 'AKTIF') === 'AKTIF') {
          result = {
            ok: false,
            message: 'Satır zaten aktif durumda.',
          };
          return table;
        }

        const nextOrderItems: OrderItem[] = table.orderItems.map((item) =>
          item.menuItemId === menuItemId
            ? {
                ...item,
                itemStatus: 'AKTIF' as const,
                voidReason: undefined,
                voidedAt: undefined,
              }
            : item,
        );
        const nextStatus = resolveStatusAfterOrderChange(nextOrderItems, table.status);

        result = {
          ok: true,
          message: 'Satır yeniden aktif edildi.',
        };

        return {
          ...table,
          orderItems: nextOrderItems,
          status: nextStatus,
          openedAt: table.openedAt ?? new Date().toISOString(),
          guestCount: Math.max(1, table.guestCount),
          adisyonNo: table.adisyonNo ?? createAdisyonNo(table.number),
          auditLogs: appendTableAuditLog(table, 'GERI_AL', `${targetItem.name} geri alındı`, menuItemId),
        };
      });

      return result;
    },
    [updateTable],
  );

  const setTableGuestCount = useCallback(
    (tableId: string, guestCount: number) => {
      updateTable(tableId, (table) => ({
        ...table,
        guestCount: Math.max(0, guestCount),
      }));
    },
    [updateTable],
  );

  const setTableCover = useCallback(
    (tableId: string, enabled: boolean) => {
      updateTable(tableId, (table) => ({
        ...table,
        coverEnabled: enabled,
      }));
    },
    [updateTable],
  );

  const setTableWaiter = useCallback(
    (tableId: string, waiterName: string) => {
      updateTable(tableId, (table) => ({
        ...table,
        waiterName: waiterName.trim() ? waiterName.trim() : null,
      }));
    },
    [updateTable],
  );

  const setTableServiceStatus = useCallback((tableId: string, serviceStatus: ServiceStatus) => {
    setTableServiceStatusById((current) => ({
      ...current,
      [tableId]: serviceStatus,
    }));
  }, []);

  const setTableStatus = useCallback(
    (tableId: string, status: TableStatus) => {
      updateTable(tableId, (table) => ({
        ...table,
        status,
      }));
    },
    [updateTable],
  );

  const markTableAsPaymentWaiting = useCallback(
    (tableId: string) => {
      updateTable(tableId, (table) => {
        if (table.orderItems.length === 0) {
          return table;
        }

        return {
          ...table,
          status: 'ODEME_BEKLIYOR',
        };
      });
    },
    [updateTable],
  );

  const markTableAsPaid = useCallback(
    (tableId: string) => {
      updateTable(tableId, (table) => ({
        ...table,
        status: 'ODENDI',
      }));
    },
    [updateTable],
  );

  const closeTable = useCallback(
    (tableId: string) => {
      updateTable(tableId, (table) => clearTable(table));
    },
    [updateTable],
  );

  const moveTable = useCallback((sourceTableId: string, targetTableId: string): OperationResult => {
    let result: OperationResult = {
      ok: false,
      message: 'Masa taşıma işlemi gerçekleştirilemedi.',
    };

    setTables((prevTables) => {
      if (sourceTableId === targetTableId) {
        result = {
          ok: false,
          message: 'Kaynak ve hedef masa aynı olamaz.',
        };
        return prevTables;
      }

      const sourceTable = prevTables.find((table) => table.id === sourceTableId);
      const targetTable = prevTables.find((table) => table.id === targetTableId);

      if (!sourceTable || !targetTable) {
        result = {
          ok: false,
          message: 'Masa bilgileri bulunamadı.',
        };
        return prevTables;
      }

      if (sourceTable.orderItems.length === 0) {
        result = {
          ok: false,
          message: 'Kaynak masa boş olduğu için taşıma yapılamaz.',
        };
        return prevTables;
      }

      if (!isTableEmpty(targetTable)) {
        result = {
          ok: false,
          message: 'Hedef masa boş olmalıdır.',
        };
        return prevTables;
      }

      const nextTargetStatus: TableStatus =
        sourceTable.status === 'ODEME_BEKLIYOR'
          ? 'ODEME_BEKLIYOR'
          : sourceTable.status === 'ODENDI'
            ? 'ODENDI'
            : 'DOLU';

      result = {
        ok: true,
        message: `Masa ${sourceTable.number} -> Masa ${targetTable.number} taşıma işlemi tamamlandı.`,
      };

      return prevTables.map((table) => {
        if (table.id === sourceTableId) {
          return clearTable(table);
        }

        if (table.id === targetTableId) {
          return {
            ...table,
            status: nextTargetStatus,
            guestCount: Math.max(1, sourceTable.guestCount),
            openedAt: sourceTable.openedAt ?? new Date().toISOString(),
            adisyonNo: sourceTable.adisyonNo ?? createAdisyonNo(targetTable.number),
            orderItems: sourceTable.orderItems.map((item) => ({ ...item })),
            coverEnabled: sourceTable.coverEnabled ?? false,
            coverPerGuest: sourceTable.coverPerGuest ?? table.coverPerGuest ?? 35,
            waiterName: sourceTable.waiterName ?? table.waiterName ?? WAITER_NAMES[0],
          };
        }

        return table;
      });
    });

    if (result.ok) {
      setTableServiceStatusById((current) => {
        const next = { ...current };
        next[targetTableId] = current[sourceTableId] ?? 'BEKLIYOR';
        delete next[sourceTableId];
        return next;
      });
    }

    return result;
  }, []);

  const mergeTables = useCallback((sourceTableId: string, targetTableId: string): OperationResult => {
    let result: OperationResult = {
      ok: false,
      message: 'Masa birleştirme işlemi gerçekleştirilemedi.',
    };

    setTables((prevTables) => {
      if (sourceTableId === targetTableId) {
        result = {
          ok: false,
          message: 'Birleştirme için iki farklı masa seçin.',
        };
        return prevTables;
      }

      const sourceTable = prevTables.find((table) => table.id === sourceTableId);
      const targetTable = prevTables.find((table) => table.id === targetTableId);

      if (!sourceTable || !targetTable) {
        result = {
          ok: false,
          message: 'Masa bilgileri bulunamadı.',
        };
        return prevTables;
      }

      if (sourceTable.orderItems.length === 0) {
        result = {
          ok: false,
          message: 'Kaynak masa boş, birleştirme yapılamaz.',
        };
        return prevTables;
      }

      const mergedItems = mergeOrderItems(targetTable.orderItems, sourceTable.orderItems);
      const mergedGuestCount = Math.max(1, targetTable.guestCount + sourceTable.guestCount);

      result = {
        ok: true,
        message: `Masa ${sourceTable.number}, Masa ${targetTable.number} ile birleştirildi.`,
      };

      return prevTables.map((table) => {
        if (table.id === sourceTableId) {
          return clearTable(table);
        }

        if (table.id === targetTableId) {
          return {
            ...table,
            status: 'DOLU',
            guestCount: mergedGuestCount,
            openedAt: earliestOpenTime(targetTable.openedAt, sourceTable.openedAt) ?? new Date().toISOString(),
            adisyonNo: targetTable.adisyonNo ?? sourceTable.adisyonNo ?? createAdisyonNo(targetTable.number),
            orderItems: mergedItems,
            coverEnabled: (targetTable.coverEnabled ?? false) || (sourceTable.coverEnabled ?? false),
            coverPerGuest: targetTable.coverPerGuest ?? sourceTable.coverPerGuest ?? 35,
            waiterName: targetTable.waiterName ?? sourceTable.waiterName ?? WAITER_NAMES[0],
          };
        }

        return table;
      });
    });

    if (result.ok) {
      setTableServiceStatusById((current) => {
        const next = { ...current };
        next[targetTableId] = current[targetTableId] ?? current[sourceTableId] ?? 'BEKLIYOR';
        delete next[sourceTableId];
        return next;
      });
    }

    return result;
  }, []);

  const splitTable = useCallback((sourceTableId: string, targetTableId: string, ratio: number): OperationResult => {
    let result: OperationResult = {
      ok: false,
      message: 'Masa ayırma işlemi gerçekleştirilemedi.',
    };

    setTables((prevTables) => {
      if (sourceTableId === targetTableId) {
        result = {
          ok: false,
          message: 'Kaynak ve hedef masa aynı olamaz.',
        };
        return prevTables;
      }

      const sourceTable = prevTables.find((table) => table.id === sourceTableId);
      const targetTable = prevTables.find((table) => table.id === targetTableId);

      if (!sourceTable || !targetTable) {
        result = {
          ok: false,
          message: 'Masa bilgileri bulunamadı.',
        };
        return prevTables;
      }

      if (sourceTable.orderItems.length === 0) {
        result = {
          ok: false,
          message: 'Kaynak masa boş olduğu için ayırma yapılamaz.',
        };
        return prevTables;
      }

      if (!isTableEmpty(targetTable)) {
        result = {
          ok: false,
          message: 'Masa ayırmak için hedef masa boş olmalıdır.',
        };
        return prevTables;
      }

      const totalQuantity = sourceTable.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < 2) {
        result = {
          ok: false,
          message: 'Masa ayırmak için adisyonda en az 2 adet ürün olmalıdır.',
        };
        return prevTables;
      }

      const safeRatio = Math.max(0.2, Math.min(0.8, ratio));
      const moveQuantity = Math.max(1, Math.min(totalQuantity - 1, Math.round(totalQuantity * safeRatio)));

      let remainingToMove = moveQuantity;
      const sourceItems: OrderItem[] = [];
      const targetItems: OrderItem[] = [];

      sourceTable.orderItems.forEach((item) => {
        if (remainingToMove <= 0) {
          sourceItems.push({ ...item });
          return;
        }

        const moveFromRow = Math.min(item.quantity, remainingToMove);
        const stayOnRow = item.quantity - moveFromRow;

        if (moveFromRow > 0) {
          targetItems.push({
            ...item,
            quantity: moveFromRow,
          });
        }

        if (stayOnRow > 0) {
          sourceItems.push({
            ...item,
            quantity: stayOnRow,
          });
        }

        remainingToMove -= moveFromRow;
      });

      if (sourceItems.length === 0 || targetItems.length === 0) {
        result = {
          ok: false,
          message: 'Masa ayırma dağılımı oluşturulamadı.',
        };
        return prevTables;
      }

      const baseGuestCount = Math.max(1, sourceTable.guestCount);
      const targetGuestCount = Math.max(1, Math.round((baseGuestCount * moveQuantity) / totalQuantity));
      const sourceGuestCount = Math.max(1, baseGuestCount - targetGuestCount);

      result = {
        ok: true,
        message: `Masa ${sourceTable.number} adisyonu, Masa ${targetTable.number} için başarıyla ayrıldı.`,
      };

      return prevTables.map((table) => {
        if (table.id === sourceTableId) {
          return {
            ...table,
            status: 'DOLU',
            guestCount: sourceGuestCount,
            orderItems: sourceItems,
          };
        }

        if (table.id === targetTableId) {
          return {
            ...table,
            status: 'DOLU',
            guestCount: targetGuestCount,
            openedAt: sourceTable.openedAt ?? new Date().toISOString(),
            adisyonNo: createAdisyonNo(targetTable.number),
            orderItems: targetItems,
            coverEnabled: sourceTable.coverEnabled ?? false,
            coverPerGuest: sourceTable.coverPerGuest ?? table.coverPerGuest ?? 35,
            waiterName: sourceTable.waiterName ?? table.waiterName ?? WAITER_NAMES[0],
          };
        }

        return table;
      });
    });

    if (result.ok) {
      setTableServiceStatusById((current) => ({
        ...current,
        [sourceTableId]: current[sourceTableId] ?? 'BEKLIYOR',
        [targetTableId]: current[sourceTableId] ?? 'BEKLIYOR',
      }));
    }

    return result;
  }, []);

  const createTransaction = useCallback(
    (input: CreateTransactionInput): PaymentTransaction | null => {
      const table = tables.find((entry) => entry.id === input.tableId);
      const terminal = TERMINALS.find((entry) => entry.id === input.terminalId);

      if (!table || !terminal) {
        return null;
      }

      const transaction: PaymentTransaction = {
        id: createTransactionId(),
        createdAt: new Date().toISOString(),
        tableId: table.id,
        tableNo: table.number,
        adisyonNo: table.adisyonNo ?? createAdisyonNo(table.number),
        terminalNo: terminal.terminalNo,
        terminalName: terminal.name,
        waiterName: input.waiterName?.trim() || table.waiterName || undefined,
        paymentType: input.paymentType,
        splitMethod: input.splitMethod,
        amount: Number(input.amount.toFixed(2)),
        status: input.status,
        referenceNo: input.referenceNo,
        errorCode: input.errorCode,
      };

      setTransactions((prev) => [transaction, ...prev]);

      return transaction;
    },
    [tables],
  );

  const refundableBaseById = useMemo(() => {
    const map = new Map<string, number>();

    for (const transaction of transactions) {
      if (transaction.status === 'BASARILI' && transaction.paymentType !== 'IADE') {
        map.set(transaction.id, transaction.amount);
      }
    }

    return map;
  }, [transactions]);

  const refundedAmountBySourceId = useMemo(() => {
    const map = new Map<string, number>();

    for (const transaction of transactions) {
      if (
        transaction.paymentType === 'IADE' &&
        transaction.status === 'BASARILI' &&
        transaction.refundedFromTransactionId
      ) {
        const previous = map.get(transaction.refundedFromTransactionId) ?? 0;
        map.set(transaction.refundedFromTransactionId, previous + transaction.amount);
      }
    }

    return map;
  }, [transactions]);

  const getRefundableAmount = useCallback(
    (transactionId: string) => {
      const originalAmount = refundableBaseById.get(transactionId);
      if (!originalAmount) {
        return 0;
      }

      const refundedAmount = refundedAmountBySourceId.get(transactionId) ?? 0;

      return Number(Math.max(0, originalAmount - refundedAmount).toFixed(2));
    },
    [refundableBaseById, refundedAmountBySourceId],
  );

  const refundTransaction = useCallback(
    (input: RefundTransactionInput): OperationResult => {
      const originalTransaction = transactions.find((transaction) => transaction.id === input.transactionId);

      if (!originalTransaction) {
        return {
          ok: false,
          message: 'İade yapılacak işlem bulunamadı.',
        };
      }

      if (originalTransaction.paymentType === 'IADE') {
        return {
          ok: false,
          message: 'İade işleminin tekrar iadesi yapılamaz.',
        };
      }

      if (originalTransaction.status !== 'BASARILI') {
        return {
          ok: false,
          message: 'Sadece başarılı işlemler için iade başlatılabilir.',
        };
      }

      const refundableAmount = getRefundableAmount(originalTransaction.id);
      if (refundableAmount <= 0) {
        return {
          ok: false,
          message: 'Bu işlem için iade edilebilir tutar kalmadı.',
        };
      }

      const requestedAmount = Number((input.amount ?? refundableAmount).toFixed(2));

      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        return {
          ok: false,
          message: 'İade tutarı 0\'dan büyük olmalıdır.',
        };
      }

      if (requestedAmount > refundableAmount) {
        return {
          ok: false,
          message: `İade tutarı en fazla ${refundableAmount.toFixed(2)} olabilir.`,
        };
      }

      const terminal =
        TERMINALS.find((entry) => entry.id === input.terminalId) ??
        TERMINALS.find((entry) => entry.terminalNo === originalTransaction.terminalNo) ??
        TERMINALS[0];

      if (!terminal) {
        return {
          ok: false,
          message: 'İade için terminal bilgisi bulunamadı.',
        };
      }

      const refundTransactionRecord: PaymentTransaction = {
        id: createTransactionId(),
        createdAt: new Date().toISOString(),
        tableId: originalTransaction.tableId,
        tableNo: originalTransaction.tableNo,
        adisyonNo: originalTransaction.adisyonNo,
        terminalNo: terminal.terminalNo,
        terminalName: terminal.name,
        waiterName: originalTransaction.waiterName,
        paymentType: 'IADE',
        amount: requestedAmount,
        status: 'BASARILI',
        referenceNo: createRefundReferenceNo(),
        refundedFromTransactionId: originalTransaction.id,
        refundOfPaymentType: originalTransaction.paymentType,
        note: input.note?.trim() ? input.note.trim() : undefined,
      };

      setTransactions((prev) => [refundTransactionRecord, ...prev]);

      return {
        ok: true,
        message:
          requestedAmount === refundableAmount
            ? 'Tam iade işlemi başarıyla kaydedildi.'
            : 'Kısmi iade işlemi başarıyla kaydedildi.',
      };
    },
    [transactions, getRefundableAmount],
  );

  const value = useMemo<POSContextValue>(
    () => ({
      user,
      menuItems,
      favoriteMenuItemIds,
      recentMenuItemIds,
      tableServiceStatusById,
      waiters: WAITER_NAMES,
      terminals: TERMINALS,
      tables,
      transactions,
      toasts,
      cloudStatus,
      login,
      logout,
      addMenuItem,
      toggleFavoriteMenuItem,
      addConfiguredProductToTable,
      addProductToTable,
      incrementOrderItem,
      decrementOrderItem,
      setOrderItemSeat,
      markOrderItem,
      restoreOrderItem,
      setTableGuestCount,
      setTableCover,
      setTableWaiter,
      setTableServiceStatus,
      setTableStatus,
      markTableAsPaymentWaiting,
      markTableAsPaid,
      closeTable,
      mergeTables,
      moveTable,
      splitTable,
      createTransaction,
      getRefundableAmount,
      refundTransaction,
      forceCloudSync,
      pushToast,
      dismissToast,
    }),
    [
      user,
      menuItems,
      favoriteMenuItemIds,
      recentMenuItemIds,
      tableServiceStatusById,
      tables,
      transactions,
      toasts,
      cloudStatus,
      login,
      logout,
      addMenuItem,
      toggleFavoriteMenuItem,
      addConfiguredProductToTable,
      addProductToTable,
      incrementOrderItem,
      decrementOrderItem,
      setOrderItemSeat,
      markOrderItem,
      restoreOrderItem,
      setTableGuestCount,
      setTableCover,
      setTableWaiter,
      setTableServiceStatus,
      setTableStatus,
      markTableAsPaymentWaiting,
      markTableAsPaid,
      closeTable,
      mergeTables,
      moveTable,
      splitTable,
      createTransaction,
      getRefundableAmount,
      refundTransaction,
      forceCloudSync,
      pushToast,
      dismissToast,
    ],
  );

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
};

export const usePOS = () => {
  const context = useContext(POSContext);

  if (!context) {
    throw new Error('usePOS must be used within POSProvider');
  }

  return context;
};

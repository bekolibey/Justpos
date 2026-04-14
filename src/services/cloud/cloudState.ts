import { MODIFIERS_BY_CATEGORY } from '../../data/modifiers';
import { TERMINALS } from '../../data/terminals';
import { WAITER_NAMES } from '../../data/waiters';
import type {
  MenuItem,
  OrderAuditLog,
  OrderItem,
  PaymentTransaction,
  Table,
} from '../../types/pos';
import { getSupabaseClient, getSupabaseStateTable } from './supabaseClient';

export interface CloudStatePayload {
  menuItems: MenuItem[];
  tables: Table[];
  transactions: PaymentTransaction[];
}

const WORKSPACES_TABLE = 'pos_workspaces';
const WAITERS_TABLE = 'pos_waiters';
const TERMINALS_TABLE = 'pos_terminals';
const MENU_ITEMS_TABLE = 'pos_menu_items';
const MODIFIER_GROUPS_TABLE = 'pos_modifier_groups';
const MODIFIER_OPTIONS_TABLE = 'pos_modifier_options';
const TABLES_TABLE = 'pos_tables';
const ORDER_ITEMS_TABLE = 'pos_order_items';
const ORDER_ITEM_MODIFIERS_TABLE = 'pos_order_item_modifiers';
const ORDER_AUDIT_LOGS_TABLE = 'pos_order_audit_logs';
const TRANSACTIONS_TABLE = 'pos_transactions';

type MenuItemRow = {
  id: string;
  workspace_code: string;
  name: string;
  category: string;
  price: number;
};

type TableRow = {
  id: string;
  workspace_code: string;
  number: number;
  status: string;
  guest_count: number;
  opened_at: string | null;
  adisyon_no: string | null;
  order_items: OrderItem[] | null;
  audit_logs: OrderAuditLog[] | null;
  cover_enabled: boolean | null;
  cover_per_guest: number | null;
  waiter_name: string | null;
};

type TransactionRow = {
  id: string;
  workspace_code: string;
  created_at: string;
  table_id: string;
  table_no: number;
  adisyon_no: string;
  terminal_no: string;
  terminal_name: string;
  waiter_name: string | null;
  payment_type: string;
  split_method: string | null;
  amount: number;
  status: string;
  reference_no: string | null;
  error_code: string | null;
  refunded_from_transaction_id: string | null;
  refund_of_payment_type: string | null;
  note: string | null;
};

interface LegacyCloudSnapshot {
  menuItems: MenuItem[];
  tables: Table[];
  transactions: PaymentTransaction[];
  version: number;
  updatedAt: string;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isValidLegacySnapshot = (value: unknown): value is LegacyCloudSnapshot => {
  if (!isObject(value)) {
    return false;
  }

  return (
    Array.isArray(value.menuItems) &&
    Array.isArray(value.tables) &&
    Array.isArray(value.transactions) &&
    typeof value.version === 'number'
  );
};

export const normalizeWorkspaceCode = (value: string) => {
  const normalized = value
    .trim()
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'varsayilan-isyeri';
};

const mapMenuItemFromRow = (row: MenuItemRow): MenuItem => ({
  id: row.id,
  name: row.name,
  category: row.category as MenuItem['category'],
  price: Number(row.price),
});

const mapTableFromRow = (row: TableRow): Table => ({
  id: row.id,
  number: Number(row.number),
  status: row.status as Table['status'],
  guestCount: Number(row.guest_count ?? 0),
  openedAt: row.opened_at,
  adisyonNo: row.adisyon_no,
  orderItems: Array.isArray(row.order_items) ? row.order_items : [],
  auditLogs: Array.isArray(row.audit_logs) ? row.audit_logs : [],
  coverEnabled: Boolean(row.cover_enabled),
  coverPerGuest: Number(row.cover_per_guest ?? 35),
  waiterName: row.waiter_name,
});

const mapTransactionFromRow = (row: TransactionRow): PaymentTransaction => ({
  id: row.id,
  createdAt: row.created_at,
  tableId: row.table_id,
  tableNo: Number(row.table_no),
  adisyonNo: row.adisyon_no,
  terminalNo: row.terminal_no,
  terminalName: row.terminal_name,
  waiterName: row.waiter_name ?? undefined,
  paymentType: row.payment_type as PaymentTransaction['paymentType'],
  splitMethod: row.split_method ? (row.split_method as PaymentTransaction['splitMethod']) : undefined,
  amount: Number(row.amount),
  status: row.status as PaymentTransaction['status'],
  referenceNo: row.reference_no ?? undefined,
  errorCode: row.error_code ?? undefined,
  refundedFromTransactionId: row.refunded_from_transaction_id ?? undefined,
  refundOfPaymentType: row.refund_of_payment_type
    ? (row.refund_of_payment_type as PaymentTransaction['refundOfPaymentType'])
    : undefined,
  note: row.note ?? undefined,
});

const mapMenuItemToRow = (workspaceCode: string, item: MenuItem) => ({
  id: item.id,
  workspace_code: workspaceCode,
  name: item.name,
  category: item.category,
  price: Number(item.price.toFixed(2)),
  updated_at: new Date().toISOString(),
});

const mapTableToRow = (workspaceCode: string, table: Table) => ({
  id: table.id,
  workspace_code: workspaceCode,
  number: table.number,
  status: table.status,
  guest_count: table.guestCount,
  opened_at: table.openedAt,
  adisyon_no: table.adisyonNo,
  order_items: table.orderItems,
  audit_logs: table.auditLogs ?? [],
  cover_enabled: table.coverEnabled ?? false,
  cover_per_guest: table.coverPerGuest ?? 35,
  waiter_name: table.waiterName ?? null,
  updated_at: new Date().toISOString(),
});

const mapTransactionToRow = (workspaceCode: string, transaction: PaymentTransaction) => ({
  id: transaction.id,
  workspace_code: workspaceCode,
  created_at: transaction.createdAt,
  table_id: transaction.tableId,
  table_no: transaction.tableNo,
  adisyon_no: transaction.adisyonNo,
  terminal_no: transaction.terminalNo,
  terminal_name: transaction.terminalName,
  waiter_name: transaction.waiterName ?? null,
  payment_type: transaction.paymentType,
  split_method: transaction.splitMethod ?? null,
  amount: Number(transaction.amount.toFixed(2)),
  status: transaction.status,
  reference_no: transaction.referenceNo ?? null,
  error_code: transaction.errorCode ?? null,
  refunded_from_transaction_id: transaction.refundedFromTransactionId ?? null,
  refund_of_payment_type: transaction.refundOfPaymentType ?? null,
  note: transaction.note ?? null,
});

const buildOrderItemRowId = (tableId: string, item: OrderItem) => `${tableId}::${item.menuItemId}`;

const buildOrderItemModifierRowId = (tableId: string, item: OrderItem, modifierId: string) =>
  `${tableId}::${item.menuItemId}::${modifierId}`;

const mapWaiterToRow = (workspaceCode: string, waiterName: string, index: number) => ({
  id: `${workspaceCode}::waiter::${index + 1}`,
  workspace_code: workspaceCode,
  full_name: waiterName,
  is_active: true,
  sort_order: index + 1,
  updated_at: new Date().toISOString(),
});

const mapTerminalToRow = (workspaceCode: string, terminal: (typeof TERMINALS)[number]) => ({
  id: terminal.id,
  workspace_code: workspaceCode,
  name: terminal.name,
  terminal_no: terminal.terminalNo,
  model: terminal.model,
  location: terminal.location,
  is_active: terminal.isActive,
  updated_at: new Date().toISOString(),
});

const modifierGroupRows = (workspaceCode: string) =>
  Object.entries(MODIFIERS_BY_CATEGORY).flatMap(([category, groups]) =>
    groups.map((group, index) => ({
      id: group.id,
      workspace_code: workspaceCode,
      category,
      name: group.name,
      required: group.required ?? false,
      multi: group.multi ?? false,
      sort_order: index + 1,
      updated_at: new Date().toISOString(),
    })),
  );

const modifierOptionRows = (workspaceCode: string) =>
  Object.values(MODIFIERS_BY_CATEGORY).flatMap((groups) =>
    groups.flatMap((group) =>
      group.options.map((option, index) => ({
        id: option.id,
        workspace_code: workspaceCode,
        group_id: group.id,
        name: option.name,
        price: Number(option.price.toFixed(2)),
        sort_order: index + 1,
        updated_at: new Date().toISOString(),
      })),
    ),
  );

const orderItemRows = (workspaceCode: string, tables: Table[]) =>
  tables.flatMap((table) =>
    table.orderItems.map((item, index) => ({
      id: buildOrderItemRowId(table.id, item),
      workspace_code: workspaceCode,
      table_id: table.id,
      line_key: item.menuItemId,
      base_menu_item_id: item.baseMenuItemId ?? null,
      item_name: item.name,
      category: item.category,
      unit_price: Number(item.price.toFixed(2)),
      quantity: item.quantity,
      portion_multiplier: item.portionMultiplier ?? 1,
      seat_no: item.seatNo ?? null,
      note: item.note ?? null,
      item_status: item.itemStatus ?? 'AKTIF',
      void_reason: item.voidReason ?? null,
      voided_at: item.voidedAt ?? null,
      sort_order: index + 1,
      updated_at: new Date().toISOString(),
    })),
  );

const orderItemModifierRows = (workspaceCode: string, tables: Table[]) =>
  tables.flatMap((table) =>
    table.orderItems.flatMap((item) =>
      (item.modifiers ?? []).map((modifier, index) => ({
        id: buildOrderItemModifierRowId(table.id, item, modifier.id),
        workspace_code: workspaceCode,
        order_item_id: buildOrderItemRowId(table.id, item),
        modifier_id: modifier.id,
        modifier_name: modifier.name,
        price: Number(modifier.price.toFixed(2)),
        sort_order: index + 1,
        updated_at: new Date().toISOString(),
      })),
    ),
  );

const orderAuditRows = (workspaceCode: string, tables: Table[]) =>
  tables.flatMap((table) =>
    (table.auditLogs ?? []).map((log) => ({
      id: log.id,
      workspace_code: workspaceCode,
      table_id: table.id,
      menu_item_id: log.menuItemId ?? null,
      action: log.action,
      message: log.message,
      created_at: log.createdAt,
    })),
  );

const deleteMissingRows = async (
  tableName: string,
  workspaceCode: string,
  nextIds: string[],
) => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return;
  }

  const { data, error } = await supabaseClient
    .from(tableName)
    .select('id')
    .eq('workspace_code', workspaceCode);

  if (error) {
    throw error;
  }

  const existingIds = (data ?? []).map((row) => String((row as { id: string }).id));
  const nextIdSet = new Set(nextIds);
  const staleIds = existingIds.filter((id) => !nextIdSet.has(id));

  if (staleIds.length === 0) {
    return;
  }

  const deleteResult = await supabaseClient
    .from(tableName)
    .delete()
    .eq('workspace_code', workspaceCode)
    .in('id', staleIds);

  if (deleteResult.error) {
    throw deleteResult.error;
  }
};

const readLegacySnapshot = async (workspaceCode: string): Promise<CloudStatePayload | null> => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from(getSupabaseStateTable())
    .select('payload')
    .eq('workspace_code', workspaceCode)
    .maybeSingle();

  if (error) {
    const isMissingTable = error.code === '42P01';
    const isMissingRow = error.code === 'PGRST116';
    if (isMissingTable || isMissingRow) {
      return null;
    }

    throw error;
  }

  const payload = data?.payload as unknown;
  if (!payload || !isValidLegacySnapshot(payload)) {
    return null;
  }

  return {
    menuItems: payload.menuItems,
    tables: payload.tables,
    transactions: payload.transactions,
  };
};

export const readCloudSnapshot = async (workspaceCode: string): Promise<CloudStatePayload | null> => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return null;
  }

  const [menuResult, tablesResult, transactionsResult] = await Promise.all([
    supabaseClient
      .from(MENU_ITEMS_TABLE)
      .select('id, workspace_code, name, category, price')
      .eq('workspace_code', workspaceCode)
      .order('name', { ascending: true }),
    supabaseClient
      .from(TABLES_TABLE)
      .select('id, workspace_code, number, status, guest_count, opened_at, adisyon_no, order_items, audit_logs, cover_enabled, cover_per_guest, waiter_name')
      .eq('workspace_code', workspaceCode)
      .order('number', { ascending: true }),
    supabaseClient
      .from(TRANSACTIONS_TABLE)
      .select('id, workspace_code, created_at, table_id, table_no, adisyon_no, terminal_no, terminal_name, waiter_name, payment_type, split_method, amount, status, reference_no, error_code, refunded_from_transaction_id, refund_of_payment_type, note')
      .eq('workspace_code', workspaceCode)
      .order('created_at', { ascending: false }),
  ]);

  const knownMissingTable =
    menuResult.error?.code === '42P01' ||
    tablesResult.error?.code === '42P01' ||
    transactionsResult.error?.code === '42P01';

  if (!knownMissingTable && (menuResult.error || tablesResult.error || transactionsResult.error)) {
    throw menuResult.error ?? tablesResult.error ?? transactionsResult.error;
  }

  const menuRows = (menuResult.data ?? []) as MenuItemRow[];
  const tableRows = (tablesResult.data ?? []) as TableRow[];
  const transactionRows = (transactionsResult.data ?? []) as TransactionRow[];

  if (menuRows.length === 0 && tableRows.length === 0 && transactionRows.length === 0) {
    return readLegacySnapshot(workspaceCode);
  }

  return {
    menuItems: menuRows.map(mapMenuItemFromRow),
    tables: tableRows.map(mapTableFromRow),
    transactions: transactionRows.map(mapTransactionFromRow),
  };
};

export const writeCloudSnapshot = async (workspaceCode: string, state: CloudStatePayload) => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return;
  }

  const now = new Date().toISOString();

  const workspaceResult = await supabaseClient
    .from(WORKSPACES_TABLE)
    .upsert(
      {
        code: workspaceCode,
        display_name: workspaceCode,
        updated_at: now,
      },
      {
        onConflict: 'code',
      },
    );

  if (workspaceResult.error && workspaceResult.error.code !== '42P01') {
    throw workspaceResult.error;
  }

  if (state.menuItems.length > 0) {
    const menuResult = await supabaseClient
      .from(MENU_ITEMS_TABLE)
      .upsert(state.menuItems.map((item) => mapMenuItemToRow(workspaceCode, item)), {
        onConflict: 'id',
      });

    if (menuResult.error) {
      throw menuResult.error;
    }
  }

  const waiterResult = await supabaseClient
    .from(WAITERS_TABLE)
    .upsert(WAITER_NAMES.map((waiterName, index) => mapWaiterToRow(workspaceCode, waiterName, index)), {
      onConflict: 'id',
    });

  if (waiterResult.error && waiterResult.error.code !== '42P01') {
    throw waiterResult.error;
  }

  const terminalsResult = await supabaseClient
    .from(TERMINALS_TABLE)
    .upsert(TERMINALS.map((terminal) => mapTerminalToRow(workspaceCode, terminal)), {
      onConflict: 'id',
    });

  if (terminalsResult.error && terminalsResult.error.code !== '42P01') {
    throw terminalsResult.error;
  }

  const modifierGroupsResult = await supabaseClient
    .from(MODIFIER_GROUPS_TABLE)
    .upsert(modifierGroupRows(workspaceCode), {
      onConflict: 'id',
    });

  if (modifierGroupsResult.error && modifierGroupsResult.error.code !== '42P01') {
    throw modifierGroupsResult.error;
  }

  const modifierOptionsResult = await supabaseClient
    .from(MODIFIER_OPTIONS_TABLE)
    .upsert(modifierOptionRows(workspaceCode), {
      onConflict: 'id',
    });

  if (modifierOptionsResult.error && modifierOptionsResult.error.code !== '42P01') {
    throw modifierOptionsResult.error;
  }

  if (state.tables.length > 0) {
    const tablesResult = await supabaseClient
      .from(TABLES_TABLE)
      .upsert(state.tables.map((table) => mapTableToRow(workspaceCode, table)), {
        onConflict: 'id',
      });

    if (tablesResult.error) {
      throw tablesResult.error;
    }
  }

  const normalizedOrderItems = orderItemRows(workspaceCode, state.tables);
  if (normalizedOrderItems.length > 0) {
    const orderItemsResult = await supabaseClient
      .from(ORDER_ITEMS_TABLE)
      .upsert(normalizedOrderItems, {
        onConflict: 'id',
      });

    if (orderItemsResult.error && orderItemsResult.error.code !== '42P01') {
      throw orderItemsResult.error;
    }
  }

  const normalizedOrderItemModifiers = orderItemModifierRows(workspaceCode, state.tables);
  if (normalizedOrderItemModifiers.length > 0) {
    const orderItemModifiersResult = await supabaseClient
      .from(ORDER_ITEM_MODIFIERS_TABLE)
      .upsert(normalizedOrderItemModifiers, {
        onConflict: 'id',
      });

    if (orderItemModifiersResult.error && orderItemModifiersResult.error.code !== '42P01') {
      throw orderItemModifiersResult.error;
    }
  }

  const normalizedAuditRows = orderAuditRows(workspaceCode, state.tables);
  if (normalizedAuditRows.length > 0) {
    const auditResult = await supabaseClient
      .from(ORDER_AUDIT_LOGS_TABLE)
      .upsert(normalizedAuditRows, {
        onConflict: 'id',
      });

    if (auditResult.error && auditResult.error.code !== '42P01') {
      throw auditResult.error;
    }
  }

  if (state.transactions.length > 0) {
    const transactionsResult = await supabaseClient
      .from(TRANSACTIONS_TABLE)
      .upsert(state.transactions.map((transaction) => mapTransactionToRow(workspaceCode, transaction)), {
        onConflict: 'id',
      });

    if (transactionsResult.error) {
      throw transactionsResult.error;
    }
  }

  await Promise.all([
    deleteMissingRows(WAITERS_TABLE, workspaceCode, WAITER_NAMES.map((_name, index) => `${workspaceCode}::waiter::${index + 1}`)),
    deleteMissingRows(TERMINALS_TABLE, workspaceCode, TERMINALS.map((terminal) => terminal.id)),
    deleteMissingRows(MENU_ITEMS_TABLE, workspaceCode, state.menuItems.map((item) => item.id)),
    deleteMissingRows(MODIFIER_GROUPS_TABLE, workspaceCode, modifierGroupRows(workspaceCode).map((row) => row.id)),
    deleteMissingRows(MODIFIER_OPTIONS_TABLE, workspaceCode, modifierOptionRows(workspaceCode).map((row) => row.id)),
    deleteMissingRows(TABLES_TABLE, workspaceCode, state.tables.map((table) => table.id)),
    deleteMissingRows(ORDER_ITEMS_TABLE, workspaceCode, normalizedOrderItems.map((row) => row.id)),
    deleteMissingRows(ORDER_ITEM_MODIFIERS_TABLE, workspaceCode, normalizedOrderItemModifiers.map((row) => row.id)),
    deleteMissingRows(ORDER_AUDIT_LOGS_TABLE, workspaceCode, normalizedAuditRows.map((row) => row.id)),
    deleteMissingRows(TRANSACTIONS_TABLE, workspaceCode, state.transactions.map((transaction) => transaction.id)),
  ]);
};

export const CLOUD_RELATIONAL_TABLES = [
  WORKSPACES_TABLE,
  WAITERS_TABLE,
  TERMINALS_TABLE,
  MENU_ITEMS_TABLE,
  MODIFIER_GROUPS_TABLE,
  MODIFIER_OPTIONS_TABLE,
  TABLES_TABLE,
  ORDER_ITEMS_TABLE,
  ORDER_ITEM_MODIFIERS_TABLE,
  ORDER_AUDIT_LOGS_TABLE,
  TRANSACTIONS_TABLE,
] as const;

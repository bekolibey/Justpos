export type TableStatus = 'BOS' | 'DOLU' | 'ODEME_BEKLIYOR' | 'ODENDI';
export type ServiceStatus = 'BEKLIYOR' | 'MUTFAKTA' | 'HAZIR' | 'SERVISTE';

export type MenuCategory = 'İçecek' | 'Ana Yemek' | 'Tatlı' | 'Başlangıç' | 'Yan Ürün';
export type PortionMultiplier = 1 | 1.5 | 2;
export type OrderItemStatus = 'AKTIF' | 'IPTAL' | 'IKRAM';
export type OrderAuditAction = 'EKLEME' | 'IPTAL' | 'IKRAM' | 'GERI_AL' | 'SEAT';

export type PaymentType = 'NAKIT' | 'KART' | 'BOLUNMUS' | 'IPTAL' | 'IADE';

export type SplitPartMethod = 'NAKIT' | 'KART';

export type PaymentStatus = 'BASARILI' | 'BASARISIZ' | 'BEKLIYOR';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
}

export interface OrderItem {
  menuItemId: string;
  baseMenuItemId?: string;
  name: string;
  category: MenuCategory;
  price: number;
  quantity: number;
  portionMultiplier?: PortionMultiplier;
  seatNo?: number;
  modifiers?: ModifierOption[];
  note?: string;
  itemStatus?: OrderItemStatus;
  voidReason?: string;
  voidedAt?: string;
}

export interface Table {
  id: string;
  number: number;
  status: TableStatus;
  guestCount: number;
  openedAt: string | null;
  adisyonNo: string | null;
  orderItems: OrderItem[];
  auditLogs?: OrderAuditLog[];
  coverEnabled?: boolean;
  coverPerGuest?: number;
  waiterName?: string | null;
}

export interface Terminal {
  id: string;
  name: string;
  terminalNo: string;
  model: string;
  location: string;
  isActive: boolean;
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  role: string;
  workplaces: string[];
}

export interface PaymentTransaction {
  id: string;
  createdAt: string;
  tableId: string;
  tableNo: number;
  adisyonNo: string;
  terminalNo: string;
  terminalName: string;
  waiterName?: string;
  paymentType: PaymentType;
  splitMethod?: SplitPartMethod;
  amount: number;
  status: PaymentStatus;
  referenceNo?: string;
  errorCode?: string;
  refundedFromTransactionId?: string;
  refundOfPaymentType?: Exclude<PaymentType, 'IADE'>;
  note?: string;
}

export interface SplitPaymentPart {
  id: string;
  amount: number;
  method: SplitPartMethod;
  paid: boolean;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required?: boolean;
  multi?: boolean;
  options: ModifierOption[];
}

export interface OrderAuditLog {
  id: string;
  createdAt: string;
  action: OrderAuditAction;
  message: string;
  menuItemId?: string;
}

export interface ToastMessage {
  id: string;
  tone: 'success' | 'error' | 'info';
  message: string;
}

export interface OperationResult {
  ok: boolean;
  message: string;
}

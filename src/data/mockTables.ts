import type { OrderItem, Table } from '../types/pos';
import { WAITER_NAMES } from './waiters';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const createItem = (
  menuItemId: string,
  name: string,
  category: OrderItem['category'],
  price: number,
  quantity: number,
): OrderItem => ({
  menuItemId,
  name,
  category,
  price,
  quantity,
});

const BASE_TABLES: Table[] = [
  { id: 'table-1', number: 1, status: 'BOS', guestCount: 0, openedAt: null, adisyonNo: null, orderItems: [] },
  {
    id: 'table-2',
    number: 2,
    status: 'DOLU',
    guestCount: 3,
    openedAt: minutesAgo(42),
    adisyonNo: 'AD-20260407-002',
    orderItems: [
      createItem('main-adana-kebap', 'Adana Kebap', 'Ana Yemek', 285, 2),
      createItem('drink-ayran', 'Ayran', 'İçecek', 45, 2),
      createItem('side-pilav', 'Pilav', 'Yan Ürün', 70, 1),
    ],
  },
  {
    id: 'table-3',
    number: 3,
    status: 'ODEME_BEKLIYOR',
    guestCount: 2,
    openedAt: minutesAgo(67),
    adisyonNo: 'AD-20260407-003',
    orderItems: [
      createItem('main-tavuk-sis', 'Tavuk Şiş', 'Ana Yemek', 245, 2),
      createItem('drink-kola', 'Kola', 'İçecek', 65, 2),
      createItem('dessert-sutlac', 'Sütlaç', 'Tatlı', 110, 1),
    ],
  },
  {
    id: 'table-4',
    number: 4,
    status: 'ODENDI',
    guestCount: 4,
    openedAt: minutesAgo(90),
    adisyonNo: 'AD-20260407-004',
    orderItems: [
      createItem('main-izgara-kofte', 'Izgara Köfte', 'Ana Yemek', 265, 3),
      createItem('drink-limonata', 'Limonata', 'İçecek', 70, 4),
      createItem('starter-salata', 'Salata', 'Başlangıç', 120, 1),
    ],
  },
  {
    id: 'table-5',
    number: 5,
    status: 'DOLU',
    guestCount: 2,
    openedAt: minutesAgo(25),
    adisyonNo: 'AD-20260407-005',
    orderItems: [
      createItem('starter-corba', 'Çorba', 'Başlangıç', 95, 2),
      createItem('main-tavuk-sis', 'Tavuk Şiş', 'Ana Yemek', 245, 2),
    ],
  },
  { id: 'table-6', number: 6, status: 'BOS', guestCount: 0, openedAt: null, adisyonNo: null, orderItems: [] },
  {
    id: 'table-7',
    number: 7,
    status: 'DOLU',
    guestCount: 5,
    openedAt: minutesAgo(58),
    adisyonNo: 'AD-20260407-007',
    orderItems: [
      createItem('main-adana-kebap', 'Adana Kebap', 'Ana Yemek', 285, 3),
      createItem('drink-kola', 'Kola', 'İçecek', 65, 5),
      createItem('side-patates', 'Patates', 'Yan Ürün', 85, 2),
    ],
  },
  { id: 'table-8', number: 8, status: 'BOS', guestCount: 0, openedAt: null, adisyonNo: null, orderItems: [] },
  {
    id: 'table-9',
    number: 9,
    status: 'ODEME_BEKLIYOR',
    guestCount: 3,
    openedAt: minutesAgo(76),
    adisyonNo: 'AD-20260407-009',
    orderItems: [
      createItem('main-izgara-kofte', 'Izgara Köfte', 'Ana Yemek', 265, 2),
      createItem('dessert-kunefe', 'Künefe', 'Tatlı', 160, 2),
      createItem('drink-ayran', 'Ayran', 'İçecek', 45, 3),
    ],
  },
  { id: 'table-10', number: 10, status: 'BOS', guestCount: 0, openedAt: null, adisyonNo: null, orderItems: [] },
  {
    id: 'table-11',
    number: 11,
    status: 'DOLU',
    guestCount: 2,
    openedAt: minutesAgo(34),
    adisyonNo: 'AD-20260407-011',
    orderItems: [
      createItem('main-tavuk-sis', 'Tavuk Şiş', 'Ana Yemek', 245, 1),
      createItem('drink-limonata', 'Limonata', 'İçecek', 70, 2),
      createItem('dessert-sutlac', 'Sütlaç', 'Tatlı', 110, 2),
    ],
  },
  { id: 'table-12', number: 12, status: 'BOS', guestCount: 0, openedAt: null, adisyonNo: null, orderItems: [] },
];

export const INITIAL_TABLES: Table[] = BASE_TABLES.map((table, index) => ({
  ...table,
  coverEnabled: false,
  coverPerGuest: 35,
  waiterName: table.status === 'BOS' ? null : WAITER_NAMES[index % WAITER_NAMES.length],
}));

import type { MenuCategory, MenuItem } from '../types/pos';

export const MENU_CATEGORIES: MenuCategory[] = ['İçecek', 'Ana Yemek', 'Tatlı', 'Başlangıç', 'Yan Ürün'];

export const MENU_ITEMS: MenuItem[] = [
  { id: 'drink-kola', name: 'Kola', category: 'İçecek', price: 65 },
  { id: 'drink-ayran', name: 'Ayran', category: 'İçecek', price: 45 },
  { id: 'drink-limonata', name: 'Limonata', category: 'İçecek', price: 70 },

  { id: 'main-adana-kebap', name: 'Adana Kebap', category: 'Ana Yemek', price: 285 },
  { id: 'main-tavuk-sis', name: 'Tavuk Şiş', category: 'Ana Yemek', price: 245 },
  { id: 'main-izgara-kofte', name: 'Izgara Köfte', category: 'Ana Yemek', price: 265 },

  { id: 'dessert-kunefe', name: 'Künefe', category: 'Tatlı', price: 160 },
  { id: 'dessert-sutlac', name: 'Sütlaç', category: 'Tatlı', price: 110 },

  { id: 'starter-corba', name: 'Çorba', category: 'Başlangıç', price: 95 },
  { id: 'starter-salata', name: 'Salata', category: 'Başlangıç', price: 120 },

  { id: 'side-pilav', name: 'Pilav', category: 'Yan Ürün', price: 70 },
  { id: 'side-patates', name: 'Patates', category: 'Yan Ürün', price: 85 },
];

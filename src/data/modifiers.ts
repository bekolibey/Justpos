import type { MenuCategory, ModifierGroup } from '../types/pos';

export const MODIFIERS_BY_CATEGORY: Record<MenuCategory, ModifierGroup[]> = {
  'Ana Yemek': [
    {
      id: 'spice',
      name: 'Acı Seviyesi',
      required: false,
      multi: false,
      options: [
        { id: 'spice-az', name: 'Az Acılı', price: 0 },
        { id: 'spice-orta', name: 'Orta Acılı', price: 0 },
        { id: 'spice-cok', name: 'Çok Acılı', price: 0 },
      ],
    },
    {
      id: 'extra-main',
      name: 'Ekstra',
      required: false,
      multi: true,
      options: [
        { id: 'extra-sos', name: 'Ek Sos', price: 20 },
        { id: 'extra-lavas', name: 'Ek Lavaş', price: 15 },
      ],
    },
  ],
  İçecek: [
    {
      id: 'drink-opt',
      name: 'İçecek Seçenekleri',
      multi: true,
      options: [
        { id: 'drink-buzsuz', name: 'Buzsuz', price: 0 },
        { id: 'drink-limon', name: 'Limon Dilimi', price: 5 },
      ],
    },
  ],
  Tatlı: [
    {
      id: 'dessert-extra',
      name: 'Tatlı Ekstra',
      multi: true,
      options: [
        { id: 'dessert-kaymak', name: 'Ek Kaymak', price: 25 },
      ],
    },
  ],
  Başlangıç: [
    {
      id: 'starter-extra',
      name: 'Başlangıç Ekstra',
      multi: true,
      options: [
        { id: 'starter-limon', name: 'Ek Limon', price: 5 },
      ],
    },
  ],
  'Yan Ürün': [
    {
      id: 'side-extra',
      name: 'Yan Ürün Ekstra',
      multi: true,
      options: [
        { id: 'side-buyuk', name: 'Büyük Servis', price: 30 },
      ],
    },
  ],
};

export const flattenModifierOptions = (category: MenuCategory) =>
  MODIFIERS_BY_CATEGORY[category].flatMap((group) => group.options);

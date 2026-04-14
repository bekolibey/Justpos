import type { MenuItem, PortionMultiplier } from '../types/pos';

const ONE_AND_HALF_PORTION_ITEM_IDS = new Set<string>([
  'main-adana-kebap',
  'main-tavuk-sis',
  'main-izgara-kofte',
  'side-pilav',
]);

const DOUBLE_PORTION_ITEM_IDS = new Set<string>([
  'main-adana-kebap',
  'main-tavuk-sis',
  'main-izgara-kofte',
  'side-pilav',
  'side-patates',
]);

const ORDERED_PORTIONS: PortionMultiplier[] = [1, 1.5, 2];

export const getPortionOptions = (item: MenuItem): PortionMultiplier[] => {
  const optionSet = new Set<PortionMultiplier>([1]);

  if (item.category === 'Ana Yemek') {
    optionSet.add(1.5);
    optionSet.add(2);
  }

  if (item.category === 'Yan Ürün') {
    optionSet.add(2);
  }

  if (ONE_AND_HALF_PORTION_ITEM_IDS.has(item.id)) {
    optionSet.add(1.5);
  }

  if (DOUBLE_PORTION_ITEM_IDS.has(item.id)) {
    optionSet.add(2);
  }

  if (item.category === 'İçecek' || item.category === 'Tatlı' || item.category === 'Başlangıç') {
    optionSet.delete(1.5);
    optionSet.delete(2);
  }

  return ORDERED_PORTIONS.filter((rate) => optionSet.has(rate));
};


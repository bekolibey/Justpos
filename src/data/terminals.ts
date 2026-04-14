import type { Terminal } from '../types/pos';

export const TERMINALS: Terminal[] = [
  {
    id: 'terminal-01',
    name: 'Kasiyer Terminali 1',
    terminalNo: 'TRM-001245',
    model: 'VakıfPOS V300',
    location: 'Ana Salon',
    isActive: true,
  },
  {
    id: 'terminal-02',
    name: 'Kasiyer Terminali 2',
    terminalNo: 'TRM-001246',
    model: 'VakıfPOS P200',
    location: 'Teras',
    isActive: true,
  },
  {
    id: 'terminal-03',
    name: 'Yedek Terminal',
    terminalNo: 'TRM-009999',
    model: 'VakıfPOS Mini',
    location: 'Bar Bölümü',
    isActive: false,
  },
];

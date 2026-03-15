export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  income: number;
  ownerId?: string;
}

export type PaymentMethod = 'credito' | 'debito' | 'pix' | 'alimentacao';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'credito', label: 'Cartão de Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'pix', label: 'Pix' },
  { value: 'alimentacao', label: 'Alimentação' },
];

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  date: string;
  memberId: string;
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'alimentacao', name: 'Alimentação' },
  { id: 'transporte', name: 'Transporte' },
  { id: 'moradia', name: 'Moradia' },
  { id: 'saude', name: 'Saúde' },
  { id: 'educacao', name: 'Educação' },
  { id: 'lazer', name: 'Lazer' },
  { id: 'contas', name: 'Contas' },
  { id: 'cartao', name: 'Cartão de Crédito' },
  { id: 'outros', name: 'Outros' },
];

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
  'hsl(var(--chart-9))',
];

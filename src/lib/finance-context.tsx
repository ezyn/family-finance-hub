import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Expense, FamilyMember, Category, DEFAULT_CATEGORIES } from './types';

interface FinanceContextType {
  expenses: Expense[];
  members: FamilyMember[];
  categories: Category[];
  addExpense: (e: Omit<Expense, 'id'>) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  addMember: (m: Omit<FamilyMember, 'id'>) => void;
  updateMember: (m: FamilyMember) => void;
  deleteMember: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

const STORAGE_KEYS = {
  expenses: 'ff_expenses',
  members: 'ff_members',
  categories: 'ff_categories',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(() => load(STORAGE_KEYS.expenses, []));
  const [members, setMembers] = useState<FamilyMember[]>(() => load(STORAGE_KEYS.members, []));
  const [categories, setCategories] = useState<Category[]>(() => load(STORAGE_KEYS.categories, DEFAULT_CATEGORIES));

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.members, JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories)); }, [categories]);

  const addExpense = useCallback((e: Omit<Expense, 'id'>) => {
    setExpenses(prev => [{ ...e, id: crypto.randomUUID() }, ...prev]);
  }, []);
  const updateExpense = useCallback((e: Expense) => {
    setExpenses(prev => prev.map(x => x.id === e.id ? e : x));
  }, []);
  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(x => x.id !== id));
  }, []);
  const addMember = useCallback((m: Omit<FamilyMember, 'id'>) => {
    setMembers(prev => [...prev, { ...m, id: crypto.randomUUID() }]);
  }, []);
  const updateMember = useCallback((m: FamilyMember) => {
    setMembers(prev => prev.map(x => x.id === m.id ? m : x));
  }, []);
  const deleteMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(x => x.id !== id));
  }, []);
  const addCategory = useCallback((name: string) => {
    setCategories(prev => [...prev, { id: crypto.randomUUID(), name }]);
  }, []);
  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(x => x.id !== id));
  }, []);

  return (
    <FinanceContext.Provider value={{
      expenses, members, categories,
      addExpense, updateExpense, deleteExpense,
      addMember, updateMember, deleteMember,
      addCategory, deleteCategory,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

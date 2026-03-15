import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Expense, FamilyMember, Category, DEFAULT_CATEGORIES } from './types';
import type { PaymentMethod } from './types';
import { useAuth } from '@/hooks/useAuth';

interface FinanceContextType {
  expenses: Expense[];
  members: FamilyMember[];
  categories: Category[];
  loading: boolean;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  addMember: (m: Omit<FamilyMember, 'id' | 'ownerId'>) => void;
  updateMember: (m: FamilyMember) => void;
  deleteMember: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      const [expRes, memRes, catRes] = await Promise.all([
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('family_members').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
      ]);
      if (expRes.data) setExpenses(expRes.data.map(mapExpense));
      if (memRes.data) setMembers(memRes.data.map(mapMember));
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const addExpense = useCallback(async (e: Omit<Expense, 'id'>) => {
    const { data, error } = await supabase.from('expenses').insert({
      name: e.name,
      amount: e.amount,
      category: e.category,
      payment_method: e.paymentMethod,
      date: e.date,
      member_id: e.memberId,
      note: e.note || null,
    }).select().single();
    if (data && !error) setExpenses(prev => [mapExpense(data), ...prev]);
  }, []);

  const updateExpense = useCallback(async (e: Expense) => {
    const { data, error } = await supabase.from('expenses').update({
      name: e.name,
      amount: e.amount,
      category: e.category,
      payment_method: e.paymentMethod,
      date: e.date,
      member_id: e.memberId,
      note: e.note || null,
    }).eq('id', e.id).select().single();
    if (data && !error) setExpenses(prev => prev.map(x => x.id === e.id ? mapExpense(data) : x));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(prev => prev.filter(x => x.id !== id));
  }, []);

  const addMember = useCallback(async (m: Omit<FamilyMember, 'id' | 'ownerId'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('family_members').insert({
      name: m.name,
      email: m.email,
      avatar: m.avatar || null,
      income: m.income,
      owner_id: user.id,
    }).select().single();
    if (data && !error) setMembers(prev => [...prev, mapMember(data)]);
  }, [user]);

  const updateMember = useCallback(async (m: FamilyMember) => {
    const { data, error } = await supabase.from('family_members').update({
      name: m.name,
      email: m.email,
      avatar: m.avatar || null,
      income: m.income,
    }).eq('id', m.id).select().single();
    if (data && !error) setMembers(prev => prev.map(x => x.id === m.id ? mapMember(data) : x));
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (!error) setMembers(prev => prev.filter(x => x.id !== id));
  }, []);

  const addCategory = useCallback(async (name: string) => {
    const id = crypto.randomUUID();
    const { data, error } = await supabase.from('categories').insert({ id, name }).select().single();
    if (data && !error) setCategories(prev => [...prev, data]);
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) setCategories(prev => prev.filter(x => x.id !== id));
  }, []);

  return (
    <FinanceContext.Provider value={{
      expenses, members, categories, loading,
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

function mapExpense(row: any): Expense {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    category: row.category,
    paymentMethod: row.payment_method as PaymentMethod,
    date: row.date,
    memberId: row.member_id,
    note: row.note || undefined,
  };
}

function mapMember(row: any): FamilyMember {
  return {
    id: row.id,
    name: row.name,
    email: row.email || '',
    avatar: row.avatar || undefined,
    income: Number(row.income),
    ownerId: row.owner_id,
  };
}

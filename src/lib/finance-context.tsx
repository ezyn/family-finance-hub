import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Expense, FamilyMember, Category, Budget, RecurringExpense, ExpenseComment, DEFAULT_CATEGORIES } from './types';
import type { PaymentMethod } from './types';
import { useAuth } from '@/hooks/useAuth';

interface FinanceContextType {
  expenses: Expense[];
  members: FamilyMember[];
  categories: Category[];
  budgets: Budget[];
  recurring: RecurringExpense[];
  loading: boolean;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  addMember: (m: Omit<FamilyMember, 'id' | 'ownerId'>) => void;
  updateMember: (m: FamilyMember) => void;
  deleteMember: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  setBudget: (category: string, amount: number) => void;
  deleteBudget: (id: string) => void;
  addRecurring: (r: Omit<RecurringExpense, 'id' | 'ownerId' | 'lastGenerated'>) => void;
  updateRecurring: (r: RecurringExpense) => void;
  deleteRecurring: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      const [expRes, memRes, catRes, budRes, recRes] = await Promise.all([
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('family_members').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
        supabase.from('budgets').select('*'),
        supabase.from('recurring_expenses').select('*').order('created_at', { ascending: true }),
      ]);
      if (expRes.data) setExpenses(expRes.data.map(mapExpense));
      if (memRes.data) setMembers(memRes.data.map(mapMember));
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (budRes.data) setBudgets(budRes.data.map(mapBudget));
      if (recRes.data) setRecurring(recRes.data.map(mapRecurring));
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
    if (!user) return;
    const id = crypto.randomUUID();
    const { data, error } = await supabase.from('categories').insert({ id, name, owner_id: user.id }).select().single();
    if (data && !error) setCategories(prev => [...prev, data]);
  }, [user]);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) setCategories(prev => prev.filter(x => x.id !== id));
  }, []);

  const setBudget = useCallback(async (category: string, amount: number) => {
    if (!user) return;
    const { data, error } = await supabase.from('budgets')
      .upsert({ owner_id: user.id, category, amount }, { onConflict: 'owner_id,category' })
      .select().single();
    if (data && !error) {
      setBudgets(prev => {
        const exists = prev.some(b => b.category === category);
        const mapped = mapBudget(data);
        return exists ? prev.map(b => b.category === category ? mapped : b) : [...prev, mapped];
      });
    }
  }, [user]);

  const deleteBudget = useCallback(async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (!error) setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  const addRecurring = useCallback(async (r: Omit<RecurringExpense, 'id' | 'ownerId' | 'lastGenerated'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('recurring_expenses').insert({
      owner_id: user.id,
      name: r.name,
      amount: r.amount,
      category: r.category,
      payment_method: r.paymentMethod,
      member_id: r.memberId,
      day_of_month: r.dayOfMonth,
      note: r.note || null,
      active: r.active,
    }).select().single();
    if (data && !error) setRecurring(prev => [...prev, mapRecurring(data)]);
  }, [user]);

  const updateRecurring = useCallback(async (r: RecurringExpense) => {
    const { data, error } = await supabase.from('recurring_expenses').update({
      name: r.name,
      amount: r.amount,
      category: r.category,
      payment_method: r.paymentMethod,
      member_id: r.memberId,
      day_of_month: r.dayOfMonth,
      note: r.note || null,
      active: r.active,
    }).eq('id', r.id).select().single();
    if (data && !error) setRecurring(prev => prev.map(x => x.id === r.id ? mapRecurring(data) : x));
  }, []);

  const deleteRecurring = useCallback(async (id: string) => {
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (!error) setRecurring(prev => prev.filter(x => x.id !== id));
  }, []);

  // Auto-generate due recurring expenses for the current month
  useEffect(() => {
    if (loading || recurring.length === 0) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const generate = async () => {
      for (const r of recurring) {
        if (!r.active) continue;
        const alreadyThisMonth = r.lastGenerated?.slice(0, 7) === monthKey;
        if (alreadyThisMonth) continue;
        if (now.getDate() < r.dayOfMonth) continue;
        const day = Math.min(r.dayOfMonth, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
        const date = `${monthKey}-${String(day).padStart(2, '0')}`;
        const { data, error } = await supabase.from('expenses').insert({
          name: r.name,
          amount: r.amount,
          category: r.category,
          payment_method: r.paymentMethod,
          date,
          member_id: r.memberId,
          note: r.note || 'Despesa recorrente',
        }).select().single();
        if (data && !error) {
          setExpenses(prev => [mapExpense(data), ...prev]);
          const { data: upd } = await supabase.from('recurring_expenses')
            .update({ last_generated: date }).eq('id', r.id).select().single();
          if (upd) setRecurring(prev => prev.map(x => x.id === r.id ? mapRecurring(upd) : x));
        }
      }
    };
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <FinanceContext.Provider value={{
      expenses, members, categories, budgets, recurring, loading,
      addExpense, updateExpense, deleteExpense,
      addMember, updateMember, deleteMember,
      addCategory, deleteCategory,
      setBudget, deleteBudget,
      addRecurring, updateRecurring, deleteRecurring,
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

function mapBudget(row: any): Budget {
  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    ownerId: row.owner_id,
  };
}

function mapRecurring(row: any): RecurringExpense {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    category: row.category,
    paymentMethod: row.payment_method as PaymentMethod,
    memberId: row.member_id,
    dayOfMonth: row.day_of_month,
    note: row.note || undefined,
    active: row.active,
    lastGenerated: row.last_generated || undefined,
    ownerId: row.owner_id,
  };
}

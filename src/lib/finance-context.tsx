import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Expense, FamilyMember, Category, Budget, RecurringExpense, ExpenseComment, ChangeLog, Challenge, DEFAULT_CATEGORIES } from './types';
import type { PaymentMethod } from './types';
import { useAuth } from '@/hooks/useAuth';

interface FinanceContextType {
  expenses: Expense[];
  members: FamilyMember[];
  categories: Category[];
  budgets: Budget[];
  recurring: RecurringExpense[];
  challenges: Challenge[];
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
  uploadReceipt: (expenseId: string, file: File) => Promise<void>;
  removeReceipt: (expenseId: string) => Promise<void>;
  fetchComments: (expenseId: string) => Promise<ExpenseComment[]>;
  addComment: (expenseId: string, content: string) => Promise<ExpenseComment | null>;
  deleteComment: (id: string) => Promise<void>;
  fetchDeletedExpenses: () => Promise<Expense[]>;
  restoreExpense: (id: string) => Promise<void>;
  permanentlyDeleteExpense: (id: string) => Promise<void>;
  fetchLogs: () => Promise<ChangeLog[]>;
  exportBackup: () => void;
  addChallenge: (c: Omit<Challenge, 'id' | 'ownerId' | 'completed' | 'createdAt'>) => void;
  updateChallenge: (c: Challenge) => void;
  deleteChallenge: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      const [expRes, memRes, catRes, budRes, recRes, chRes] = await Promise.all([
        supabase.from('expenses').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('family_members').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('created_at', { ascending: true }),
        supabase.from('budgets').select('*'),
        supabase.from('recurring_expenses').select('*').order('created_at', { ascending: true }),
        supabase.from('challenges').select('*').order('created_at', { ascending: false }),
      ]);
      if (expRes.data) setExpenses(expRes.data.map(mapExpense));
      if (memRes.data) setMembers(memRes.data.map(mapMember));
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (budRes.data) setBudgets(budRes.data.map(mapBudget));
      if (recRes.data) setRecurring(recRes.data.map(mapRecurring));
      if (chRes.data) setChallenges(chRes.data.map(mapChallenge));
      setLoading(false);
    };
    fetchAll();
  }, [user]);


  const logAction = useCallback(async (
    action: ChangeLog['action'], entity: string, summary: string, ownerId?: string,
  ) => {
    if (!user) return;
    const owner = ownerId || user.id;
    const authorName = members.find(m => m.email === user.email)?.name || user.email?.split('@')[0] || 'Membro';
    await supabase.from('change_logs').insert({
      owner_id: owner, actor_id: user.id, actor_name: authorName, action, entity, summary,
    });
  }, [user, members]);

  const ownerForMember = useCallback((memberId: string) =>
    members.find(m => m.id === memberId)?.ownerId, [members]);

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
    if (data && !error) {
      setExpenses(prev => [mapExpense(data), ...prev]);
      logAction('create', 'expense', `Adicionou "${e.name}" (R$ ${e.amount.toFixed(2)})`, ownerForMember(e.memberId));
    }
  }, [logAction, ownerForMember]);

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
    if (data && !error) {
      setExpenses(prev => prev.map(x => x.id === e.id ? mapExpense(data) : x));
      logAction('update', 'expense', `Editou "${e.name}" (R$ ${e.amount.toFixed(2)})`, ownerForMember(e.memberId));
    }
  }, [logAction, ownerForMember]);

  const deleteExpense = useCallback(async (id: string) => {
    const exp = expenses.find(x => x.id === id);
    const { error } = await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      setExpenses(prev => prev.filter(x => x.id !== id));
      if (exp) logAction('delete', 'expense', `Excluiu "${exp.name}" (R$ ${exp.amount.toFixed(2)})`, ownerForMember(exp.memberId));
    }

  }, [expenses, logAction, ownerForMember]);

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

  const uploadReceipt = useCallback(async (expenseId: string, file: File) => {
    if (!user) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${expenseId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('receipts').upload(path, file, { upsert: true });
    if (upErr) return;
    const { data: pub } = supabase.storage.from('receipts').getPublicUrl(path);
    const { data, error } = await supabase.from('expenses').update({ receipt_url: pub.publicUrl }).eq('id', expenseId).select().single();
    if (data && !error) setExpenses(prev => prev.map(x => x.id === expenseId ? mapExpense(data) : x));
  }, [user]);

  const removeReceipt = useCallback(async (expenseId: string) => {
    const { data, error } = await supabase.from('expenses').update({ receipt_url: null }).eq('id', expenseId).select().single();
    if (data && !error) setExpenses(prev => prev.map(x => x.id === expenseId ? mapExpense(data) : x));
  }, []);

  const fetchComments = useCallback(async (expenseId: string): Promise<ExpenseComment[]> => {
    const { data } = await supabase.from('expense_comments').select('*').eq('expense_id', expenseId).order('created_at', { ascending: true });
    return (data || []).map(mapComment);
  }, []);

  const addComment = useCallback(async (expenseId: string, content: string): Promise<ExpenseComment | null> => {
    if (!user) return null;
    const authorName = members.find(m => m.email === user.email)?.name || user.email?.split('@')[0] || 'Membro';
    const { data, error } = await supabase.from('expense_comments').insert({
      expense_id: expenseId, author_id: user.id, author_name: authorName, content,
    }).select().single();
    return data && !error ? mapComment(data) : null;
  }, [user, members]);

  const deleteComment = useCallback(async (id: string) => {
    await supabase.from('expense_comments').delete().eq('id', id);
  }, []);


  const fetchDeletedExpenses = useCallback(async (): Promise<Expense[]> => {
    const { data } = await supabase.from('expenses').select('*')
      .not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
    return (data || []).map(mapExpense);
  }, []);

  const restoreExpense = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('expenses')
      .update({ deleted_at: null }).eq('id', id).select().single();
    if (data && !error) {
      const exp = mapExpense(data);
      setExpenses(prev => [exp, ...prev.filter(x => x.id !== id)]);
      logAction('restore', 'expense', `Restaurou "${exp.name}" (R$ ${exp.amount.toFixed(2)})`, ownerForMember(exp.memberId));
    }
  }, [logAction, ownerForMember]);

  const permanentlyDeleteExpense = useCallback(async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
  }, []);

  const fetchLogs = useCallback(async (): Promise<ChangeLog[]> => {
    const { data } = await supabase.from('change_logs').select('*')
      .order('created_at', { ascending: false }).limit(200);
    return (data || []).map(mapLog);
  }, []);

  const exportBackup = useCallback(() => {
    const backup = {
      exportedAt: new Date().toISOString(),
      members, categories, expenses, budgets, recurring,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [members, categories, expenses, budgets, recurring]);

  const addChallenge = useCallback(async (c: Omit<Challenge, 'id' | 'ownerId' | 'completed' | 'createdAt'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('challenges').insert({
      owner_id: user.id,
      title: c.title,
      description: c.description || null,
      category: c.category || null,
      target_amount: c.targetAmount,
      start_date: c.startDate,
      end_date: c.endDate,
    }).select().single();
    if (data && !error) {
      setChallenges(prev => [mapChallenge(data), ...prev]);
      logAction('create', 'challenge', `Criou o desafio "${c.title}"`, user.id);
    }
  }, [user, logAction]);

  const updateChallenge = useCallback(async (c: Challenge) => {
    const { data, error } = await supabase.from('challenges').update({
      title: c.title,
      description: c.description || null,
      category: c.category || null,
      target_amount: c.targetAmount,
      start_date: c.startDate,
      end_date: c.endDate,
      completed: c.completed,
    }).eq('id', c.id).select().single();
    if (data && !error) setChallenges(prev => prev.map(x => x.id === c.id ? mapChallenge(data) : x));
  }, []);

  const deleteChallenge = useCallback(async (id: string) => {
    const { error } = await supabase.from('challenges').delete().eq('id', id);
    if (!error) setChallenges(prev => prev.filter(x => x.id !== id));
  }, []);

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
      expenses, members, categories, budgets, recurring, challenges, loading,
      addExpense, updateExpense, deleteExpense,
      addMember, updateMember, deleteMember,
      addCategory, deleteCategory,
      setBudget, deleteBudget,
      addRecurring, updateRecurring, deleteRecurring,
      uploadReceipt, removeReceipt, fetchComments, addComment, deleteComment,
      fetchDeletedExpenses, restoreExpense, permanentlyDeleteExpense, fetchLogs, exportBackup,
      addChallenge, updateChallenge, deleteChallenge,
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
    receiptUrl: row.receipt_url || undefined,
    deletedAt: row.deleted_at || undefined,
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

function mapComment(row: any): ExpenseComment {
  return {
    id: row.id,
    expenseId: row.expense_id,
    authorId: row.author_id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

function mapLog(row: any): ChangeLog {
  return {
    id: row.id,
    ownerId: row.owner_id,
    actorId: row.actor_id,
    actorName: row.author_name ?? row.actor_name,
    action: row.action,
    entity: row.entity,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

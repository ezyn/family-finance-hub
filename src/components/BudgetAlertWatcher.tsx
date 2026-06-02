import { useEffect, useRef } from 'react';
import { useFinance } from '@/lib/finance-context';
import { useCurrentMonth } from '@/hooks/useCurrentMonth';
import { startOfMonth, isAfter } from 'date-fns';
import { toast } from 'sonner';

/**
 * Componente invisível que monitora os gastos do mês por categoria e
 * dispara notificações quando uma categoria atinge 80% ou ultrapassa
 * o orçamento definido. Evita repetir a mesma notificação usando localStorage.
 */
export function BudgetAlertWatcher() {
  const { budgets, categories, expenses, loading } = useFinance();
  const monthKey = useCurrentMonth();
  const ready = useRef(false);

  useEffect(() => {
    // Aguarda o carregamento inicial para não notificar dados já existentes
    if (loading) return;
    if (!ready.current) {
      ready.current = true;
      return;
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = startOfMonth(now);

    const spentByCategory: Record<string, number> = {};
    for (const e of expenses) {
      if (isAfter(new Date(e.date), monthStart)) {
        spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
      }
    }

    const catName = (id: string) => categories.find(c => c.id === id)?.name || id;
    const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    for (const b of budgets) {
      if (!b.amount || b.amount <= 0) continue;
      const spent = spentByCategory[b.category] || 0;
      const pct = (spent / b.amount) * 100;
      const level = pct >= 100 ? 'over' : pct >= 80 ? 'near' : null;
      if (!level) continue;

      const storageKey = `ff_budget_alert_${monthKey}_${b.category}_${level}`;
      if (localStorage.getItem(storageKey)) continue;
      localStorage.setItem(storageKey, '1');

      if (level === 'over') {
        toast.error(`Orçamento ultrapassado: ${catName(b.category)}`, {
          description: `Gasto de ${brl(spent)} excede o limite de ${brl(b.amount)} este mês.`,
          duration: 8000,
        });
      } else {
        toast.warning(`Atenção: ${catName(b.category)} em ${pct.toFixed(0)}%`, {
          description: `Já foram gastos ${brl(spent)} do limite de ${brl(b.amount)} este mês.`,
          duration: 7000,
        });
      }
    }
  }, [budgets, categories, expenses, loading]);

  return null;
}

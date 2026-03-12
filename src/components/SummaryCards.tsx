import { useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFinance } from '@/lib/finance-context';
import { startOfMonth, startOfWeek, isAfter } from 'date-fns';

export function SummaryCards() {
  const { expenses, members } = useFinance();

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    let total = 0, month = 0, week = 0;
    for (const e of expenses) {
      const d = new Date(e.date);
      total += e.amount;
      if (isAfter(d, monthStart)) month += e.amount;
      if (isAfter(d, weekStart)) week += e.amount;
    }

    const totalIncome = members.reduce((sum, m) => sum + m.income, 0);

    return { total, month, week, totalIncome };
  }, [expenses, members]);

  const cards = [
    { label: 'Gastos do Mês', value: stats.month, icon: TrendingDown, color: 'text-destructive' },
    { label: 'Gastos da Semana', value: stats.week, icon: Wallet, color: 'text-accent' },
    { label: 'Total Acumulado', value: stats.total, icon: DollarSign, color: 'text-primary' },
    { label: 'Receita Total', value: stats.totalIncome, icon: TrendingUp, color: 'text-[hsl(var(--success))]' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className={`text-2xl font-bold mt-1 font-[family-name:var(--font-heading)]`}>
                  R$ {c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-muted ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

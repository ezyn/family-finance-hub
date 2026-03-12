import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/lib/finance-context';
import { CHART_COLORS } from '@/lib/types';

export function MemberSpending() {
  const { expenses, members } = useFinance();

  const data = useMemo(() => {
    return members.map((m, i) => {
      const total = expenses.filter(e => e.memberId === m.id).reduce((s, e) => s + e.amount, 0);
      return { ...m, total, color: CHART_COLORS[i % CHART_COLORS.length] };
    }).sort((a, b) => b.total - a.total);
  }, [expenses, members]);

  const max = Math.max(...data.map(d => d.total), 1);

  if (data.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-base">Gastos por Membro</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground text-sm text-center py-8">
          Adicione membros da família para ver os gastos
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader><CardTitle className="text-base">Gastos por Membro</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {data.map(d => (
          <div key={d.id} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{d.name}</span>
              <span className="text-muted-foreground">R$ {d.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(d.total / max) * 100}%`, backgroundColor: d.color }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Receita: R$ {d.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <span>Saldo: R$ {(d.income - d.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

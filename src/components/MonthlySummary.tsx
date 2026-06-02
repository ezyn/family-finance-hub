import { useMemo } from 'react';
import { useFinance } from '@/lib/finance-context';
import { useCurrentMonth } from '@/hooks/useCurrentMonth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, TrendingDown, Crown, Receipt, Users } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

/**
 * Resumo financeiro mensal automático: totais, variação e destaques por categoria.
 */
export function MonthlySummary() {
  const { expenses, categories, members } = useFinance();
  const monthKey = useCurrentMonth();

  const now = new Date();
  const curStart = startOfMonth(now);
  const curEnd = endOfMonth(now);
  const prevDate = subMonths(now, 1);
  const prevStart = startOfMonth(prevDate);
  const prevEnd = endOfMonth(prevDate);

  const catName = (id: string) => categories.find(c => c.id === id)?.name || id;
  const memberName = (id: string) => members.find(m => m.id === id)?.name || 'Desconhecido';
  const inRange = (date: string, s: Date, e: Date) => {
    const d = new Date(date);
    return d >= s && d <= e;
  };

  const data = useMemo(() => {
    const cur = expenses.filter(e => inRange(e.date, curStart, curEnd));
    const prev = expenses.filter(e => inRange(e.date, prevStart, prevEnd));
    const curTotal = cur.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prev.reduce((s, e) => s + e.amount, 0);
    const diff = curTotal - prevTotal;
    const diffPct = prevTotal > 0 ? (diff / prevTotal) * 100 : 0;

    const byCat: Record<string, number> = {};
    for (const e of cur) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

    const byMember: Record<string, number> = {};
    for (const e of cur) byMember[e.memberId] = (byMember[e.memberId] || 0) + e.amount;
    const topMember = Object.entries(byMember).sort((a, b) => b[1] - a[1])[0];

    const biggest = [...cur].sort((a, b) => b.amount - a.amount)[0];

    return { cur, curTotal, prevTotal, diff, diffPct, topCat, topMember, biggest, count: cur.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, categories, members]);

  const monthLabel = format(now, 'MMMM yyyy', { locale: ptBR });

  if (data.count === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 capitalize">
            <Sparkles className="h-4 w-4 text-primary" /> Resumo de {monthLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma despesa registrada este mês ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const up = data.diff > 0;

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 capitalize">
          <Sparkles className="h-4 w-4 text-primary" /> Resumo de {monthLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Total gasto no mês</p>
          <p className="text-3xl font-bold">{brl(data.curTotal)}</p>
          {data.prevTotal > 0 && (
            <span className={`text-xs flex items-center gap-1 mt-1 ${up ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {up ? '+' : ''}{brl(data.diff)} ({data.diffPct.toFixed(1)}%) vs. mês anterior
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {data.topCat && (
            <div className="rounded-xl bg-background/60 border p-3 flex gap-3">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Crown className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Categoria com maior gasto</p>
                <p className="text-sm font-semibold truncate">{catName(data.topCat[0])}</p>
                <p className="text-xs text-muted-foreground">{brl(data.topCat[1])}</p>
              </div>
            </div>
          )}

          {data.biggest && (
            <div className="rounded-xl bg-background/60 border p-3 flex gap-3">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Maior despesa</p>
                <p className="text-sm font-semibold truncate">{data.biggest.name}</p>
                <p className="text-xs text-muted-foreground">{brl(data.biggest.amount)}</p>
              </div>
            </div>
          )}

          {data.topMember && (
            <div className="rounded-xl bg-background/60 border p-3 flex gap-3">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Quem mais gastou</p>
                <p className="text-sm font-semibold truncate">{memberName(data.topMember[0])}</p>
                <p className="text-xs text-muted-foreground">{brl(data.topMember[1])}</p>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-background/60 border p-3 flex gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Despesas registradas</p>
              <p className="text-sm font-semibold">{data.count}</p>
              <p className="text-xs text-muted-foreground">Média {brl(data.curTotal / data.count)}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Resumo gerado automaticamente com base nas despesas de {monthLabel}.
        </p>
      </CardContent>
    </Card>
  );
}

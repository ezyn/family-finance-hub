import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/lib/finance-context';
import { CHART_COLORS } from '@/lib/types';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CategoryPieChart() {
  const { expenses, categories } = useFinance();

  const data = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return Object.entries(map).map(([cat, value]) => ({
      name: categories.find(c => c.id === cat)?.name || cat,
      value,
    })).sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

  if (data.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-base">Gastos por Categoria</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
          Nenhuma despesa registrada
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader><CardTitle className="text-base">Gastos por Categoria</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-2 justify-center">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              {d.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MonthlyBarChart() {
  const { expenses } = useFinance();

  const data = useMemo(() => {
    const months: { name: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const total = expenses
        .filter(e => { const ed = new Date(e.date); return ed >= start && ed <= end; })
        .reduce((s, e) => s + e.amount, 0);
      months.push({ name: format(d, 'MMM', { locale: ptBR }), total });
    }
    return months;
  }, [expenses]);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader><CardTitle className="text-base">Gastos Mensais</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
            <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
            <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

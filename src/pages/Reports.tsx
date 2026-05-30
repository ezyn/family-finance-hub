import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/lib/finance-context';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ArrowDown, ArrowUp, Download, Minus } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const Reports = () => {
  const { expenses, categories, members } = useFinance();

  const now = new Date();
  const curStart = startOfMonth(now);
  const curEnd = endOfMonth(now);
  const prevDate = subMonths(now, 1);
  const prevStart = startOfMonth(prevDate);
  const prevEnd = endOfMonth(prevDate);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;
  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Desconhecido';

  const inRange = (date: string, s: Date, e: Date) => {
    const d = new Date(date);
    return d >= s && d <= e;
  };

  const { curTotal, prevTotal, byCategory, topExpenses } = useMemo(() => {
    const cur = expenses.filter(e => inRange(e.date, curStart, curEnd));
    const prev = expenses.filter(e => inRange(e.date, prevStart, prevEnd));
    const curTotal = cur.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prev.reduce((s, e) => s + e.amount, 0);

    const map: Record<string, { cur: number; prev: number }> = {};
    for (const e of cur) { map[e.category] = map[e.category] || { cur: 0, prev: 0 }; map[e.category].cur += e.amount; }
    for (const e of prev) { map[e.category] = map[e.category] || { cur: 0, prev: 0 }; map[e.category].prev += e.amount; }
    const byCategory = Object.entries(map)
      .map(([cat, v]) => ({ category: getCategoryName(cat), ...v }))
      .sort((a, b) => b.cur - a.cur);

    const topExpenses = [...cur].sort((a, b) => b.amount - a.amount).slice(0, 10);

    return { curTotal, prevTotal, byCategory, topExpenses };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, categories]);

  const diff = curTotal - prevTotal;
  const diffPct = prevTotal > 0 ? (diff / prevTotal) * 100 : 0;
  const maxCat = Math.max(...byCategory.map(c => c.cur), 1);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório Financeiro - Family Finance', 14, 18);
    doc.setFontSize(10);
    doc.text(`Mês: ${format(now, 'MMMM yyyy', { locale: ptBR })}`, 14, 26);
    doc.text(`Total do mês: ${brl(curTotal)}`, 14, 32);
    doc.text(`Mês anterior: ${brl(prevTotal)}`, 14, 38);
    doc.text(`Variação: ${diff >= 0 ? '+' : ''}${brl(diff)} (${diffPct.toFixed(1)}%)`, 14, 44);

    autoTable(doc, {
      startY: 52,
      head: [['Categoria', 'Mês atual', 'Mês anterior']],
      body: byCategory.map(c => [c.category, brl(c.cur), brl(c.prev)]),
    });

    autoTable(doc, {
      // @ts-ignore
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Maiores despesas', 'Valor', 'Membro', 'Data']],
      body: topExpenses.map(e => [e.name, brl(e.amount), getMemberName(e.memberId), format(new Date(e.date), 'dd/MM/yyyy')]),
    });

    doc.save('relatorio-financeiro.pdf');
    toast.success('PDF exportado!');
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Relatórios — Family Finance"
        description="Análises e comparativos mês a mês das despesas da família, ranking de gastos e exportação em PDF."
        path="/relatorios"
      />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">Comparativos e análises de gastos</p>
        </div>
        <Button onClick={exportPDF} className="gap-1.5"><Download className="h-4 w-4" /> Exportar PDF</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Mês atual', value: curTotal },
          { label: 'Mês anterior', value: prevTotal },
          { label: 'Variação', value: diff, isDiff: true },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="border-none shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className={`text-2xl font-bold mt-1 ${c.isDiff ? (diff > 0 ? 'text-destructive' : diff < 0 ? 'text-[hsl(var(--success))]' : '') : ''}`}>
                  {c.isDiff && diff > 0 ? '+' : ''}{brl(c.value)}
                </p>
                {c.isDiff && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    {diff > 0 ? <ArrowUp className="h-3 w-3 text-destructive" /> : diff < 0 ? <ArrowDown className="h-3 w-3 text-[hsl(var(--success))]" /> : <Minus className="h-3 w-3" />}
                    {diffPct.toFixed(1)}% vs mês anterior
                  </span>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-base">Comparativo por categoria</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma despesa neste mês</p>
          ) : byCategory.map(c => {
            const d = c.cur - c.prev;
            return (
              <div key={c.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.category}</span>
                  <span className="flex items-center gap-2">
                    {brl(c.cur)}
                    <span className={`text-xs flex items-center ${d > 0 ? 'text-destructive' : d < 0 ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}>
                      {d > 0 ? <ArrowUp className="h-3 w-3" /> : d < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {brl(Math.abs(d))}
                    </span>
                  </span>
                </div>
                <Progress value={(c.cur / maxCat) * 100} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle className="text-base">Maiores despesas do mês</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>#</TableHead>
                  <TableHead>Despesa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="hidden sm:table-cell">Membro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topExpenses.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma despesa neste mês</TableCell></TableRow>
                ) : topExpenses.map((e, i) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{brl(e.amount)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{getCategoryName(e.category)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{getMemberName(e.memberId)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;

import { useMemo, useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Plus, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { startOfMonth, isAfter } from 'date-fns';

export function BudgetManager() {
  const { budgets, categories, expenses, setBudget, deleteBudget } = useFinance();
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState('');
  const [amount, setAmount] = useState('');

  const spentByCategory = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const map: Record<string, number> = {};
    for (const e of expenses) {
      if (isAfter(new Date(e.date), monthStart)) {
        map[e.category] = (map[e.category] || 0) + e.amount;
      }
    }
    return map;
  }, [expenses]);

  const catName = (id: string) => categories.find(c => c.id === id)?.name || id;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!cat || !value || value <= 0) {
      toast.error('Selecione a categoria e informe um valor válido');
      return;
    }
    setBudget(cat, value);
    toast.success('Orçamento definido!');
    setCat(''); setAmount(''); setOpen(false);
  };

  const available = categories.filter(c => !budgets.some(b => b.category === c.id));

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Orçamentos do Mês
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Definir
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Definir orçamento</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Categoria</Label>
                <Select value={cat} onValueChange={setCat}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {available.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Limite mensal (R$)</Label>
                <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
              </div>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum orçamento definido. Crie metas por categoria para acompanhar seus gastos.
          </p>
        ) : (
          budgets.map(b => {
            const spent = spentByCategory[b.category] || 0;
            const pct = Math.min((spent / b.amount) * 100, 100);
            const over = spent > b.amount;
            const near = !over && pct >= 80;
            return (
              <div key={b.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-1.5">
                    {(over || near) && <AlertTriangle className={`h-3.5 w-3.5 ${over ? 'text-destructive' : 'text-[hsl(var(--warning,38_92%_50%))]'}`} />}
                    {catName(b.category)}
                  </span>
                  <span className={over ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                    R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={pct} className={`h-2 flex-1 ${over ? '[&>div]:bg-destructive' : near ? '[&>div]:bg-amber-500' : ''}`} />
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => { deleteBudget(b.id); toast.success('Orçamento removido'); }} aria-label={`Remover orçamento de ${catName(b.category)}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {over && <p className="text-xs text-destructive">Orçamento ultrapassado em R$ {(spent - b.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

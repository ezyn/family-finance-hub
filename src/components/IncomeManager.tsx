import { useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DollarSign, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export function IncomeManager() {
  const { members, updateMember } = useFinance();
  const [open, setOpen] = useState(false);
  const [incomes, setIncomes] = useState<Record<string, string>>({});

  const totalIncome = members.reduce((s, m) => s + m.income, 0);

  const handleOpen = () => {
    const map: Record<string, string> = {};
    members.forEach(m => { map[m.id] = m.income.toString(); });
    setIncomes(map);
    setOpen(true);
  };

  const handleSave = () => {
    members.forEach(m => {
      const val = parseFloat(incomes[m.id] || '0') || 0;
      if (val !== m.income) {
        updateMember({ ...m, income: val });
      }
    });
    toast.success('Receitas atualizadas!');
    setOpen(false);
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Receita Mensal</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleOpen}>
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Receita / Salário Mensal</DialogTitle>
            </DialogHeader>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Cadastre membros da família primeiro.
              </p>
            ) : (
              <div className="space-y-4">
                {members.map(m => (
                  <div key={m.id} className="space-y-1.5">
                    <Label>{m.name}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-10"
                        value={incomes[m.id] || ''}
                        onChange={e => setIncomes(prev => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                ))}
                <Button onClick={handleSave} className="w-full">Salvar Receitas</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-muted text-[hsl(var(--success))]">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total da Família</p>
            <p className="text-2xl font-bold">
              R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        {members.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {members.map(m => (
              <div key={m.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{m.name}</span>
                <span className="font-medium">R$ {m.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Repeat, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PAYMENT_METHODS, type RecurringExpense, type PaymentMethod } from '@/lib/types';

function RecurringForm({ item, trigger }: { item?: RecurringExpense; trigger: React.ReactNode }) {
  const { addRecurring, updateRecurring, members, categories } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: item?.name || '',
    amount: item?.amount?.toString() || '',
    category: item?.category || '',
    paymentMethod: (item?.paymentMethod || '') as PaymentMethod | '',
    memberId: item?.memberId || '',
    dayOfMonth: item?.dayOfMonth?.toString() || '1',
    note: item?.note || '',
    active: item?.active ?? true,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.category || !form.memberId || !form.paymentMethod) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const data = {
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category,
      paymentMethod: form.paymentMethod as PaymentMethod,
      memberId: form.memberId,
      dayOfMonth: Math.min(Math.max(parseInt(form.dayOfMonth) || 1, 1), 31),
      note: form.note,
      active: form.active,
    };
    if (item) {
      updateRecurring({ ...item, ...data });
      toast.success('Despesa recorrente atualizada!');
    } else {
      addRecurring(data);
      toast.success('Despesa recorrente criada!');
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{item ? 'Editar' : 'Nova'} despesa recorrente</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Aluguel" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
            </div>
            <div>
              <Label>Dia do mês *</Label>
              <Input type="number" min="1" max="31" value={form.dayOfMonth} onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Categoria *</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Forma de Pagamento *</Label>
            <Select value={form.paymentMethod} onValueChange={(v: PaymentMethod) => setForm(f => ({ ...f, paymentMethod: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{PAYMENT_METHODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Responsável *</Label>
            <Select value={form.memberId} onValueChange={v => setForm(f => ({ ...f, memberId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o membro" /></SelectTrigger>
              <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="active">Ativa (gera despesa todo mês)</Label>
            <Switch id="active" checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
          </div>
          <Button type="submit" className="w-full">{item ? 'Salvar' : 'Criar'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecurringManager() {
  const { recurring, categories, members, deleteRecurring } = useFinance();
  const catName = (id: string) => categories.find(c => c.id === id)?.name || id;
  const memberName = (id: string) => members.find(m => m.id === id)?.name || '—';

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Repeat className="h-4 w-4 text-primary" /> Despesas Recorrentes
        </CardTitle>
        <RecurringForm trigger={<Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nova</Button>} />
      </CardHeader>
      <CardContent className="space-y-2">
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma conta fixa cadastrada. Cadastre contas que se repetem todo mês (aluguel, internet, etc.).
          </p>
        ) : (
          recurring.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.name} {!r.active && <span className="text-xs text-muted-foreground">(pausada)</span>}</p>
                <p className="text-xs text-muted-foreground">
                  {catName(r.category)} · {memberName(r.memberId)} · todo dia {r.dayOfMonth}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold">R$ {r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <RecurringForm item={r} trigger={
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Editar ${r.name}`}><Pencil className="h-3.5 w-3.5" /></Button>
                } />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteRecurring(r.id); toast.success('Removida'); }} aria-label={`Remover ${r.name}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

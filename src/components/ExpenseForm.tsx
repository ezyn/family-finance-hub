import { useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PAYMENT_METHODS, type Expense, type PaymentMethod } from '@/lib/types';

interface Props {
  expense?: Expense;
  onClose?: () => void;
  trigger?: React.ReactNode;
}

export function ExpenseForm({ expense, onClose, trigger }: Props) {
  const { addExpense, updateExpense, members, categories } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: expense?.name || '',
    amount: expense?.amount?.toString() || '',
    category: expense?.category || '',
    paymentMethod: expense?.paymentMethod || '' as PaymentMethod | '',
    date: expense?.date || new Date().toISOString().slice(0, 10),
    memberId: expense?.memberId || '',
    note: expense?.note || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount || !form.category || !form.memberId || !form.paymentMethod) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const data = { ...form, amount: parseFloat(form.amount), paymentMethod: form.paymentMethod as PaymentMethod };
    if (expense) {
      updateExpense({ ...data, id: expense.id });
      toast.success('Despesa atualizada!');
    } else {
      addExpense(data);
      toast.success('Despesa registrada!');
    }
    setForm({ name: '', amount: '', category: '', paymentMethod: '', date: new Date().toISOString().slice(0, 10), memberId: '', note: '' });
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova Despesa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da despesa *</Label>
            <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Supermercado" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input id="amount" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
            </div>
            <div>
              <Label htmlFor="date">Data *</Label>
              <Input id="date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Categoria *</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Forma de Pagamento *</Label>
            <Select value={form.paymentMethod} onValueChange={(v: PaymentMethod) => setForm(f => ({ ...f, paymentMethod: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quem gastou *</Label>
            <Select value={form.memberId} onValueChange={v => setForm(f => ({ ...f, memberId: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o membro" /></SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="note">Observação</Label>
            <Textarea id="note" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Opcional" rows={2} />
          </div>
          <Button type="submit" className="w-full">{expense ? 'Salvar' : 'Registrar Despesa'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

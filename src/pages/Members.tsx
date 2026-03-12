import { useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const Members = () => {
  const { members, addMember, updateMember, deleteMember, expenses } = useFinance();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (editId) {
      updateMember({ id: editId, name: name.trim(), income: parseFloat(income) || 0 });
      toast.success('Membro atualizado!');
    } else {
      addMember({ name: name.trim(), income: parseFloat(income) || 0 });
      toast.success('Membro adicionado!');
    }
    setName(''); setIncome(''); setEditId(null); setOpen(false);
  };

  const startEdit = (m: typeof members[0]) => {
    setEditId(m.id); setName(m.name); setIncome(m.income.toString()); setOpen(true);
  };

  const getMemberTotal = (id: string) => expenses.filter(e => e.memberId === id).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Membros da Família</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os membros e suas receitas</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setName(''); setIncome(''); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Membro</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>{editId ? 'Editar Membro' : 'Novo Membro'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João" /></div>
              <div><Label>Receita Mensal (R$)</Label><Input type="number" step="0.01" min="0" value={income} onChange={e => setIncome(e.target.value)} placeholder="0,00" /></div>
              <Button type="submit" className="w-full">{editId ? 'Salvar' : 'Adicionar'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg font-medium">Nenhum membro cadastrado</p>
            <p className="text-sm">Adicione membros da família para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => {
            const total = getMemberTotal(m.id);
            return (
              <Card key={m.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">Receita: R$ {m.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteMember(m.id); toast.success('Membro removido!'); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Gastos</p>
                      <p className="font-semibold text-destructive">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Saldo</p>
                      <p className={`font-semibold ${m.income - total >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                        R$ {(m.income - total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Members;

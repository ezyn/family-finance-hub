import { useEffect, useMemo, useRef, useState } from 'react';
import { useCurrentMonth } from '@/hooks/useCurrentMonth';
import { useFinance } from '@/lib/finance-context';
import { Challenge } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Trophy, Target, Plus, Trash2, CheckCircle2, Award, Flame, ShieldCheck, CalendarCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';

const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Gamification = () => {
  const { challenges, expenses, categories, addChallenge, updateChallenge, deleteChallenge } = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', targetAmount: '', endDate: '' });
  const monthKey = useCurrentMonth();

  const spentForChallenge = (c: Challenge) =>
    expenses
      .filter(e => (!c.category || e.category === c.category) && e.date >= c.startDate && e.date <= c.endDate)
      .reduce((s, e) => s + e.amount, 0);

  const today = new Date().toISOString().slice(0, 10);

  // ---- Regras de conclusão do desafio ----
  // Um desafio é "conquistado" quando termina dentro do limite de gasto definido,
  // e "não atingido" quando o gasto ultrapassa o limite.
  const statusOf = (c: Challenge): 'won' | 'failed' | 'active' => {
    if (c.targetAmount <= 0) return c.completed ? 'won' : 'active';
    const spent = spentForChallenge(c);
    if (spent > c.targetAmount) return 'failed';
    if (c.endDate < today) return 'won';
    return c.completed ? 'won' : 'active';
  };

  // Reavalia os desafios automaticamente quando o mês muda ou novas despesas
  // são registradas, marcando cada conquista uma única vez.
  const awardedIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    challenges.forEach(c => {
      if (c.completed) return;
      if (statusOf(c) !== 'won') return;
      if (awardedIds.current.has(c.id)) return;
      awardedIds.current.add(c.id);
      updateChallenge({ ...c, completed: true });
      toast.success(`Conquista desbloqueada: "${c.title}" 🏆`, {
        description: 'Desafio concluído dentro do limite definido!',
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges, expenses, monthKey]);



  // ---- Achievements (computed from data) ----
  const achievements = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = expenses.filter(e => e.date.slice(0, 7) === monthKey);
    const withReceipt = expenses.filter(e => e.receiptUrl).length;
    const completedChallenges = challenges.filter(c => c.completed).length;
    const uniqueDays = new Set(thisMonth.map(e => e.date)).size;

    return [
      {
        icon: CalendarCheck, title: 'Primeiros Passos', desc: 'Registre sua primeira despesa',
        unlocked: expenses.length >= 1,
      },
      {
        icon: Flame, title: 'Mês Ativo', desc: 'Registre 10 despesas em um mês',
        unlocked: thisMonth.length >= 10, progress: Math.min(thisMonth.length, 10), goal: 10,
      },
      {
        icon: ShieldCheck, title: 'Organizado', desc: 'Anexe 5 comprovantes',
        unlocked: withReceipt >= 5, progress: Math.min(withReceipt, 5), goal: 5,
      },
      {
        icon: Target, title: 'Constância', desc: 'Registre despesas em 7 dias diferentes no mês',
        unlocked: uniqueDays >= 7, progress: Math.min(uniqueDays, 7), goal: 7,
      },
      {
        icon: Trophy, title: 'Vencedor', desc: 'Conclua um desafio familiar',
        unlocked: completedChallenges >= 1,
      },
      {
        icon: Award, title: 'Família Engajada', desc: 'Conclua 3 desafios familiares',
        unlocked: completedChallenges >= 3, progress: Math.min(completedChallenges, 3), goal: 3,
      },
    ];
  }, [expenses, challenges]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const resetForm = () => setForm({ title: '', description: '', category: '', targetAmount: '', endDate: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.endDate) return;
    addChallenge({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category || undefined,
      targetAmount: Number(form.targetAmount) || 0,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: form.endDate,
    });
    toast.success('Desafio criado!');
    resetForm();
    setOpen(false);
  };

  const toggleComplete = (c: Challenge) => {
    updateChallenge({ ...c, completed: !c.completed });
    toast.success(c.completed ? 'Desafio reaberto' : 'Desafio concluído! 🎉');
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Conquistas e Desafios — Family Finance"
        description="Acompanhe conquistas, ganhe selos e crie desafios financeiros para toda a família."
        path="/conquistas"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conquistas & Desafios</h1>
          <p className="text-muted-foreground text-sm mt-1">Gamifique o controle financeiro da família</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-1.5"><Plus className="h-4 w-4" /> Novo desafio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo desafio familiar</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ch-title">Título</Label>
                <Input id="ch-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Reduzir gastos com delivery" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ch-desc">Descrição (opcional)</Label>
                <Textarea id="ch-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes do desafio..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Categoria (opcional)</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ch-target">Meta de gasto (R$)</Label>
                  <Input id="ch-target" type="number" min="0" step="0.01" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="Ex: 300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ch-end">Termina em</Label>
                <Input id="ch-end" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Criar desafio</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Achievements */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Selos e Conquistas</CardTitle>
          <Badge variant="secondary">{unlockedCount}/{achievements.length}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <div
              key={a.title}
              className={`rounded-xl border p-4 flex gap-3 transition-colors ${a.unlocked ? 'bg-primary/5 border-primary/30' : 'bg-muted/40 border-transparent opacity-80'}`}
            >
              <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${a.unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {a.unlocked ? <a.icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                {!a.unlocked && a.goal != null && (
                  <Progress value={(a.progress! / a.goal) * 100} className="h-1.5 mt-2" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Challenges */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Desafios da Família</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Regra: mantenha o gasto dentro do limite até a data final para conquistar o desafio e desbloquear uma conquista. Ultrapassar o limite marca como "não atingido".
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {challenges.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum desafio ainda. Crie o primeiro e motive a família!</p>
          )}
          {challenges.map((c) => {
            const spent = spentForChallenge(c);
            const pct = c.targetAmount > 0 ? (spent / c.targetAmount) * 100 : 0;
            const overBudget = c.targetAmount > 0 && spent > c.targetAmount;
            const status = statusOf(c);
            return (
              <div key={c.id} className={`rounded-xl border p-4 ${status === 'won' ? 'bg-primary/5 border-primary/30' : status === 'failed' ? 'bg-destructive/5 border-destructive/30' : 'bg-muted/30'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{c.title}</p>
                      {c.category && <Badge variant="outline" className="text-[10px]">{c.category}</Badge>}
                      {status === 'won' && <Badge className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" /> Conquistado</Badge>}
                      {status === 'failed' && <Badge variant="destructive" className="text-[10px]">Não atingido</Badge>}
                      {status === 'active' && <Badge variant="secondary" className="text-[10px]">Em andamento</Badge>}
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">Até {new Date(c.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleComplete(c)} aria-label="Alternar conclusão" title="Marcar concluído">
                      <CheckCircle2 className={`h-4 w-4 ${c.completed ? 'text-primary' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteChallenge(c.id); toast.success('Desafio removido'); }} aria-label="Remover desafio">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {c.targetAmount > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={overBudget ? 'text-destructive font-medium' : 'text-muted-foreground'}>{fmt(spent)} gastos</span>
                      <span className="text-muted-foreground">Limite {fmt(c.targetAmount)}</span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-2" />
                    {overBudget && <p className="text-[11px] text-destructive mt-1">Limite ultrapassado</p>}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default Gamification;

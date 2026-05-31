import { useEffect, useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Expense, ChangeLog } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, RotateCcw, Download, History, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SEO } from '@/components/SEO';

const actionLabel: Record<ChangeLog['action'], string> = {
  create: 'Criou',
  update: 'Editou',
  delete: 'Excluiu',
  restore: 'Restaurou',
};

const Data = () => {
  const { members, fetchDeletedExpenses, restoreExpense, permanentlyDeleteExpense, fetchLogs, exportBackup } = useFinance();
  const [deleted, setDeleted] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [d, l] = await Promise.all([fetchDeletedExpenses(), fetchLogs()]);
    setDeleted(d);
    setLogs(l);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const memberName = (id: string) => members.find(m => m.id === id)?.name || 'Desconhecido';

  const handleRestore = async (id: string) => {
    await restoreExpense(id);
    setDeleted(prev => prev.filter(x => x.id !== id));
    toast.success('Despesa restaurada!');
  };

  const handlePermanent = async (id: string) => {
    await permanentlyDeleteExpense(id);
    setDeleted(prev => prev.filter(x => x.id !== id));
    toast.success('Despesa removida definitivamente.');
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Segurança e Dados — Family Finance"
        description="Faça backup dos seus dados, restaure despesas excluídas e acompanhe o histórico de alterações da família."
        path="/dados"
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Segurança & Dados</h1>
        <p className="text-muted-foreground text-sm mt-1">Backup, lixeira e histórico de alterações</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Backup dos dados
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-muted-foreground flex-1">
            Exporte todos os dados da família (membros, despesas, orçamentos e recorrentes) em um arquivo JSON para guardar com segurança.
          </p>
          <Button onClick={() => { exportBackup(); toast.success('Backup gerado!'); }} className="gap-1.5">
            <Download className="h-4 w-4" /> Exportar backup
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="trash">
        <TabsList>
          <TabsTrigger value="trash" className="gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Lixeira</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="trash">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-base">Despesas excluídas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
              ) : deleted.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">A lixeira está vazia.</p>
              ) : deleted.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {memberName(e.memberId)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleRestore(e.id)}>
                      <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handlePermanent(e.id)} aria-label="Excluir definitivamente">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-base">Histórico de alterações</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
              ) : logs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma alteração registrada ainda.</p>
              ) : logs.map(l => (
                <div key={l.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{l.actorName}</span>{' '}
                      <span className="text-muted-foreground">{l.summary || actionLabel[l.action]}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(l.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Data;

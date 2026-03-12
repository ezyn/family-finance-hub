import { useState, useMemo } from 'react';
import { useFinance } from '@/lib/finance-context';
import { PAYMENT_METHODS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExpenseForm } from './ExpenseForm';
import { Pencil, Trash2, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ExpenseTable() {
  const { expenses, members, categories, deleteExpense } = useFinance();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [editingExpense, setEditingExpense] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter !== 'all' && e.category !== catFilter) return false;
      if (memberFilter !== 'all' && e.memberId !== memberFilter) return false;
      return true;
    });
  }, [expenses, search, catFilter, memberFilter]);

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Desconhecido';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;
  const getPaymentLabel = (v: string) => PAYMENT_METHODS.find(p => p.value === v)?.label || v;

  const exportCSV = () => {
    const header = 'Nome,Valor,Categoria,Pagamento,Data,Membro,Observação\n';
    const rows = filtered.map(e =>
      `"${e.name}",${e.amount},"${getCategoryName(e.category)}","${getPaymentLabel(e.paymentMethod || '')}","${e.date}","${getMemberName(e.memberId)}","${e.note || ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'despesas.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base">Despesas</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <ExpenseForm />
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar despesa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Membro" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos membros</SelectItem>
              {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg overflow-hidden border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="hidden sm:table-cell">Pagamento</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead className="hidden md:table-cell">Membro</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma despesa encontrada</TableCell></TableRow>
              ) : filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>R$ {e.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="hidden sm:table-cell">{getCategoryName(e.category)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{getPaymentLabel(e.paymentMethod || '')}</TableCell>
                  <TableCell className="hidden sm:table-cell">{format(new Date(e.date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                  <TableCell className="hidden md:table-cell">{getMemberName(e.memberId)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <ExpenseForm
                        expense={e}
                        trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteExpense(e.id); toast.success('Despesa excluída!'); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

import { ExpenseTable } from '@/components/ExpenseTable';

const Expenses = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Despesas e Receitas</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie todas as despesas da família</p>
      </div>
      <ExpenseTable />
    </div>
  );
};

export default Expenses;

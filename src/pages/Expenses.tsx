import { ExpenseTable } from '@/components/ExpenseTable';
import { SEO } from '@/components/SEO';

const Expenses = () => {
  return (
    <div className="space-y-6">
      <SEO
        title="Despesas — Family Finance"
        description="Cadastre, edite e acompanhe todas as despesas e receitas da família em um só lugar."
        path="/despesas"
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Despesas e Receitas</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie todas as despesas da família</p>
      </div>
      <ExpenseTable />
    </div>
  );
};

export default Expenses;

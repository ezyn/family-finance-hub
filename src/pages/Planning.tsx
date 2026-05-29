import { BudgetManager } from '@/components/BudgetManager';
import { RecurringManager } from '@/components/RecurringManager';
import { SEO } from '@/components/SEO';

const Planning = () => {
  return (
    <div className="space-y-6">
      <SEO
        title="Planejamento — Family Finance"
        description="Defina orçamentos mensais por categoria e cadastre despesas recorrentes da família."
        path="/planejamento"
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planejamento</h1>
        <p className="text-muted-foreground text-sm mt-1">Orçamentos por categoria e contas fixas</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetManager />
        <RecurringManager />
      </div>
    </div>
  );
};

export default Planning;

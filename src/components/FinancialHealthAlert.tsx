import { useMemo } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { startOfMonth, isAfter } from 'date-fns';

export function FinancialHealthAlert() {
  const { expenses, members } = useFinance();

  const { monthExpense, income, ratio } = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthExpense = expenses
      .filter(e => isAfter(new Date(e.date), monthStart))
      .reduce((s, e) => s + e.amount, 0);
    const income = members.reduce((s, m) => s + m.income, 0);
    const ratio = income > 0 ? monthExpense / income : 0;
    return { monthExpense, income, ratio };
  }, [expenses, members]);

  if (income === 0 && monthExpense === 0) return null;

  if (income > 0 && monthExpense <= income) {
    if (ratio >= 0.8) {
      return (
        <Alert className="border-amber-500/50 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção aos gastos</AlertTitle>
          <AlertDescription>
            Você já gastou {(ratio * 100).toFixed(0)}% da renda da família este mês. Cuidado para não ultrapassar.
          </AlertDescription>
        </Alert>
      );
    }
    return (
      <Alert className="border-[hsl(var(--success))]/50 text-[hsl(var(--success))] [&>svg]:text-[hsl(var(--success))]">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Finanças saudáveis</AlertTitle>
        <AlertDescription>
          Gastos em {(ratio * 100).toFixed(0)}% da renda este mês. Continue assim!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Gastos acima da renda</AlertTitle>
      <AlertDescription>
        As despesas do mês (R$ {monthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) superam a renda da família (R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).
      </AlertDescription>
    </Alert>
  );
}

import { SummaryCards } from '@/components/SummaryCards';
import { CategoryPieChart, MonthlyBarChart } from '@/components/Charts';
import { ExpenseTable } from '@/components/ExpenseTable';
import { MemberSpending } from '@/components/MemberSpending';
import { IncomeManager } from '@/components/IncomeManager';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral das finanças da família</p>
      </div>
      <SummaryCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart />
        <MonthlyBarChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExpenseTable />
        </div>
        <MemberSpending />
      </div>
    </div>
  );
};

export default Dashboard;

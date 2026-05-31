import { LayoutDashboard, Receipt, Target, BarChart3, Users } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const items = [
  { title: 'Início', url: '/', icon: LayoutDashboard },
  { title: 'Despesas', url: '/despesas', icon: Receipt },
  { title: 'Planos', url: '/planejamento', icon: Target },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Membros', url: '/membros', icon: Users },
];

export function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <div className="grid grid-cols-5">
        {items.map(item => (
          <NavLink
            key={item.url}
            to={item.url}
            end
            className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

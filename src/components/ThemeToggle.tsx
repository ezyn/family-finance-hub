import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDark(true);
    }
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark(d => !d)}
      className="relative h-9 w-9 rounded-full border border-border bg-muted/50 hover:bg-muted transition-all duration-300"
      aria-label="Alternar tema"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-foreground" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-foreground" />
    </Button>
  );
}

import { useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { categories, addCategory, deleteCategory } = useFinance();
  const [newCat, setNewCat] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    addCategory(newCat.trim());
    setNewCat('');
    toast.success('Categoria adicionada!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Personalize categorias e preferências</p>
      </div>
      <Card className="border-none shadow-sm max-w-lg">
        <CardHeader><CardTitle className="text-base">Categorias de Despesas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nova categoria..." className="flex-1" />
            <Button type="submit" size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Adicionar</Button>
          </form>
          <div className="space-y-2">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{c.name}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteCategory(c.id); toast.success('Categoria removida!'); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

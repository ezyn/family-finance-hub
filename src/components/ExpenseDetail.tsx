import { useState, useEffect, useRef } from 'react';
import { useFinance } from '@/lib/finance-context';
import { useAuth } from '@/hooks/useAuth';
import { ExpenseComment, Expense } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Paperclip, Send, Trash2, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ExpenseDetail({ expense, trigger }: { expense: Expense; trigger?: React.ReactNode }) {
  const { uploadReceipt, removeReceipt, fetchComments, addComment, deleteComment, expenses } = useFinance();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<ExpenseComment[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const current = expenses.find(e => e.id === expense.id) || expense;

  useEffect(() => {
    if (open) fetchComments(expense.id).then(setComments);
  }, [open, expense.id, fetchComments]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    const c = await addComment(expense.id, text.trim());
    setSending(false);
    if (c) { setComments(prev => [...prev, c]); setText(''); }
    else toast.error('Não foi possível comentar');
  };

  const handleDelete = async (id: string) => {
    await deleteComment(id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadReceipt(expense.id, file);
    setUploading(false);
    toast.success('Comprovante anexado!');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Detalhes e comentários">
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{current.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Comprovante</p>
            {current.receiptUrl ? (
              <div className="space-y-2">
                <a href={current.receiptUrl} target="_blank" rel="noopener noreferrer">
                  <img src={current.receiptUrl} alt="Comprovante" className="rounded-lg border max-h-48 object-contain w-full bg-muted" />
                </a>
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={() => removeReceipt(expense.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remover
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                Anexar comprovante
              </Button>
            )}
            <Input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Comments */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Comentários</p>
            <ScrollArea className="max-h-48">
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Nenhum comentário ainda.</p>
              ) : (
                <div className="space-y-2 pr-2">
                  {comments.map(c => (
                    <div key={c.id} className="rounded-lg bg-muted/50 p-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs">{c.authorName}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">{format(new Date(c.createdAt), "dd/MM HH:mm", { locale: ptBR })}</span>
                          {c.authorId === user?.id && (
                            <button onClick={() => handleDelete(c.id)} className="text-destructive" aria-label="Excluir comentário">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-muted-foreground">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-2 mt-2">
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Escreva um comentário..."
                rows={1}
                className="min-h-0 resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <Button size="icon" onClick={handleSend} disabled={sending || !text.trim()} aria-label="Enviar comentário">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

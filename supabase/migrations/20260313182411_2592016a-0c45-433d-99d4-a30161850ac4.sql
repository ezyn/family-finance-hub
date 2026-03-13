
-- Create family members table
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  income NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to family_members" ON public.family_members FOR ALL USING (true) WITH CHECK (true);

-- Create categories table
CREATE TABLE public.categories (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Insert default categories
INSERT INTO public.categories (id, name) VALUES
  ('alimentacao', 'Alimentação'),
  ('transporte', 'Transporte'),
  ('moradia', 'Moradia'),
  ('saude', 'Saúde'),
  ('educacao', 'Educação'),
  ('lazer', 'Lazer'),
  ('contas', 'Contas'),
  ('cartao', 'Cartão de Crédito'),
  ('outros', 'Outros');

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL REFERENCES public.categories(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credito', 'debito', 'pix', 'alimentacao')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- Budgets table
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (owner_id, category)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household budgets"
ON public.budgets FOR SELECT TO authenticated
USING (owner_id IN (SELECT get_user_household_ids()));

CREATE POLICY "Users can insert own budgets"
ON public.budgets FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own budgets"
ON public.budgets FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own budgets"
ON public.budgets FOR DELETE TO authenticated
USING (owner_id = auth.uid());

-- Recurring expenses table
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  member_id UUID NOT NULL,
  day_of_month INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  last_generated DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_expenses TO authenticated;
GRANT ALL ON public.recurring_expenses TO service_role;

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household recurring"
ON public.recurring_expenses FOR SELECT TO authenticated
USING (owner_id IN (SELECT get_user_household_ids()));

CREATE POLICY "Users can insert own recurring"
ON public.recurring_expenses FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own recurring"
ON public.recurring_expenses FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own recurring"
ON public.recurring_expenses FOR DELETE TO authenticated
USING (owner_id = auth.uid());
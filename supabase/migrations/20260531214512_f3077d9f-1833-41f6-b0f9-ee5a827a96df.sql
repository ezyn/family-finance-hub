-- Soft-delete support for expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON public.expenses (deleted_at);

-- Audit / change log table
CREATE TABLE public.change_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  actor_name text NOT NULL,
  action text NOT NULL,
  entity text NOT NULL,
  summary text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.change_logs TO authenticated;
GRANT ALL ON public.change_logs TO service_role;

ALTER TABLE public.change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household change logs"
ON public.change_logs
FOR SELECT
TO authenticated
USING (owner_id IN ( SELECT get_user_household_ids() AS get_user_household_ids));

CREATE POLICY "Users can insert household change logs"
ON public.change_logs
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid() AND owner_id IN ( SELECT get_user_household_ids() AS get_user_household_ids));

CREATE INDEX idx_change_logs_owner_created ON public.change_logs (owner_id, created_at DESC);
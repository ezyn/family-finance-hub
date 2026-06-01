CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  target_amount numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household challenges"
ON public.challenges FOR SELECT TO authenticated
USING (owner_id IN ( SELECT get_user_household_ids() AS get_user_household_ids));

CREATE POLICY "Users can insert own challenges"
ON public.challenges FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update household challenges"
ON public.challenges FOR UPDATE TO authenticated
USING (owner_id IN ( SELECT get_user_household_ids() AS get_user_household_ids))
WITH CHECK (owner_id IN ( SELECT get_user_household_ids() AS get_user_household_ids));

CREATE POLICY "Users can delete own challenges"
ON public.challenges FOR DELETE TO authenticated
USING (owner_id = auth.uid());
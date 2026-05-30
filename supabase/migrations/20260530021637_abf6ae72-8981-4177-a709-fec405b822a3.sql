-- Comments on expenses
CREATE TABLE public.expense_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid NOT NULL,
  author_id uuid NOT NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_comments TO authenticated;
GRANT ALL ON public.expense_comments TO service_role;

ALTER TABLE public.expense_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on expenses belonging to their household
CREATE POLICY "Users can view household expense comments"
ON public.expense_comments
FOR SELECT
TO authenticated
USING (
  expense_id IN (
    SELECT e.id FROM public.expenses e
    WHERE e.member_id IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.owner_id IN (SELECT get_user_household_ids())
    )
  )
);

-- Users can insert comments as themselves on household expenses
CREATE POLICY "Users can insert household expense comments"
ON public.expense_comments
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND expense_id IN (
    SELECT e.id FROM public.expenses e
    WHERE e.member_id IN (
      SELECT fm.id FROM public.family_members fm
      WHERE fm.owner_id IN (SELECT get_user_household_ids())
    )
  )
);

-- Users can delete their own comments
CREATE POLICY "Users can delete own expense comments"
ON public.expense_comments
FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- Receipt url on expenses
ALTER TABLE public.expenses ADD COLUMN receipt_url text;

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

CREATE POLICY "Authenticated users can view receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
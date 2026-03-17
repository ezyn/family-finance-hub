
DROP POLICY IF EXISTS "Authenticated users can read categories" ON public.categories;

CREATE POLICY "Users can read own or shared categories"
ON public.categories FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR owner_id IS NULL);

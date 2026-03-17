
-- Replace the function to use auth.uid() internally instead of accepting a parameter
CREATE OR REPLACE FUNCTION public.get_user_household_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT owner_id FROM public.family_members WHERE owner_id = auth.uid()
  UNION
  SELECT DISTINCT owner_id FROM public.family_members 
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND owner_id IS NOT NULL
$function$;

-- Update RLS policies on expenses to call without arguments
DROP POLICY IF EXISTS "Users can view household expenses" ON public.expenses;
CREATE POLICY "Users can view household expenses" ON public.expenses FOR SELECT TO authenticated
USING (member_id IN (SELECT id FROM family_members WHERE owner_id IN (SELECT get_user_household_ids())));

DROP POLICY IF EXISTS "Users can insert household expenses" ON public.expenses;
CREATE POLICY "Users can insert household expenses" ON public.expenses FOR INSERT TO authenticated
WITH CHECK (member_id IN (SELECT id FROM family_members WHERE owner_id IN (SELECT get_user_household_ids())));

DROP POLICY IF EXISTS "Users can update household expenses" ON public.expenses;
CREATE POLICY "Users can update household expenses" ON public.expenses FOR UPDATE TO authenticated
USING (member_id IN (SELECT id FROM family_members WHERE owner_id IN (SELECT get_user_household_ids())));

DROP POLICY IF EXISTS "Users can delete household expenses" ON public.expenses;
CREATE POLICY "Users can delete household expenses" ON public.expenses FOR DELETE TO authenticated
USING (member_id IN (SELECT id FROM family_members WHERE owner_id IN (SELECT get_user_household_ids())));

-- Update RLS policy on family_members
DROP POLICY IF EXISTS "Users can view household members" ON public.family_members;
CREATE POLICY "Users can view household members" ON public.family_members FOR SELECT TO authenticated
USING (owner_id IN (SELECT get_user_household_ids()));

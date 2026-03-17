
DROP POLICY IF EXISTS "Members can update own record" ON public.family_members;

CREATE POLICY "Members can update own record"
ON public.family_members FOR UPDATE TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  AND owner_id = (SELECT fm.owner_id FROM public.family_members fm WHERE fm.id = family_members.id)
);

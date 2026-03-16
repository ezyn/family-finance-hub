
-- Fix privilege escalation: restrict "Members can update own record" to prevent changing owner_id
DROP POLICY IF EXISTS "Members can update own record" ON public.family_members;

CREATE POLICY "Members can update own record"
ON public.family_members FOR UPDATE TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid())::text)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  AND owner_id IS NOT DISTINCT FROM owner_id
);

-- Use a trigger to prevent owner_id changes by non-owners
CREATE OR REPLACE FUNCTION public.prevent_owner_id_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If owner_id is being changed and the user is not the current owner, block it
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    IF OLD.owner_id != auth.uid() THEN
      RAISE EXCEPTION 'You cannot change the owner_id of this record';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_owner_id_change_trigger ON public.family_members;
CREATE TRIGGER prevent_owner_id_change_trigger
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_id_change();


-- 1. Fix family_members UPDATE policy: split into owner and self-update
DROP POLICY IF EXISTS "Users can update household members" ON public.family_members;

-- Owner can update any member in their household
CREATE POLICY "Owner can update household members"
ON public.family_members FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Members can update only their own record (matched by email)
CREATE POLICY "Members can update own record"
ON public.family_members FOR UPDATE TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 2. Fix categories: split ALL policy into restricted policies
DROP POLICY IF EXISTS "Authenticated users can access categories" ON public.categories;

-- Everyone can read categories
CREATE POLICY "Authenticated users can read categories"
ON public.categories FOR SELECT TO authenticated
USING (true);

-- Add owner_id to categories for write control
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Only owner can insert
CREATE POLICY "Users can insert own categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Only owner can update
CREATE POLICY "Users can update own categories"
ON public.categories FOR UPDATE TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Only owner can delete
CREATE POLICY "Users can delete own categories"
ON public.categories FOR DELETE TO authenticated
USING (owner_id = auth.uid());


-- Add email and owner_id columns to family_members
ALTER TABLE public.family_members 
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Security definer function to get all owner_ids a user belongs to
CREATE OR REPLACE FUNCTION public.get_user_household_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- User is the owner
  SELECT DISTINCT owner_id FROM public.family_members WHERE owner_id = _user_id
  UNION
  -- User's email matches a family member
  SELECT DISTINCT owner_id FROM public.family_members 
  WHERE email = (SELECT email FROM auth.users WHERE id = _user_id)
  AND owner_id IS NOT NULL
$$;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to family_members" ON public.family_members;
DROP POLICY IF EXISTS "Allow all access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all access to categories" ON public.categories;

-- RLS for family_members: users can only access their household
CREATE POLICY "Users can view household members"
ON public.family_members FOR SELECT TO authenticated
USING (owner_id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Users can insert household members"
ON public.family_members FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update household members"
ON public.family_members FOR UPDATE TO authenticated
USING (owner_id IN (SELECT public.get_user_household_ids(auth.uid())))
WITH CHECK (owner_id IN (SELECT public.get_user_household_ids(auth.uid())));

CREATE POLICY "Users can delete household members"
ON public.family_members FOR DELETE TO authenticated
USING (owner_id = auth.uid());

-- RLS for expenses: users can only access expenses linked to their household members
CREATE POLICY "Users can view household expenses"
ON public.expenses FOR SELECT TO authenticated
USING (member_id IN (
  SELECT id FROM public.family_members 
  WHERE owner_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

CREATE POLICY "Users can insert household expenses"
ON public.expenses FOR INSERT TO authenticated
WITH CHECK (member_id IN (
  SELECT id FROM public.family_members 
  WHERE owner_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

CREATE POLICY "Users can update household expenses"
ON public.expenses FOR UPDATE TO authenticated
USING (member_id IN (
  SELECT id FROM public.family_members 
  WHERE owner_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

CREATE POLICY "Users can delete household expenses"
ON public.expenses FOR DELETE TO authenticated
USING (member_id IN (
  SELECT id FROM public.family_members 
  WHERE owner_id IN (SELECT public.get_user_household_ids(auth.uid()))
));

-- RLS for categories: authenticated users can access all categories (shared)
CREATE POLICY "Authenticated users can access categories"
ON public.categories FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Update handle_new_user trigger to auto-create a family member
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Auto-create family member for the new user
  INSERT INTO public.family_members (name, email, owner_id, income)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.id,
    0
  );
  
  RETURN NEW;
END;
$$;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

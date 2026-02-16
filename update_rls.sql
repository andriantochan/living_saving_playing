-- Allow project owners to view their own projects
-- This is necessary because check_project_access relies on project_members, 
-- but when creating a project, the user is not yet a member.
create policy "Users can view own projects" on projects
  for select using (
    owner_id = auth.uid()
  );

-- Alternatively, update the existing policy if you prefer fewer policies, 
-- but adding a new specific one is cleaner.

-- Allow project owners to delete their own projects
create policy "Users can delete own projects" on projects
  for delete using (
    owner_id = auth.uid()
  );

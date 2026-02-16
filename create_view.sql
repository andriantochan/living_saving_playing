-- Create a view to easily fetch project details with owner and last activity
-- We use "security_invoker = true" so that Row Level Security (RLS) policies on the underlying tables
-- (projects, profiles, expenses) are enforced for the user querying the view.

create or replace view project_details_view with (security_invoker = true) as
select 
  p.id,
  p.name,
  p.created_at,
  p.owner_id,
  pr.full_name as owner_name,
  pr.username as owner_username,
  (
    select max(date) 
    from expenses e 
    where e.project_id = p.id
  ) as last_expense_date,
  (
    select count(*)
    from project_members pm
    where pm.project_id = p.id
    and pm.user_id = auth.uid()
  ) as is_member -- Helper to filter only projects user is part of if needed
from projects p
join profiles pr on p.owner_id = pr.id;

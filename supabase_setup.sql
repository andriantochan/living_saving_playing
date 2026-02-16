-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. HELPER FUNCTIONS
create or replace function check_project_access(target_project_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from project_members
    where project_id = target_project_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 2. PROFILES & TRIGGERS
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  username text unique,
  email text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure columns exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'username') then
    alter table profiles add column username text unique;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'email') then
    alter table profiles add column email text;
  end if;
end $$;

alter table profiles enable row level security;

-- Drop policies to refresh them
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, email)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. PROJECTS
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table projects enable row level security;

-- 4. PROJECT MEMBERS
create table if not exists project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('owner', 'member')) default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, user_id)
);

alter table project_members enable row level security;

-- Drop project/member policies
drop policy if exists "Users can view projects they are members of" on projects;
drop policy if exists "Users can create projects" on projects;
drop policy if exists "Users can view members of their projects" on project_members;
drop policy if exists "Users can join projects" on project_members; 
drop policy if exists "Users can view own membership" on project_members;
drop policy if exists "Project owners can manage members" on project_members;

-- Policies
create policy "Users can view projects they are members of" on projects
  for select using (
    check_project_access(id)
  );

create policy "Users can create projects" on projects
  for insert with check (auth.uid() = owner_id);

create policy "Users can view members of their projects" on project_members
  for select using (
    check_project_access(project_id)
  );
  
create policy "Project owners can manage members" on project_members
  for all using (
    exists (
      select 1 from projects
      where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
    )
  );
  
create policy "Users can view own membership" on project_members
  for select using (
    auth.uid() = user_id
  );


-- 5. EXPENSES
create table if not exists expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric not null,
  category text not null check (category in ('Living', 'Playing', 'Saving')),
  description text,
  date date default CURRENT_DATE not null
  -- user_id and project_id added safely below
);

do $$
begin
  -- Add user_id if missing
  if not exists (select 1 from information_schema.columns where table_name = 'expenses' and column_name = 'user_id') then
    alter table expenses add column user_id uuid references auth.users(id);
    -- Note: We can't easily make it NOT NULL on an existing table with data without a default or updating first.
    -- For now, we add it nullable.
  end if;

  -- Add project_id if missing.
  if not exists (select 1 from information_schema.columns where table_name = 'expenses' and column_name = 'project_id') then
    alter table expenses add column project_id uuid references projects(id) on delete cascade;
  end if;
end $$;

alter table expenses enable row level security;

-- Drop expense policies
drop policy if exists "Users can view their own expenses" on expenses;
drop policy if exists "Users can insert their own expenses" on expenses;
drop policy if exists "Users can update their own expenses" on expenses;
drop policy if exists "Users can delete their own expenses" on expenses;
drop policy if exists "Members can view project expenses" on expenses;
drop policy if exists "Members can insert project expenses" on expenses;
drop policy if exists "Members can update project expenses" on expenses;
drop policy if exists "Members can delete project expenses" on expenses;

-- Policies
create policy "Members can view project expenses" on expenses
  for select using (
    check_project_access(project_id)
  );

create policy "Members can insert project expenses" on expenses
  for insert with check (
    check_project_access(project_id)
  );

create policy "Members can update project expenses" on expenses
  for update using (
    check_project_access(project_id)
  );

create policy "Members can delete project expenses" on expenses
  for delete using (
    check_project_access(project_id)
  );

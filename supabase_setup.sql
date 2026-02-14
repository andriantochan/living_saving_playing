-- Create the expenses table
create table expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric not null,
  category text not null check (category in ('Living', 'Playing', 'Saving')),
  description text,
  date date default CURRENT_DATE not null
);

-- Enable Row Level Security (RLS) recommended for security
alter table expenses enable row level security;

-- Create a policy that allows all operations for now (since we haven't added Auth yet)
-- This allows the application (using the anon key) to read and write data.
create policy "Allow public access to expenses"
on expenses
for all
using (true)
with check (true);

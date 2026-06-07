-- Seed each user with their own copy of the canonical onboarding steps.
--
-- In the per-owner model there is no shared list, so a new user would otherwise start
-- empty. This adds a template table holding the 8 canonical steps, a security-definer
-- function that copies them to a given user (idempotent), an AFTER INSERT trigger on
-- auth.users that seeds new sign-ups, and a one-time backfill for existing users.
--
-- Positions come from the global sequence at copy time (not the template's position),
-- so each user's steps get unique, increasing positions in canonical order — preserving
-- the existing `position_unique` constraint and ordering without per-user position math.

-- Template content (canonical onboarding steps). Locked down: only the security-definer
-- seed function (running as the table owner) reads it.
create table onboarding_step_templates (
  position integer primary key,
  title    text    not null,
  body     text    not null
);

alter table onboarding_step_templates enable row level security;
revoke all on onboarding_step_templates from anon, authenticated;

insert into onboarding_step_templates (position, title, body) values
  (1, 'Set up Slack',
   'Download the Slack desktop app from slack.com/downloads.
Accept the email invite to the workspace.
Download Slack for mobile and enable notifications.
Slack will be your primary form of communication.'),
  (2, 'Install your IDE (your choice)',
   'Your IDE is your choice — use whatever you''re most productive in.
A popular choice among NorCal developers is VSCode (code.visualstudio.com).'),
  (3, 'Set up your AI coding tools — Claude Code and Codex',
   'You''ll use two AI coding tools. Pick one as your primary (daily driver) on the
$100/month plan and the other as your secondary on the $20/month plan — which is which
is your choice.

Claude Code (Anthropic):
  • Install: npm install -g @anthropic-ai/claude-code, then run claude login (or /login in the CLI).
  • Runs in the terminal, the desktop/web app, and IDE extensions (VS Code, JetBrains).
  • Strong at agentic multi-file work, refactors, architecture, and long-context tasks.

OpenAI Codex:
  • Sign in with your ChatGPT account. Runs in the CLI, an IDE extension, the web/app, and via cloud tasks.
  • Good for a second opinion, quick completions, and lighter tasks.

Set your chosen primary on the $100/month plan and your secondary on the $20/month plan.
Confirm current capabilities and pricing on the official sites before relying on details.'),
  (4, 'Set up Supabase and Cloudflare',
   'Supabase: accept the org invite, explore the norcalOS dashboard, and run npx supabase login.
Cloudflare: accept the account invite, install Wrangler (brew install cloudflare/cloudflare/wrangler),
run wrangler login, and confirm you can see the norcalos and norcal-onboarding projects.'),
  (5, 'Set up GitHub and clone the NorCal repo',
   'Log in at github.com and ask a teammate to add you to the NorCal org.
Generate an SSH key: ssh-keygen -t ed25519 -C "you@norcal.com" and add the public key
under Settings → SSH and GPG keys.
Clone: git clone git@github.com:norcal/<repo-name>.git
Read the repo README/contributing guide before your first PR.'),
  (6, 'Set up monday.com',
   'Accept the NorCal monday.com workspace invite and complete your profile.
Open the Dev board, add yourself as a member, and review items assigned to your team.
Ask your lead which board views to follow.'),
  (7, 'Set up feathr.co',
   'Accept the NorCal feathr.co workspace invite and complete the onboarding tour.
Ask your lead how the team uses Feathr day-to-day.'),
  (8, 'Set up your Google Workspace account',
   'Open the welcome email to your @norcal.com address and finish account setup.
Add a profile photo, accept the team Google Calendar invite, and confirm access to the
shared NorCal Team Drive.');

-- Idempotent per-user seeding: copies the templates to `target_user` only if they have
-- no steps yet. security definer so it can insert owned rows (bypassing RLS) and read
-- the locked template table; pinned search_path for safety.
create or replace function public.seed_user_steps(target_user uuid)
  returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from onboarding_steps where user_id = target_user) then
    return; -- already has steps; do nothing
  end if;
  insert into onboarding_steps (user_id, title, body)
  select target_user, t.title, t.body
  from onboarding_step_templates t
  order by t.position; -- canonical order → sequence assigns increasing positions
end;
$$;

-- Seed every new sign-up.
create or replace function public.handle_new_user_seed()
  returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_user_steps(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed_steps on auth.users;
create trigger on_auth_user_created_seed_steps
  after insert on auth.users
  for each row execute function public.handle_new_user_seed();

-- One-time backfill: seed existing users who currently have no steps (e.g. accounts
-- created between the auth rollout and this migration). Idempotent via seed_user_steps.
do $$
declare u record;
begin
  for u in select id from auth.users loop
    perform public.seed_user_steps(u.id);
  end loop;
end;
$$;

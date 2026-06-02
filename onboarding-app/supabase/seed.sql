-- Idempotent seed: only loads the eight canonical steps when the table is empty,
-- so reprovisioning (or `db push --include-seed` against an existing DB) is a no-op.
-- An explicit `ordinal` column drives insertion order (don't rely on VALUES order);
-- the sequence then assigns positions 1..8 in that order.

insert into onboarding_steps (title, body)
select v.title, v.body
from (values
  (1, 'Set up Slack',          -- ordinal, title, body
   'Download the Slack desktop app from slack.com/downloads.
Sign in with your @norcal.com Google account.
Join: #general, #dev, #deploys, #random.
Set Do Not Disturb hours and enable mobile push for @mentions.'),

  (2, 'Install your IDE — VSCode',
   'Download VSCode from code.visualstudio.com.
Recommended extensions: ESLint, Prettier, GitLens, Tailwind CSS IntelliSense.
Enable Settings Sync (sign in with GitHub) to pull team settings.'),

  (3, 'Set up your AI coding tools — Claude Code (primary) and Codex (secondary)',
   'Primary — Claude Code (Claude Max plan, $100/month):
  • Install: npm install -g @anthropic-ai/claude-code
  • Sign in: claude login (or /login inside the CLI)
  • Available in terminal, the desktop/web app, and IDE extensions (VS Code, JetBrains).
  • Use for: agentic multi-file work, refactors, architecture, long-context tasks.

Secondary — OpenAI Codex (ChatGPT Plus, $20/month):
  • Sign in with your ChatGPT account. Codex runs in the CLI, an IDE extension,
    the web/app, and via cloud tasks.
  • Use for: a second opinion, quick completions, and lighter tasks.

Choosing primary vs secondary: default to Claude Code for in-editor agentic work;
reach for Codex when you want an alternative model''s perspective or the task is small.
Confirm current capabilities/pricing at developers.openai.com/codex before relying on details.'),

  (4, 'Set up your Google Workspace account',
   'Open the welcome email to your @norcal.com address and finish account setup.
Add a profile photo, accept the team Google Calendar invite, and confirm access to the
shared NorCal Team Drive.'),

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

  (8, 'Set up Supabase and Cloudflare',
   'Supabase: accept the org invite, explore the norcalOS dashboard, and run npx supabase login.
Cloudflare: accept the account invite, install Wrangler (brew install cloudflare/cloudflare/wrangler),
run wrangler login, and confirm you can see the norcalos and norcal-onboarding projects.')
) as v(ordinal, title, body)
where not exists (select 1 from onboarding_steps)
order by v.ordinal;

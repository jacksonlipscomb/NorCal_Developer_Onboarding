-- One-time content revisions to the live onboarding_steps data.
-- Run in Supabase Studio -> SQL Editor (the seed file is the source of truth for
-- fresh provisions; this updates rows already in the deployed database).
-- Rows are matched by their current title so it is independent of position.

-- 1) Slack: replace the sign-in / channels / DND lines.
update onboarding_steps
set body = 'Download the Slack desktop app from slack.com/downloads.
Accept the email invite to the workspace.
Download Slack for mobile and enable notifications.
Slack will be your primary form of communication.'
where title = 'Set up Slack';

-- 2) IDE: make it a developer choice (suggest VSCode); drop the extra lines.
update onboarding_steps
set title = 'Install your IDE (your choice)',
    body = 'Your IDE is your choice — use whatever you''re most productive in.
A popular choice among NorCal developers is VSCode (code.visualstudio.com).'
where title = 'Install your IDE — VSCode';

-- 3) AI tools: don't fix which is primary/secondary — let the dev choose.
update onboarding_steps
set title = 'Set up your AI coding tools — Claude Code and Codex',
    body = 'You''ll use two AI coding tools. Pick one as your primary (daily driver) on the
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
Confirm current capabilities and pricing on the official sites before relying on details.'
where title = 'Set up your AI coding tools — Claude Code (primary) and Codex (secondary)';

-- 4) Swap order: Supabase/Cloudflare moves to position 4, Google Workspace to 8.
-- Use a temporary value to avoid colliding with the unique(position) constraint.
update onboarding_steps set position = 999 where title = 'Set up your Google Workspace account';
update onboarding_steps set position = 4   where title = 'Set up Supabase and Cloudflare';
update onboarding_steps set position = 8   where title = 'Set up your Google Workspace account';

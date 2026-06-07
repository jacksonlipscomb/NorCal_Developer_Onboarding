-- One-time cleanup of orphaned, owner-less onboarding_steps rows.
-- Run in Supabase Studio -> SQL Editor against the deployed database.
--
-- Background: migration 0002 added a nullable `user_id`, so the original shared
-- seed rows (created before per-user ownership) were left with user_id = NULL.
-- Every RLS policy keys on `auth.uid() = user_id`, which never matches NULL, so
-- these rows are already invisible to all users and inert. This removes them for
-- cleanliness and as a precondition for a future `user_id NOT NULL` migration
-- (which cannot be applied while NULL-owner rows exist).
--
-- Safe by construction: it only deletes rows with NO owner. Every seeded/user
-- row carries a real user_id and is untouched.

delete from onboarding_steps
where user_id is null;

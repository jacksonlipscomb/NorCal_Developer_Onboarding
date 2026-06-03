# Backups & Recovery Runbook

Data tier: Supabase project `neggnclevjzgmieeaqoq` (NorCal_Developer_Onboarding).
This is the recovery runbook referenced by the deploy plan.

## Recovery layers (cheapest first)

1. **Soft delete (no backup needed).** Deleting a step only sets `deleted_at`; the
   row is preserved. To restore an accidentally deleted step, clear the flag:
   ```sql
   update onboarding_steps set deleted_at = null where id = '<step-uuid>';
   ```
   (Run in Supabase Studio → SQL Editor.) This covers the most common "oops".

2. **Schema is in git.** The full schema lives in
   [`supabase/migrations/0001_create_onboarding_steps.sql`](supabase/migrations/0001_create_onboarding_steps.sql).
   A blank project is rebuilt with `supabase db push`. So backups only need to
   protect *data*, not structure.

3. **Off-site data dump (this repo's script).** A point-in-time logical copy of the
   rows — see below. This is the tier-independent safety net.

4. **Supabase platform backups (dashboard).** Depending on plan:
   - **Free:** no automated backups — rely on layer 3 (scheduled `db dump`).
   - **Pro:** daily automated backups (dashboard → Database → Backups).
   - **Pro + PITR add-on:** point-in-time restore to any moment.

   **Action for you (dashboard):** Database → Backups. Note which of the above your
   plan provides. If Free, schedule the dump in layer 3 (e.g. a weekly reminder or
   cron on a machine that has the CLI logged in + linked).

## Taking an off-site backup

From `onboarding-app/` with the CLI logged in and linked:

```bash
./scripts/backup.sh
```

This writes a timestamped, data-only dump to `backups/` (gitignored — dumps are not
committed). It prompts for the database password (Supabase → Settings → Database).

## Restoring from a data dump

1. Ensure the schema exists (new/empty project): `supabase db push`.
2. Load the data dump into the target database:
   ```bash
   psql "<connection-string-from-Supabase-Settings-Database>" -f backups/<dumpfile>.sql
   ```
   For a clean restore into a non-empty table, truncate first in Studio:
   `truncate onboarding_steps restart identity;` then load the dump.

## Restoring from a Supabase platform backup

Dashboard → Database → Backups → choose a backup / PITR timestamp → **Restore**.
Follow the in-dashboard confirmation. Use this for whole-database recovery.

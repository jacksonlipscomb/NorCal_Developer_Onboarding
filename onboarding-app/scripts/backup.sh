#!/usr/bin/env bash
# Off-site, tier-independent data backup of the linked Supabase project.
# Writes a timestamped, data-only dump to backups/ (gitignored).
# Prereqs: supabase CLI logged in (`supabase login`) and linked (`supabase link`).
# See BACKUPS.md for the restore procedure.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p backups
ts="$(date +%Y%m%d-%H%M%S)"
out="backups/onboarding_data_${ts}.sql"

echo "Dumping data from the linked Supabase project to ${out} ..."
npx supabase db dump --data-only --linked -f "$out"
echo "Done: ${out}"

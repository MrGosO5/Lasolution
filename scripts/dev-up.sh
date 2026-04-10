#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."
docker compose --profile dev up -d postgres redis minio mailpit
echo "Waiting for Postgres..."
until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-lasolution}" -d "${POSTGRES_DB:-lasolution}" 2>/dev/null; do
  sleep 2
done
echo "Dev stack up (postgres, redis, minio, mailpit)."

.PHONY: dev-up dev-down db-migrate db-seed lint docker-build

dev-up:
	docker compose --profile dev up -d postgres redis minio mailpit

dev-down:
	docker compose --profile dev down

db-migrate:
	cd backend && npx prisma migrate deploy

db-migrate-dev:
	cd backend && npx prisma migrate dev

db-seed:
	cd backend && node prisma/seed.js

lint:
	npm run lint

docker-build:
	docker compose build backend worker frontend

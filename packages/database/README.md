# Database

PostgreSQL migrations for the control plane.

For the initial local environment:

```bash
psql "$DATABASE_URL" -f packages/database/migrations/001_init.sql
```

A migration runner will be selected when the control API persistence layer is implemented.

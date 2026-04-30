# Migration Plan: localStorage to Database-backed API

## 1. Export localStorage Data
- Export all relevant localStorage data (e.g., under `prime_ims_data`) to a JSON file, such as `seed/store.json`.

## 2. Create Migration SQL
- Create a migration file (e.g., `db/migrations/005_seed_local_data.sql`).
- Write SQL `INSERT` statements for each table (users, applications, dtr_entries, etc.) using the exported JSON data.
- Use `ON CONFLICT DO NOTHING` or UPSERT logic to avoid duplicates.

## 3. Update Seed Script
- Ensure `scripts/seed-store.js` can read the exported JSON and insert it into the database using the same logic as your migration file.
- This allows both local and deployed environments to use the same seed data.

## 4. Refactor Codebase
- Remove all localStorage-based logic from `src/store.js` and related files.
- Ensure all data fetching and saving uses the API endpoints.

## 5. Test Migration Locally
- Run the migration and seed scripts on your local database.
- Verify all data appears as expected via the new API endpoints.

## 6. Deploy Migration
- Apply the migration file to your production/staging database.
- Deploy the updated backend and frontend code.

## 7. Verify
- Test the deployed version to ensure all data is present and the app works as expected.

---

**Todo List**
- [ ] Export localStorage data to JSON file
- [ ] Create migration SQL to insert JSON data
- [ ] Update seed script to use JSON data
- [ ] Refactor code to remove localStorage logic
- [ ] Test migration and API data locally
- [ ] Deploy migration and verify data

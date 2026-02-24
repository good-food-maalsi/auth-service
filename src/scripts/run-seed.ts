/**
 * Run seed (create roles + admin user).
 * Usage: npm run seed:admin  (loads .env via node --env-file)
 */
import createAdmin from './create-admin';

(async () => {
  try {
    await createAdmin();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

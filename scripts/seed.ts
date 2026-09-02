import { migrateAndSeedDatabase } from '../server/seeder';
import { getDbConfig } from '../server/db';

async function main() {
  const config = getDbConfig();
  console.log(`=============================================================`);
  console.log(`MASUMA ERP & POS - STANDALONE MYSQL SEED RUNNER`);
  console.log(`Target: ${config.database}@${config.host}:${config.port} (User: ${config.user})`);
  console.log(`=============================================================`);

  const result = await migrateAndSeedDatabase();
  if (result.success) {
    console.log(`[SUCCESS] ${result.message}`);
    process.exit(0);
  } else {
    console.error(`[FAILURE] ${result.message}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

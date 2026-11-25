// Seed the synthetic records without inserting duplicates when rerun.
import { readFile } from 'node:fs/promises';
import { BSON } from 'mongodb';
import { adoptions, client } from './database.js';

try {
  const records = BSON.EJSON.parse(await readFile(new URL('../adoptions.json', import.meta.url), 'utf8'));
  await client.connect();
  await adoptions.createIndex({ AdoptionID: 1 }, { unique: true });
  const result = await adoptions.bulkWrite(records.map((record) => ({
    updateOne: {
      filter: { AdoptionID: record.AdoptionID },
      update: { $setOnInsert: record },
      upsert: true,
    },
  })));
  console.log(`Inserted ${result.upsertedCount} records. Kept ${result.matchedCount} existing records.`);
} catch (error) {
  console.error('Could not seed adoptions:', error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}

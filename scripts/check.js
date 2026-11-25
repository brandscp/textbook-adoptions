// Check the running API against the school's examples and failure cases.
import assert from 'node:assert/strict';

const origin = process.env.BASE_URL ?? 'http://127.0.0.1:4000';
const base = `${origin}/api/adoptions`;

async function get(path, expectedStatus = 200) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(10_000) });
  assert.equal(response.status, expectedStatus, `GET ${path || '/'}`);
  assert.match(response.headers.get('content-type'), /^application\/json\b/);
  return response.json();
}

const { adoptions } = await get('');
assert.ok(adoptions.length >= 8, 'Expected the sample records to be seeded.');
const dates = adoptions.map(({ AdoptionDate }) => AdoptionDate);
assert.ok(dates.every((date) => /^\d{4}-\d{2}-\d{2}T/.test(date)));
assert.deepEqual(dates, [...dates].sort());

const { adoption } = await get('/14');
assert.equal(adoption.AdoptionID, 14);
assert.deepEqual(adoption, adoptions.find(({ AdoptionID }) => AdoptionID === 14));

const university = await get('/university/100724');
assert.ok(university.adoptions.length >= 3);
assert.deepEqual(university.adoptions, adoptions.filter(({ UniversityID }) => UniversityID === 100724));

const unusedId = Number.MAX_SAFE_INTEGER;
assert.deepEqual(await get(`/university/${unusedId}`), { adoptions: [] });
assert.ok((await get(`/${unusedId}`, 404)).error);
assert.ok((await get('/abc', 400)).error);
assert.ok((await get('/university/0', 400)).error);
assert.ok((await get('/9007199254740992', 400)).error);
assert.ok((await get('/%ZZ', 400)).error);

console.log('Passed: all three routes, date order, empty and missing results, and invalid IDs.');

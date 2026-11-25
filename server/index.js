// Serve the read-only MongoDB API and the built React page from one origin.
import { fileURLToPath } from 'node:url';
import express from 'express';
import { adoptions, client } from './database.js';

const app = express();
const api = express.Router();
const projection = { _id: 0 };
const sort = { AdoptionDate: 1, AdoptionID: 1 };

api.param('id', (request, response, next, value) => {
  const id = Number(value);
  if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(id)) {
    return response.status(400).json({ error: 'Enter a positive whole-number ID in the supported range.' });
  }
  request.adoptionQueryId = id;
  next();
});

api.get('/', async (_request, response) => {
  response.json({ adoptions: await adoptions.find({}, { projection, sort }).toArray() });
});

api.get('/university/:id', async (request, response) => {
  const filter = { UniversityID: request.adoptionQueryId };
  response.json({ adoptions: await adoptions.find(filter, { projection, sort }).toArray() });
});

api.get('/:id', async (request, response) => {
  const adoption = await adoptions.findOne({ AdoptionID: request.adoptionQueryId }, { projection });
  if (!adoption) return response.status(404).json({ error: 'No adoption was found with that ID.' });
  response.json({ adoption });
});

app.use('/api/adoptions', api);
app.use('/api', (_request, response) => response.status(404).json({ error: 'API route not found.' }));
app.use('/api', (error, _request, response, _next) => {
  if (error.status === 400) return response.status(400).json({ error: 'The request URL is malformed.' });
  console.error('Adoptions query failed:', error.message);
  response.status(503).json({ error: 'Adoptions are temporarily unavailable. Try again shortly.' });
});
app.use(express.static(fileURLToPath(new URL('../dist', import.meta.url))));

try {
  await client.connect();
  const port = Number(process.env.PORT ?? 4000);
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`Adoption register ready at http://127.0.0.1:${server.address().port}`);
  });
  server.on('error', async (error) => {
    console.error('Could not start HTTP server:', error.message);
    await client.close();
    process.exitCode = 1;
  });
} catch (error) {
  console.error('Could not connect to MongoDB:', error.message);
  await client.close();
  process.exitCode = 1;
}

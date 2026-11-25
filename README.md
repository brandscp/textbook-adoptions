<!-- Setup and verification for the Chapter 14 Project 2 application. -->
# Chapter 14 · Project 2

The Textbook Adoption Register uses React and `fetch` to exercise three read-only Node.js API routes backed by MongoDB. The React build and the API share an origin.

## Run locally

Use Node.js 22.12+ and MongoDB Community Server. Open a terminal in this folder. If MongoDB is already listening on `127.0.0.1:27017`, you can use it. Otherwise, start a local server and leave that terminal open.

```sh
mkdir -p .mongo-data
mongod --dbpath .mongo-data --bind_ip 127.0.0.1
```

In a second terminal in the project folder, run the following commands.

```sh
npm ci
npm run seed
npm run build
npm start
```

Open [the local application](http://127.0.0.1:4000/). Run `npm run build` again after changing React or CSS source files. In another terminal, run `npm run check` while the app is running to test all three routes and their error cases.

`MONGODB_URI` overrides `mongodb://127.0.0.1:27017`. `PORT` overrides `4000`, and `BASE_URL` changes the server targeted by `npm run check`.

## Seed data and shell queries

[`adoptions.json`](adoptions.json) contains eight synthetic textbook adoption records. The textbook's sample IDs are included. The application uses the `adoptions` database and `adoptions` collection, following the written database instruction in the PDF. Dates use MongoDB Extended JSON so MongoDB stores them as BSON dates.

`npm run seed` creates a unique index on `AdoptionID` and inserts only missing records. To follow the textbook's CLI method on an empty collection, use [MongoDB Database Tools](https://www.mongodb.com/docs/database-tools/mongoimport/) and run this command in place of `npm run seed`.

```sh
mongoimport --db adoptions --collection adoptions --file adoptions.json --jsonArray --stopOnError
```

Open `mongosh` and try the queries from the PDF.

```javascript
use adoptions
db.adoptions.findOne({ AdoptionID: 14 })
db.adoptions.find({ UniversityID: 100724 }).sort({ AdoptionDate: 1 })
```

The first query returns *Designing for the Web*. The second returns adoption IDs `14`, `19`, and `26` in date order. Both import methods were tested against local MongoDB, and `mongoimport` loaded all eight records with BSON dates.

## API and browser checks

| Request | Successful response |
| --- | --- |
| `GET /api/adoptions` | `{ "adoptions": [...] }`, ordered from oldest to newest |
| `GET /api/adoptions/14` | `{ "adoption": {...} }`, the record with ID `14` |
| `GET /api/adoptions/university/100724` | `{ "adoptions": [...] }`, the university's records in date order |

Try the three search modes in React and use **View JSON response** to inspect the response for the last request. Invalid IDs return `400`. A missing adoption returns `404`. A university with no records returns `200` and an empty array.

See [the validation report](Project%202%20Validation%20Report.docx) for W3C results, corrections, and instructions to repeat the checks.

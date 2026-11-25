// Exercise each adoption API route with the same keyboard-accessible form.
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const base = '/api/adoptions';
const modes = [
  { value: 'all', label: 'All adoptions' },
  { value: 'adoption', label: 'Adoption ID', example: '14' },
  { value: 'university', label: 'University ID', example: '100724' },
];
const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
const pending = { records: [], status: 'Loading adoptions…' };

function AdoptionRegister() {
  const [mode, setMode] = useState(modes[0]);
  const [id, setId] = useState('');
  const [request, setRequest] = useState({ path: base });
  const [result, setResult] = useState(pending);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAdoptions() {
      try {
        const response = await fetch(request.path, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        const records = data.adoptions ?? [data.adoption];
        const status = records.length === 0
          ? 'No adoptions were found for that university.'
          : `${records.length} ${records.length === 1 ? 'adoption' : 'adoptions'} found.`;
        if (!controller.signal.aborted) setResult({ records, status });
      } catch (error) {
        if (controller.signal.aborted) return;
        const status = error instanceof TypeError || error instanceof SyntaxError
          ? 'Could not load adoptions. Run the query again to retry.'
          : error.message;
        setResult({ records: [], status, error: true });
      }
    }

    loadAdoptions();
    return () => controller.abort();
  }, [request]);

  function runQuery(event) {
    event.preventDefault();
    let path = base;
    if (mode.value === 'adoption') path = `${base}/${encodeURIComponent(id)}`;
    if (mode.value === 'university') path = `${base}/university/${encodeURIComponent(id)}`;
    setResult(pending);
    setRequest({ path });
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="container header-content">
          <span className="brand-mark" aria-hidden="true" />
          <span>Adoption Register</span>
        </div>
      </header>

      <main className="container" id="main" tabIndex={-1}>
        <div className="intro">
          <h1>Textbook adoptions</h1>
          <p>Browse sample textbook adoption records or look up a specific adoption or university.</p>
        </div>

        <div className="workspace">
          <section className="panel filters" aria-labelledby="filters-heading">
            <h2 id="filters-heading">Search records</h2>
            <form onSubmit={runQuery}>
              <fieldset>
                <legend>Search by</legend>
                {modes.map((option) => (
                  <label className="mode" key={option.value}>
                    <input
                      type="radio"
                      name="mode"
                      value={option.value}
                      checked={mode.value === option.value}
                      onChange={() => { setMode(option); setId(''); }}
                    />
                    {option.label}
                  </label>
                ))}
              </fieldset>
              {mode.example && (
                <div className="id-field">
                  <label htmlFor="lookup-id">{mode.label}</label>
                  <input
                    id="lookup-id"
                    name="id"
                    type="text"
                    inputMode="numeric"
                    pattern="[1-9][0-9]*"
                    aria-describedby="lookup-hint"
                    required
                    value={id}
                    onChange={(event) => setId(event.target.value)}
                  />
                  <p id="lookup-hint">Enter a positive whole number, e.g. {mode.example}.</p>
                </div>
              )}
              <button type="submit">Run query</button>
            </form>
          </section>

          <section className="panel results" aria-labelledby="results-heading">
            <div className="results-heading">
              <div>
                <h2 id="results-heading">Adoption records</h2>
                <p className={result.error ? 'status error' : 'status'} role="status">{result.status}</p>
              </div>
              <a className="response-link" href={request.path}>View JSON response</a>
              {result.records.length > 0 && <p className="scroll-note">Scroll the table to see more columns.</p>}
            </div>
            {result.records.length > 0 && (
              <div className="table-scroll" tabIndex={0} role="region" aria-label="Adoption table">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Adoption ID</th>
                      <th scope="col">Textbook</th>
                      <th scope="col">Course</th>
                      <th scope="col">University</th>
                      <th scope="col" aria-sort="ascending">Adoption date <span aria-hidden="true">↑</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.records.map((record) => (
                      <tr key={record.AdoptionID}>
                        <th scope="row">{record.AdoptionID}</th>
                        <td><strong>{record.BookTitle}</strong><span>{record.Author}</span></td>
                        <td className="course-code">{record.CourseCode}</td>
                        <td>{record.UniversityName}<span>{record.UniversityID}</span></td>
                        <td><time dateTime={record.AdoptionDate.slice(0, 10)}>{dateFormat.format(new Date(record.AdoptionDate))}</time></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<AdoptionRegister />);

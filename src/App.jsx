import { useState } from "react";

// Backend base URL — change this if your FastAPI server runs elsewhere
const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !query.trim()) {
      setError("Add a file and a query before running the analysis.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("user_query", query);
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong while analyzing the file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{globalCss}</style>

      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoMark}>DA</div>
          <div>
            <h1 style={styles.title}>Data Analysis Desk</h1>
            <p style={styles.subtitle}>Upload a dataset, ask a question, get the numbers.</p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="dataset">Dataset (.csv or .xlsx)</label>
            <input
              id="dataset"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={styles.fileInput}
            />
            {file && <span style={styles.fileName}>{file.name}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="query">What do you want to know?</label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Determine which region generates the highest sales"
              rows={3}
              style={styles.textarea}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Running analysis…" : "Run analysis"}
          </button>

          {error && <p style={styles.error}>{error}</p>}
        </form>

        {loading && (
          <div style={styles.loadingBlock}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Planning tasks and crunching the numbers…</p>
          </div>
        )}

        {result && !loading && <ResultsView result={result} apiBase={API_BASE} />}
      </main>
    </div>
  );
}

function ResultsView({ result, apiBase }) {
  const tasks = result.analysis_results || [];
  const charts = result.charts || [];
  const report = result.final_report;

  return (
    <section style={styles.results}>
      {report && (
        <div style={styles.reportCard}>
          <h2 style={styles.sectionTitle}>Summary</h2>
          <p style={styles.reportText}>{report}</p>
        </div>
      )}

      <h2 style={styles.sectionTitle}>Task results</h2>
      <div style={styles.taskGrid}>
        {tasks.map(([taskId, task]) => (
          <TaskCard key={taskId} taskId={taskId} task={task} />
        ))}
      </div>

      {charts.length > 0 && (
        <>
          <h2 style={styles.sectionTitle}>Charts</h2>
          <div style={styles.chartGrid}>
            {charts.map((path) => {
              const filename = path.split("/").pop();
              return (
                <img
                  key={path}
                  src={`${apiBase}/charts/${filename}`}
                  alt={filename}
                  style={styles.chartImage}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function TaskCard({ taskId, task }) {
  const result = task.result || {};

  return (
    <div style={styles.taskCard}>
      <div style={styles.taskHeader}>
        <span style={styles.taskId}>#{taskId}</span>
        <h3 style={styles.taskTitle}>{task.title}</h3>
      </div>
      <p style={styles.taskGoal}>{task.goal}</p>

      {"top_result" in result && (
        <div style={styles.topResult}>
          {Object.entries(result.top_result).map(([k, v]) => (
            <div key={k} style={styles.topResultRow}>
              <span style={styles.topResultKey}>{k}</span>
              <span style={styles.topResultValue}>{formatValue(v)}</span>
            </div>
          ))}
        </div>
      )}

      {"grouped_data" in result && Array.isArray(result.grouped_data) && (
        <GroupedTable rows={result.grouped_data} />
      )}

      {"duplicate_rows_count" in result && (
        <div style={styles.statLine}>
          Duplicate rows: <strong>{result.duplicate_rows_count}</strong>
        </div>
      )}

      {"total_missing_values" in result && (
        <div style={styles.statLine}>
          Total missing values: <strong>{result.total_missing_values}</strong>
        </div>
      )}

      {"missing_values" in result && (
        <MissingTable data={result.missing_values} />
      )}

      {Object.keys(result).length === 0 && (
        <p style={styles.emptyResult}>No result returned for this task.</p>
      )}
    </div>
  );
}

function GroupedTable({ rows }) {
  if (rows.length === 0) return null;
  const columns = Object.keys(rows[0]);

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} style={styles.th}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col} style={styles.td}>{formatValue(row[col])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MissingTable({ data }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  if (entries.length === 0) {
    return <p style={styles.statLine}>No missing values.</p>;
  }
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Column</th>
          <th style={styles.th}>Missing</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([col, count]) => (
          <tr key={col}>
            <td style={styles.td}>{col}</td>
            <td style={styles.td}>{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatValue(v) {
  if (typeof v === "number") {
    return v.toLocaleString();
  }
  return String(v);
}

const globalCss = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  input[type="file"]::file-selector-button {
    border: 1px solid #2b3a4a;
    background: #16212c;
    color: #e8edf2;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }
`;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0f1720",
    color: "#e8edf2",
    fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
  },
  header: {
    borderBottom: "1px solid #223040",
    padding: "28px 24px",
  },
  headerInner: {
    maxWidth: 880,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "#c98a3e",
    color: "#0f1720",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontFamily: "'IBM Plex Mono', monospace",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 14,
    color: "#93a3b3",
  },
  main: {
    maxWidth: 880,
    margin: "0 auto",
    padding: "32px 24px 80px",
  },
  form: {
    background: "#16212c",
    border: "1px solid #223040",
    borderRadius: 12,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: "#93a3b3",
    fontWeight: 500,
  },
  fileInput: {
    color: "#e8edf2",
    fontSize: 13,
  },
  fileName: {
    fontSize: 12,
    color: "#c98a3e",
  },
  textarea: {
    background: "#0f1720",
    border: "1px solid #2b3a4a",
    borderRadius: 8,
    padding: 12,
    color: "#e8edf2",
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
  },
  button: {
    background: "#c98a3e",
    color: "#0f1720",
    border: "none",
    borderRadius: 8,
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  error: {
    color: "#e08a8a",
    fontSize: 13,
    margin: 0,
  },
  loadingBlock: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "24px 0",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid #2b3a4a",
    borderTopColor: "#c98a3e",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#93a3b3",
    fontSize: 14,
  },
  results: {
    marginTop: 32,
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },
  reportCard: {
    background: "#16212c",
    border: "1px solid #223040",
    borderRadius: 12,
    padding: 22,
  },
  reportText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#d3dbe3",
    margin: 0,
    whiteSpace: "pre-wrap",
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: "none",
    color: "#93a3b3",
    fontWeight: 600,
    margin: "0 0 12px",
  },
  taskGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
  },
  taskCard: {
    background: "#16212c",
    border: "1px solid #223040",
    borderRadius: 10,
    padding: 18,
  },
  taskHeader: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
  },
  taskId: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "#c98a3e",
  },
  taskTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
  },
  taskGoal: {
    fontSize: 13,
    color: "#93a3b3",
    margin: "6px 0 14px",
  },
  topResult: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "#0f1720",
    borderRadius: 8,
    padding: 12,
  },
  topResultRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
  },
  topResultKey: {
    color: "#93a3b3",
  },
  topResultValue: {
    fontWeight: 600,
    color: "#c98a3e",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  statLine: {
    fontSize: 13,
    color: "#d3dbe3",
    margin: "6px 0",
  },
  emptyResult: {
    fontSize: 13,
    color: "#5c6b7a",
    fontStyle: "italic",
    margin: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 8,
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    color: "#93a3b3",
    fontWeight: 500,
    borderBottom: "1px solid #223040",
    padding: "6px 8px",
  },
  td: {
    padding: "6px 8px",
    borderBottom: "1px solid #1b2530",
    color: "#d3dbe3",
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  },
  chartImage: {
    width: "100%",
    borderRadius: 10,
    border: "1px solid #223040",
    background: "#fff",
  },
};

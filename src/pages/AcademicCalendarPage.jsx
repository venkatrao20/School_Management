import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../services/authService";
import { CALENDAR_EVENT_TYPES } from "../data/academicCalendarSchema";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentYearMonth() {
  return todayISO().slice(0, 7);
}

function monthLabel(yearMonth) {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function shiftMonth(yearMonth, delta) {
  const [y, m] = yearMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Maps an event type to one of the existing badge color classes already
// defined in index.css, so no new CSS is needed.
function typeBadgeClass(type) {
  if (type === CALENDAR_EVENT_TYPES.HOLIDAY) return "status-valid";
  if (type === CALENDAR_EVENT_TYPES.EXAM) return "status-invalid";
  if (type === CALENDAR_EVENT_TYPES.PTM) return "status-duplicate";
  return "status-duplicate"; // Event / Term Boundary
}

const TYPE_FILTERS = [{ key: "all", label: "All" }, ...Object.values(CALENDAR_EVENT_TYPES).map((t) => ({ key: t, label: t }))];

function AcademicCalendarPage() {
  const navigate = useNavigate();
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [typeFilter, setTypeFilter] = useState("all");
  const [events, setEvents] = useState([]);
  const [loadError, setLoadError] = useState("");
  const today = todayISO();

  useEffect(() => {
    let active = true;
    fetch("/api/academics/calendar", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Academic calendar is unavailable.");
        return body.data;
      })
      .then((data) => { if (active) setEvents(data); })
      .catch((error) => { if (active) setLoadError(error.message); });
    return () => { active = false; };
  }, []);

  const monthEvents = events.filter((e) => {
    const start = e.date.slice(0, 7);
    const end = (e.endDate || e.date).slice(0, 7);
    return yearMonth >= start && yearMonth <= end && (typeFilter === "all" || e.type === typeFilter);
  });
  const upcoming = events
    .filter((e) => (e.endDate || e.date) >= today)
    .slice(0, 5);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Academic Calendar</h1>
        <button className="logout-btn" onClick={() => navigate(-1)}>
          Back to Dashboard
        </button>
      </div>

      <div className="dashboard-content">
        <p className="view-only-label" style={{ marginBottom: 16 }}>
          School-wide holidays, exams, PTMs and events. Set up by Administration —
          view only here.
        </p>
        {loadError && <p className="module-alert">{loadError}</p>}

        <div className="results-panel" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Coming Up</h3>
          {upcoming.length === 0 ? (
            <p className="upload-instructions">No upcoming events scheduled.</p>
          ) : (
            <div className="results-summary">
              {upcoming.map((e) => (
                <span key={e.id} className={`summary-chip summary-total`}>
                  <span className={`status-badge ${typeBadgeClass(e.type)}`} style={{ marginRight: 6 }}>
                    {e.type}
                  </span>
                  {e.title} — {e.date}
                  {e.endDate ? ` to ${e.endDate}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" className="secondary-btn" onClick={() => setYearMonth((m) => shiftMonth(m, -1))}>
              ← Prev
            </button>
            <h3 style={{ fontFamily: "var(--font-display)", margin: 0, minWidth: 180, textAlign: "center" }}>
              {monthLabel(yearMonth)}
            </h3>
            <button type="button" className="secondary-btn" onClick={() => setYearMonth((m) => shiftMonth(m, 1))}>
              Next →
            </button>
          </div>

          <div className="tabs" style={{ marginBottom: 0 }}>
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`tab-btn ${typeFilter === f.key ? "tab-btn-active" : ""}`}
                onClick={() => setTypeFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {monthEvents.length === 0 ? (
          <p className="upload-instructions">No events matching these filters in {monthLabel(yearMonth)}.</p>
        ) : (
          <div className="table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {monthEvents.map((e) => (
                  <tr key={e.id} style={e.date === today ? { background: "#f5f7ff" } : undefined}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {e.date}
                      {e.endDate ? ` → ${e.endDate}` : ""}
                      {e.date === today && (
                        <span className="status-badge status-valid" style={{ marginLeft: 6 }}>
                          Today
                        </span>
                      )}
                    </td>
                    <td>{e.title}</td>
                    <td>
                      <span className={`status-badge ${typeBadgeClass(e.type)}`}>{e.type}</span>
                    </td>
                    <td>{e.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AcademicCalendarPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAssignedClasses } from "../utils/permissions";
import { getAssignmentFor } from "../data/teacherAssignments";
import { getSchoolInfo } from "../services/schoolInfoService";
import { getSubjectsForBoard, getBoardLabel } from "../data/subjectsByBoard";
import {
  getLessonPlans,
  addLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  getCoverageSummary,
  LESSON_STATUS,
} from "../services/syllabusService";

function emptyForm(classSection, subject) {
  return {
    classSection,
    subject: subject || "",
    chapter: "",
    topics: "",
    plannedDate: "",
    status: LESSON_STATUS.PLANNED,
    notes: "",
  };
}

const STATUS_LABELS = {
  [LESSON_STATUS.PLANNED]: "Planned",
  [LESSON_STATUS.IN_PROGRESS]: "In Progress",
  [LESSON_STATUS.COMPLETED]: "Completed",
};

function statusBadgeClass(status) {
  if (status === LESSON_STATUS.COMPLETED) return "status-valid";
  if (status === LESSON_STATUS.IN_PROGRESS) return "status-duplicate";
  return "status-invalid"; // planned / not yet started
}

function SyllabusPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const assignedClasses = getAssignedClasses(user);
  const assignment = getAssignmentFor(user?.staffId);
  const board = getSchoolInfo()?.affiliationBoard || "CBSE";
  const boardSubjects = getSubjectsForBoard(board);
  const defaultSubject = assignment?.subject && boardSubjects.includes(assignment.subject)
    ? assignment.subject
    : boardSubjects[0];

  const [activeClass, setActiveClass] = useState(assignedClasses[0] || "");
  const [subjectFilter, setSubjectFilter] = useState(defaultSubject);
  const [form, setForm] = useState(emptyForm(assignedClasses[0] || "", defaultSubject));
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const plans = activeClass ? getLessonPlans(activeClass, subjectFilter) : [];
  const coverage = activeClass ? getCoverageSummary(activeClass, subjectFilter) : null;

  const switchClass = (c) => {
    setActiveClass(c);
    setForm(emptyForm(c, subjectFilter));
    setEditingId(null);
    setError("");
    setSaved("");
  };

  const switchSubject = (subj) => {
    setSubjectFilter(subj);
    setForm(emptyForm(activeClass, subj));
    setEditingId(null);
    setError("");
    setSaved("");
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved("");
  };

  const resetForm = () => {
    setForm(emptyForm(activeClass, subjectFilter));
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.chapter.trim()) {
      setError("Chapter / Topic name is required.");
      setSaved("");
      return;
    }
    const payload = { ...form, classSection: activeClass, subject: subjectFilter };
    if (editingId) {
      updateLessonPlan(editingId, payload);
      setSaved("Lesson plan updated.");
    } else {
      addLessonPlan(payload);
      setSaved("Lesson plan added.");
    }
    resetForm();
    setError("");
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setForm({
      classSection: plan.classSection,
      subject: plan.subject,
      chapter: plan.chapter,
      topics: plan.topics || "",
      plannedDate: plan.plannedDate || "",
      status: plan.status,
      notes: plan.notes || "",
    });
    setError("");
    setSaved("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    deleteLessonPlan(id);
    if (editingId === id) resetForm();
    setSaved("");
  };

  const quickSetStatus = (plan, status) => {
    updateLessonPlan(plan.id, { status });
    setSaved("");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Syllabus / Lesson Plan</h1>
        <button className="logout-btn" onClick={() => navigate(-1)}>
          Back to Dashboard
        </button>
      </div>

      <div className="dashboard-content">
        {assignedClasses.length === 0 ? (
          <p className="upload-instructions">You have no assigned classes yet.</p>
        ) : (
          <>
            <div className="tabs">
              {assignedClasses.map((c) => (
                <button
                  key={c}
                  className={`tab-btn ${activeClass === c ? "tab-btn-active" : ""}`}
                  onClick={() => switchClass(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="form-field" style={{ maxWidth: 260, marginBottom: 16 }}>
              <label>Subject ({getBoardLabel(board)})</label>
              <select value={subjectFilter} onChange={(e) => switchSubject(e.target.value)}>
                {boardSubjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {coverage && (
              <div className="results-panel" style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>
                  Syllabus Coverage — {activeClass} · {subjectFilter}
                </h3>
                <div className="results-summary">
                  <span className="summary-chip summary-total">{coverage.total} chapters planned</span>
                  <span className="summary-chip summary-valid">{coverage.completed} completed</span>
                  <span className="summary-chip summary-duplicate">{coverage.inProgress} in progress</span>
                  <span className="summary-chip summary-invalid">{coverage.planned} not started</span>
                  <span className="summary-chip summary-total">{coverage.percent}% complete</span>
                </div>
              </div>
            )}

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Chapter / Topic *</label>
                <input
                  type="text"
                  value={form.chapter}
                  onChange={(e) => handleChange("chapter", e.target.value)}
                  placeholder="e.g. Chapter 4 — Fractions"
                />
              </div>
              <div className="form-field">
                <label>Sub-topics Covered</label>
                <textarea
                  rows={2}
                  value={form.topics}
                  onChange={(e) => handleChange("topics", e.target.value)}
                  placeholder="e.g. Equivalent fractions, addition & subtraction of fractions"
                />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div className="form-field" style={{ maxWidth: 220 }}>
                  <label>Planned Date</label>
                  <input
                    type="date"
                    value={form.plannedDate}
                    onChange={(e) => handleChange("plannedDate", e.target.value)}
                  />
                </div>
                <div className="form-field" style={{ maxWidth: 220 }}>
                  <label>Status</label>
                  <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Optional — teaching aids used, homework linked, remarks"
                />
              </div>

              {error && <div className="alert alert-error">{error}</div>}
              {saved && <div className="alert alert-success">{saved}</div>}

              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  {editingId ? "Update Lesson Plan" : "Add Lesson Plan"}
                </button>
                {editingId && (
                  <button type="button" className="link-btn" onClick={resetForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            <div className="results-panel">
              <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>
                {activeClass} · {subjectFilter} — Chapter Tracker
              </h3>
              {plans.length === 0 ? (
                <p className="upload-instructions">No lesson plans added yet for this class/subject.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Chapter / Topic</th>
                        <th>Sub-topics</th>
                        <th>Planned Date</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan) => (
                        <tr key={plan.id}>
                          <td>{plan.chapter}</td>
                          <td>{plan.topics || "—"}</td>
                          <td>{plan.plannedDate || "—"}</td>
                          <td>
                            <span className={`status-badge ${statusBadgeClass(plan.status)}`}>
                              {STATUS_LABELS[plan.status]}
                            </span>
                          </td>
                          <td>{plan.notes || "—"}</td>
                          <td className="actions-cell">
                            <button className="link-btn" onClick={() => handleEdit(plan)}>
                              Edit
                            </button>{" "}
                            {plan.status !== LESSON_STATUS.COMPLETED && (
                              <button
                                className="link-btn"
                                onClick={() => quickSetStatus(plan, LESSON_STATUS.COMPLETED)}
                              >
                                Mark Complete
                              </button>
                            )}{" "}
                            <button className="link-btn link-btn-danger" onClick={() => handleDelete(plan.id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SyllabusPage;

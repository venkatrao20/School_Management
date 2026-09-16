// Mock persistence for Syllabus / Lesson Plan (Teachers & Academics epic).
// Same pattern as teacherDataService.js — swap for real API calls once a
// backend is available.
//
// A lesson plan is one record per (classSection, subject, chapter/topic),
// holding a planned teaching window, status, and optional notes — the
// standard "syllabus tracker" a teacher fills in chapter by chapter across
// the term so both the teacher and the school can see how much of the
// syllabus has actually been covered.

const KEY = "teacher_syllabus";

function readAll() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

export const LESSON_STATUS = {
  PLANNED: "planned",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
};

export function getLessonPlans(classSection, subject) {
  const all = readAll();
  return all
    .filter((l) => l.classSection === classSection && (!subject || l.subject === subject))
    .sort((a, b) => (a.plannedDate || "").localeCompare(b.plannedDate || ""));
}

export function addLessonPlan(plan) {
  const all = readAll();
  const now = new Date().toISOString();
  all.push({
    status: LESSON_STATUS.PLANNED,
    notes: "",
    ...plan,
    id: `LP${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  });
  return writeAll(all);
}

export function updateLessonPlan(id, updated) {
  const all = readAll();
  const idx = all.findIndex((l) => l.id === id);
  if (idx < 0) return all;
  all[idx] = { ...all[idx], ...updated, id, updatedAt: new Date().toISOString() };
  return writeAll(all);
}

export function deleteLessonPlan(id) {
  return writeAll(readAll().filter((l) => l.id !== id));
}

// Percentage of a class/subject's chapters marked completed, for a
// quick "syllabus coverage" progress indicator.
export function getCoverageSummary(classSection, subject) {
  const plans = getLessonPlans(classSection, subject);
  const total = plans.length;
  const completed = plans.filter((l) => l.status === LESSON_STATUS.COMPLETED).length;
  const inProgress = plans.filter((l) => l.status === LESSON_STATUS.IN_PROGRESS).length;
  return {
    total,
    completed,
    inProgress,
    planned: total - completed - inProgress,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

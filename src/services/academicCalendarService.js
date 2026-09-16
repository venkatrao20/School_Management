// Mock persistence for the Academic Calendar — same pattern as
// schoolInfoService.js / teacherDataService.js. Swap for real API calls
// once a backend is available.

import { SEED_ACADEMIC_CALENDAR } from "../data/academicCalendarSchema";

const KEY = "academic_calendar";

function readAll() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

// Pre-populate the demo calendar the first time the app loads, same
// convention as seedIfEmpty() in schoolDataService.js / schoolInfoService.js.
export function seedIfEmpty() {
  if (readAll().length === 0) {
    writeAll(SEED_ACADEMIC_CALENDAR);
  }
}

export function getAllEvents() {
  return [...readAll()].sort((a, b) => a.date.localeCompare(b.date));
}

// Events for a single calendar month ("2026-08"), inclusive of any
// multi-day event (endDate) that overlaps the month.
export function getEventsForMonth(yearMonth) {
  return getAllEvents().filter((e) => {
    const start = e.date.slice(0, 7);
    const end = (e.endDate || e.date).slice(0, 7);
    return yearMonth >= start && yearMonth <= end;
  });
}

// Upcoming events from today onward, for a dashboard-style widget.
export function getUpcomingEvents(todayIso, limit = 5) {
  return getAllEvents()
    .filter((e) => (e.endDate || e.date) >= todayIso)
    .slice(0, limit);
}

export function getEventsOnDate(dateIso) {
  return getAllEvents().filter((e) => {
    const end = e.endDate || e.date;
    return dateIso >= e.date && dateIso <= end;
  });
}

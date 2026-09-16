// Academic Calendar (Teachers & Academics epic — "Academic Calendar" feature).
// A single school-wide list of dated entries: holidays, exams, PTMs,
// events, and term boundaries. Teachers view this read-only; editing it
// is an Admin/Coordinator responsibility (Administration & Data owns
// "Holidays & Calendar Setup"), so this file only defines the shape and
// a seed list — no admin UI is included in this module.

export const CALENDAR_EVENT_TYPES = {
  HOLIDAY: "Holiday",
  EXAM: "Exam",
  PTM: "Parent-Teacher Meeting",
  EVENT: "School Event",
  TERM: "Term Boundary",
};

export const ACADEMIC_CALENDAR_SCHEMA = {
  label: "Academic Calendar",
  uniqueField: "id",
  fields: [
    { name: "id", label: "Event ID", required: true },
    { name: "title", label: "Title", required: true },
    { name: "date", label: "Date (YYYY-MM-DD)", required: true, type: "date" },
    { name: "endDate", label: "End Date (YYYY-MM-DD, optional for multi-day)", required: false, type: "date" },
    {
      name: "type",
      label: "Type",
      required: true,
      type: "enum",
      options: Object.values(CALENDAR_EVENT_TYPES),
    },
    { name: "description", label: "Description", required: false },
  ],
};

// Seed events for the current academic year, matching the school's
// academicYearStart/End in schoolInfoSchema.js (2026-06-01 → 2027-03-31).
export const SEED_ACADEMIC_CALENDAR = [
  { id: "CAL001", title: "Academic Year Begins", date: "2026-06-01", type: CALENDAR_EVENT_TYPES.TERM, description: "Term 1 starts." },
  { id: "CAL002", title: "Independence Day", date: "2026-08-15", type: CALENDAR_EVENT_TYPES.HOLIDAY, description: "National holiday." },
  { id: "CAL003", title: "Test 1", date: "2026-08-24", endDate: "2026-08-28", type: CALENDAR_EVENT_TYPES.EXAM, description: "Unit test across all subjects." },
  { id: "CAL004", title: "Term 1 Parent-Teacher Meeting", date: "2026-09-05", type: CALENDAR_EVENT_TYPES.PTM, description: "Report Test 1 performance to parents." },
  { id: "CAL005", title: "Gandhi Jayanti", date: "2026-10-02", type: CALENDAR_EVENT_TYPES.HOLIDAY, description: "National holiday." },
  { id: "CAL006", title: "Diwali Break", date: "2026-10-19", endDate: "2026-10-23", type: CALENDAR_EVENT_TYPES.HOLIDAY, description: "Festival break." },
  { id: "CAL007", title: "Mid Term Exam", date: "2026-11-16", endDate: "2026-11-25", type: CALENDAR_EVENT_TYPES.EXAM, description: "Mid-term examinations, all classes." },
  { id: "CAL008", title: "Annual Day", date: "2026-12-12", type: CALENDAR_EVENT_TYPES.EVENT, description: "Cultural program, all classes participate." },
  { id: "CAL009", title: "Winter Break", date: "2026-12-24", endDate: "2027-01-02", type: CALENDAR_EVENT_TYPES.HOLIDAY, description: "Winter vacation." },
  { id: "CAL010", title: "Republic Day", date: "2027-01-26", type: CALENDAR_EVENT_TYPES.HOLIDAY, description: "National holiday." },
  { id: "CAL011", title: "Term 2 Parent-Teacher Meeting", date: "2027-02-06", type: CALENDAR_EVENT_TYPES.PTM, description: "Report Mid Term performance to parents." },
  { id: "CAL012", title: "Final Exam", date: "2027-03-10", endDate: "2027-03-20", type: CALENDAR_EVENT_TYPES.EXAM, description: "Final examinations, all classes." },
  { id: "CAL013", title: "Academic Year Ends", date: "2027-03-31", type: CALENDAR_EVENT_TYPES.TERM, description: "Term 2 ends; results declared." },
];

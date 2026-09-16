import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Unauthorized from "./pages/Unauthorized";
import TeacherDashboard from "./pages/TeacherDashboard";
import AttendancePage from "./pages/AttendancePage";
import HomeworkPage from "./pages/HomeworkPage";
import TimetablePage from "./pages/TimetablePage";
import MarksPage from "./pages/MarksPage";
import TopPerformerPage from "./pages/TopPerformerPage";
import SyllabusPage from "./pages/SyllabusPage";
import AcademicCalendarPage from "./pages/AcademicCalendarPage";
import TeacherProfilePage from "./pages/TeacherProfilePage";
import TransportPage from "./pages/TransportPage";
import NotificationsPage from "./pages/NotificationsPage";
import { seedIfEmpty as seedSchoolData } from "./services/schoolDataService";
import { seedIfEmpty as seedSchoolInfo } from "./services/schoolInfoService";
import { seedIfEmpty as seedAcademicCalendar } from "./services/academicCalendarService";

// Pre-populate the demo (staff/student seed data, school profile, academic
// calendar) the first time the app loads — same convention as the full
// admin portal's App.jsx.
seedSchoolData();
seedSchoolInfo();
seedAcademicCalendar();

// Teachers & Academics module (standalone) — covers every feature listed
// under the "Teachers & Academics" epic in the MVP1 master feature sheet:
// Teacher/Staff Profiles, Teacher-Class Allocation, Class & Teacher
// Timetable, Homework & Assignments (Creation + View), Syllabus/Lesson
// Plan, Academic Calendar, Academic Dashboard, Marks/Academic Information.
// (Daily attendance is included too since it shipped in the same sprint
// build this module was extracted from; full Attendance-epic reporting
// and Examination & Results merit-list/report-card generation are out of
// scope here — those are separate epics owned elsewhere.)
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/teacher-dashboard"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/homework"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <HomeworkPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/timetable"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <TimetablePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/marks"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <MarksPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/top-performer"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <TopPerformerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/syllabus"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <SyllabusPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/academic-calendar"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <AcademicCalendarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <TeacherProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transport"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
                <TransportPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

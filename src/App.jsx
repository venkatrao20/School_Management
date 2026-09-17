import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import HomeDashboard from "./pages/HomeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
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
import ModuleDashboard from "./pages/ModuleDashboard";
import { seedIfEmpty as seedSchoolData } from "./services/schoolDataService";
import { seedIfEmpty as seedSchoolInfo } from "./services/schoolInfoService";

// Pre-populate the demo (staff/student seed data, school profile, academic
// calendar) the first time the app loads — same convention as the full
// admin portal's App.jsx.
seedSchoolData();
seedSchoolInfo();

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
          <Route path="/" element={<Navigate to="/home-dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/home-dashboard"
            element={<ProtectedRoute><HomeDashboard /></ProtectedRoute>}
          />

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher-dashboard"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/module-dashboard"
            element={
              <ProtectedRoute>
                <ModuleDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/homework"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <HomeworkPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/timetable"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <TimetablePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/marks"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <MarksPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/top-performer"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <TopPerformerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/syllabus"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <SyllabusPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/academic-calendar"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <AcademicCalendarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
                <TeacherProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transport"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "TEACHER", "TRANSPORT"]}>
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
          <Route path="*" element={<Navigate to="/home-dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

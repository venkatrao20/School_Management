import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>School Management Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <p>Welcome, {user?.name || "Admin"}!</p>
        <p>Your role gives access to all core modules across the school.</p>

        <div className="admin-nav-grid">
          <div className="admin-nav-card" onClick={() => navigate("/teacher-dashboard")}>
            <h3>Teacher Module</h3>
            <p>Attendance, homework, timetable, marks, syllabus, academic calendar and profile.</p>
          </div>

          <div className="admin-nav-card" onClick={() => navigate("/transport")}>
            <h3>Transport</h3>
            <p>Monitor routes, fleet status and assigned transport activity.</p>
          </div>

          <div className="admin-nav-card" onClick={() => navigate("/notifications")}>
            <h3>Notifications</h3>
            <p>Review announcements, admin updates and unread communication.</p>
          </div>

          <div className="admin-nav-card" onClick={() => navigate("/teacher/attendance")}>
            <h3>Attendance</h3>
            <p>Track classroom attendance and student participation.</p>
          </div>

          <div className="admin-nav-card" onClick={() => navigate("/teacher/homework")}>
            <h3>Homework</h3>
            <p>Create and review homework assignments and class tasks.</p>
          </div>

          <div className="admin-nav-card" onClick={() => navigate("/teacher/timetable")}>
            <h3>Timetable</h3>
            <p>View teaching schedules and class planning.</p>
          </div>

          <div className="admin-nav-card" onClick={() => navigate("/teacher/marks")}>
            <h3>Marks</h3>
            <p>Review assessment and grading records for your classes.</p>
          </div>

          <div className="admin-nav-card" onClick={() => navigate("/teacher/top-performer")}>
            <h3>Top Performers</h3>
            <p>Identify leading students and academic performance trends.</p>
          </div>

          <div className="admin-nav-card" onClick={() => navigate("/teacher/syllabus")}>
            <h3>Syllabus</h3>
            <p>Track lesson plan coverage and chapter progress.</p>
          </div>

          <div className="admin-nav-card" onClick={() => navigate("/teacher/academic-calendar")}>
            <h3>Academic Calendar</h3>
            <p>Coordinate holidays, exam dates and activity schedules.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

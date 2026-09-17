import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const moduleByRole = {
  ADMISSIONS: {
    title: "Admissions Dashboard",
    summary: "Review enquiries, applications, assessments, and new-student onboarding.",
    highlights: ["2 sample enquiries", "Assessment pipeline", "Document review"],
  },
  TRANSPORT: {
    title: "Transport Dashboard",
    summary: "Monitor routes, vehicles, drivers, and student travel activity.",
    highlights: ["1 active school bus", "Central Route", "Live movement records"],
  },
  FINANCE: {
    title: "Fee Finance Dashboard",
    summary: "Review fee collections, payment status, discounts, and family balances.",
    highlights: ["2 sample payments", "INR fee receipts", "Payment status tracking"],
  },
  PARENT: {
    title: "Parent Dashboard",
    summary: "View student communication, transport information, and school updates.",
    highlights: ["School announcements", "Transport updates", "Fee payment history"],
  },
  STUDENT: {
    title: "Student Dashboard",
    summary: "View your timetable, homework, academic progress, and school announcements.",
    highlights: ["Today’s timetable", "Homework and assignments", "Academic progress"],
  },
};

function ModuleDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const module = moduleByRole[user?.role] || {
    title: "EDUNOVAE Dashboard",
    summary: "Open the school-management workspaces available to your account.",
    highlights: ["Unified access", "Role-based workspace", "School data"],
  };

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <div><p className="dashboard-kicker">EDUNOVAE WORKSPACE</p><h1>{module.title}</h1></div>
        <button className="logout-btn" type="button" onClick={() => { logout(); navigate("/login"); }}>Sign out</button>
      </header>
      <section className="dashboard-content">
        <p>Welcome, {user?.name}.</p>
        <p>{module.summary}</p>
        <div className="admin-nav-grid">
          {module.highlights.map((item) => <article className="admin-nav-card" key={item}><h3>{item}</h3><p>This workspace is being integrated with the shared production API.</p></article>)}
          <button className="admin-nav-card dashboard-open-hub" type="button" onClick={() => navigate("/home-dashboard")}><h3>All Modules</h3><p>Open the EDUNOVAE unified dashboard.</p></button>
        </div>
      </section>
    </main>
  );
}

export default ModuleDashboard;

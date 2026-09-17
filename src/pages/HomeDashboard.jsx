import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const iconByTone = {
  purple: "⚙",
  blue: "🚌",
  beige: "🎓",
  rose: "📚",
  amber: "🔔",
  green: "₹",
};

function HomeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { label: "Hub Overview", to: "/home-dashboard" },
    { label: "Admin Portal", to: "/admin-dashboard" },
    { label: "Transport", to: "/transport" },
    { label: "Admissions", to: "/module-dashboard" },
    { label: "Academics", to: "/teacher-dashboard" },
    { label: "Notifications", to: "/notifications" },
    { label: "Fee Finance", to: "/module-dashboard" },
  ];

  const cards = [
    { title: "Admin Portal", description: "School information, classes, sections, students, staff, timetable, and CSV uploads.", tone: "purple", to: "/admin-dashboard", status: "Demo data" },
    { title: "School Transport", description: "Bus routes, vehicle management, assignments, and live boarding tracking.", tone: "blue", to: "/transport", status: "Available" },
    { title: "Admissions", description: "Student enquiries, applications, assessments, approvals, and admission metrics.", tone: "beige", to: "/module-dashboard", status: "Integration pending" },
    { title: "Academics", description: "Teacher assignments, attendance, homework, exams, and student report cards.", tone: "rose", to: "/teacher-dashboard", status: "Demo data" },
    { title: "Notifications", description: "Fees, events, attendance alerts, reports, and role-based school notifications.", tone: "amber", to: "/notifications", status: "Available" },
    { title: "Fee Finance", description: "Fee structures, payment plans, discounts, student assignments, and finance summaries.", tone: "green", to: "/module-dashboard", status: "Integration pending" },
  ];

  return (
    <div className="hub-shell">
      <header className="hub-topbar">
        <div className="hub-brand-row">
          <button className="hub-brand-block" type="button" onClick={() => navigate("/home-dashboard")}>
            <img className="hub-mini-logo" src="/brand/edunovae-logo.jpeg" alt="EDUNOVAE" />
            <span className="hub-brand-name">EDUNOVAE</span>
          </button>
          <nav className="hub-nav" aria-label="Module navigation">
            {navigation.map((item) => (
              <button
                key={item.label}
                type="button"
                className={location.pathname === item.to ? "hub-nav-item active" : "hub-nav-item"}
                onClick={() => navigate(item.to)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="hub-account">
          <span>Signed in as {user?.name || "School user"}</span>
          <button type="button" onClick={() => { logout(); navigate("/login"); }}>Sign out</button>
        </div>
      </header>

      <main className="hub-page">
        <section className="hub-hero">
          <div className="hub-hero-copy">
            <p className="hub-eyebrow">ONE PLATFORM. SMARTER MANAGEMENT.</p>
            <h1>Welcome to EDUNOVAE</h1>
            <p>Open every school-management workspace from one unified dashboard.</p>
          </div>
          <img className="hub-hero-logo" src="/brand/edunovae-logo.jpeg" alt="EDUNOVAE school management logo" />
        </section>

        <section className="hub-module-section">
          <div className="hub-module-header">
            <div><p className="hub-eyebrow">WORKSPACES</p><h2>School modules</h2></div>
            <span>Select a module to open its workspace.</span>
          </div>
          <div className="hub-card-grid">
            {cards.map((card, index) => (
              <button key={card.title} type="button" className={`hub-card ${card.tone}`} onClick={() => navigate(card.to)} style={{ animationDelay: `${index * 70}ms` }}>
                <div className="hub-card-head">
                  <span className="hub-card-icon" aria-hidden="true">{iconByTone[card.tone]}</span>
                  <span className="hub-card-status">{card.status}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <div className="hub-card-footer">Open {card.title} <span aria-hidden="true">→</span></div>
              </button>
            ))}
          </div>
        </section>
        <footer className="hub-footer-bar">EDUNOVAE · One Platform. Smarter Management.</footer>
      </main>
    </div>
  );
}

export default HomeDashboard;

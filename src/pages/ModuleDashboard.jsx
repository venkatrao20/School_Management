import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getToken } from "../services/authService";

const moduleByRole = {
  ADMISSIONS: {
    title: "Admissions Dashboard",
    summary: "Review enquiries, applications, assessments, and new-student onboarding.",
    highlights: ["Enquiries", "Assessment pipeline", "Document review"],
  },
  TRANSPORT: {
    title: "Transport Dashboard",
    summary: "Monitor routes, vehicles, drivers, and student travel activity.",
    highlights: ["1 active school bus", "Central Route", "Live movement records"],
  },
  FINANCE: {
    title: "Fee Finance Dashboard",
    summary: "Review fee collections, payment status, discounts, and family balances.",
    highlights: ["Payments", "Fee receipts", "Payment status tracking"],
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

const summaryConfigByRole = {
  ADMISSIONS: {
    endpoint: "/api/admissions/summary",
    format: (data) => [
      `${data.enquiries} enquiries`,
      `${data.assessments} assessments`,
      `${data.newEnquiries} new`,
    ],
  },
  FINANCE: {
    endpoint: "/api/finance/summary",
    format: (data) => [
      `${data.payments} payments`,
      `₹${Number(data.collectedAmount || 0).toLocaleString("en-IN")} collected`,
      `${data.pendingPayments} pending`,
    ],
  },
};

function ModuleDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [liveHighlights, setLiveHighlights] = useState(null);
  const [loadError, setLoadError] = useState("");
  const module = moduleByRole[user?.role] || {
    title: "EDUNOVAE Dashboard",
    summary: "Open the school-management workspaces available to your account.",
    highlights: ["Unified access", "Role-based workspace", "School data"],
  };
  const summaryConfig = summaryConfigByRole[user?.role];

  useEffect(() => {
    if (!summaryConfig) return undefined;
    let active = true;
    fetch(summaryConfig.endpoint, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Module data is unavailable.");
        return body.data;
      })
      .then((data) => {
        if (active) setLiveHighlights(summaryConfig.format(data));
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });
    return () => { active = false; };
  }, [summaryConfig]);

  const highlights = liveHighlights || module.highlights;

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <div><p className="dashboard-kicker">EDUNOVAE WORKSPACE</p><h1>{module.title}</h1></div>
        <button className="logout-btn" type="button" onClick={() => { logout(); navigate("/login"); }}>Sign out</button>
      </header>
      <section className="dashboard-content">
        <p>Welcome, {user?.name}.</p>
        <p>{module.summary}</p>
        {loadError && <p className="module-alert">{loadError}</p>}
        <div className="admin-nav-grid">
          {highlights.map((item) => <article className="admin-nav-card" key={item}><h3>{item}</h3><p>{summaryConfig ? "Live data from the shared school database." : "This workspace is being integrated with the shared production API."}</p></article>)}
          <button className="admin-nav-card dashboard-open-hub" type="button" onClick={() => navigate("/home-dashboard")}><h3>All Modules</h3><p>Open the EDUNOVAE unified dashboard.</p></button>
        </div>
      </section>
    </main>
  );
}

export default ModuleDashboard;

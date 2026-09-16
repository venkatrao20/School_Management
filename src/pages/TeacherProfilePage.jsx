import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAssignedClasses } from "../utils/permissions";
import { getAssignmentFor, getStaffProfile } from "../data/teacherAssignments";

function ProfileRow({ label, value }) {
  return (
    <div style={{ display: "flex", padding: "10px 0", borderBottom: "1px solid var(--border, #e5e7eb)" }}>
      <span style={{ width: 200, fontWeight: 600, color: "var(--text-muted, #6b7280)" }}>{label}</span>
      <span>{value || "—"}</span>
    </div>
  );
}

function TeacherProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = getStaffProfile(user?.staffId);
  const assignment = getAssignmentFor(user?.staffId);
  const assignedClasses = getAssignedClasses(user);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Profile</h1>
        <button className="logout-btn" onClick={() => navigate(-1)}>
          Back to Dashboard
        </button>
      </div>

      <div className="dashboard-content">
        <p className="view-only-label" style={{ marginBottom: 16 }}>
          Your staff profile, as set up by Administration. Contact the office to request a
          correction.
        </p>

        <div className="results-panel" style={{ maxWidth: 640 }}>
          <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Personal & Role Details</h3>
          {profile ? (
            <>
              <ProfileRow label="Staff ID" value={profile.staffId} />
              <ProfileRow label="Name" value={`${profile.firstName} ${profile.lastName}`} />
              <ProfileRow label="Email" value={profile.email} />
              <ProfileRow label="Phone" value={profile.phone} />
              <ProfileRow label="Role" value={profile.role} />
              <ProfileRow label="Subject" value={profile.subject} />
              <ProfileRow label="Date of Joining" value={profile.dateOfJoining} />
            </>
          ) : (
            <p className="upload-instructions">No staff record found for this account.</p>
          )}
        </div>

        <div className="results-panel" style={{ maxWidth: 640, marginTop: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", marginTop: 0 }}>Class Allocation</h3>
          <div className="results-summary">
            {assignedClasses.length > 0 ? (
              assignedClasses.map((c) => (
                <span
                  key={c}
                  className={`summary-chip ${
                    assignment?.isClassTeacherOf === c ? "summary-valid" : "summary-total"
                  }`}
                >
                  {c}
                  {assignment?.isClassTeacherOf === c ? " (Class Teacher)" : ""}
                </span>
              ))
            ) : (
              <span className="view-only-label">No classes assigned yet.</span>
            )}
          </div>
          {assignment?.subject && (
            <p className="view-only-label" style={{ marginTop: 12 }}>
              Teaching subject: <strong>{assignment.subject}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherProfilePage;

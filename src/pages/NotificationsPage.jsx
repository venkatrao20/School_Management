import { useEffect, useState } from "react";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function loadNotifications() {
  const response = await fetch("/api/notifications", { headers: authHeaders() });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Notifications are unavailable.");
  return body;
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    let active = true;
    loadNotifications()
      .then((body) => {
        if (!active) return;
        setNotifications(body.data);
        setUnreadCount(body.unreadCount);
        setState({ loading: false, error: "" });
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message });
      });
    return () => {
      active = false;
    };
  }, []);

  const markRead = async (notification) => {
    const endpoint = notification.source === "admin"
      ? `/api/notifications/admin/${notification.id}/read`
      : `/api/notifications/events/${notification.id}/read`;
    const response = await fetch(endpoint, { method: "PATCH", headers: authHeaders() });
    if (!response.ok) return;
    setNotifications((current) => current.map((item) => item === notification ? { ...item, is_read: 1 } : item));
    setUnreadCount((count) => Math.max(0, count - (notification.is_read ? 0 : 1)));
  };

  if (state.loading) return <main className="module-page"><p>Loading notifications...</p></main>;

  return (
    <main className="module-page">
      <header className="module-header">
        <div>
          <p className="module-kicker">Communication / Inbox</p>
          <h1>Notifications</h1>
          <p>Keep important school activity visible in one shared inbox.</p>
        </div>
        <div className="module-stat"><strong>{unreadCount}</strong><span>unread</span></div>
      </header>

      {state.error && <div className="module-alert">{state.error}</div>}
      <section className="module-panel notification-list">
        <div className="module-panel-heading"><h2>Recent activity</h2><span>{notifications.length} messages</span></div>
        {notifications.length === 0 ? <p className="module-empty">You have no notifications.</p> : notifications.map((notification) => (
          <article className={`notification-item ${notification.is_read ? "is-read" : ""}`} key={`${notification.source}-${notification.id}`}>
            <div>
              <div className="notification-meta"><span className="module-badge">{notification.source}</span><time>{new Date(notification.created_at).toLocaleString()}</time></div>
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
            </div>
            {!notification.is_read && <button className="notification-action" type="button" onClick={() => markRead(notification)}>Mark read</button>}
          </article>
        ))}
      </section>
    </main>
  );
}

export default NotificationsPage;

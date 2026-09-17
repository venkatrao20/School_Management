import { useEffect, useState } from "react";
import { getToken } from "../services/authService";

async function loadResource(path) {
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Transport data is unavailable.");
  return body.data;
}

function TransportPage() {
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    let active = true;
    Promise.all([loadResource("/api/transport/vehicles"), loadResource("/api/transport/routes")])
      .then(([vehicleRows, routeRows]) => {
        if (!active) return;
        setVehicles(vehicleRows);
        setRoutes(routeRows);
        setState({ loading: false, error: "" });
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.message });
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) return <main className="module-page"><p>Loading transport data...</p></main>;

  return (
    <main className="module-page">
      <header className="module-header">
        <div>
          <p className="module-kicker">Operations / Transport</p>
          <h1>Transport command</h1>
          <p>Monitor the school fleet and route network from the shared platform.</p>
        </div>
        <div className="module-stat"><strong>{vehicles.length}</strong><span>vehicles</span></div>
        <div className="module-stat"><strong>{routes.length}</strong><span>routes</span></div>
      </header>

      {state.error && <div className="module-alert">{state.error}</div>}

      <section className="module-grid">
        <article className="module-panel">
          <div className="module-panel-heading"><h2>Fleet</h2><span>{vehicles.length} records</span></div>
          {vehicles.length === 0 ? <p className="module-empty">No vehicles have been added yet.</p> : (
            <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Vehicle</th><th>Type</th><th>Status</th><th>Route</th></tr></thead><tbody>
              {vehicles.map((vehicle) => <tr key={vehicle.id}><td><strong>{vehicle.vehicle_number}</strong><small>{vehicle.vehicle_id}</small></td><td>{vehicle.vehicle_type}</td><td><span className="module-badge">{vehicle.status}</span></td><td>{vehicle.route_name || "Unassigned"}</td></tr>)}
            </tbody></table></div>
          )}
        </article>

        <article className="module-panel">
          <div className="module-panel-heading"><h2>Routes</h2><span>{routes.length} records</span></div>
          {routes.length === 0 ? <p className="module-empty">No routes have been added yet.</p> : (
            <div className="module-table-wrap"><table className="module-table"><thead><tr><th>Route</th><th>Stops</th><th>Pickup</th><th>Drop-off</th></tr></thead><tbody>
              {routes.map((route) => <tr key={route.id}><td><strong>{route.route_name}</strong><small>{route.route_id}</small></td><td>{Array.isArray(route.stops) ? route.stops.length : "Configured"}</td><td>{route.pickup_time}</td><td>{route.dropoff_time}</td></tr>)}
            </tbody></table></div>
          )}
        </article>
      </section>
    </main>
  );
}

export default TransportPage;

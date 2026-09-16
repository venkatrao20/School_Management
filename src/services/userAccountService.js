// The password actually checked at login: an admin-set override if one
// exists (set via the Administration & Data module, outside this
// teacher-only build), otherwise the account's original seed password.
// Same mock-persistence pattern as the other services (localStorage now,
// swap for a real backend later).

const KEY = "password_overrides";

function readOverrides() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : {};
}

export function getEffectivePassword(username, defaultPassword) {
  const overrides = readOverrides();
  return overrides[username] ?? defaultPassword;
}

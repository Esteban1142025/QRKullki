// Returns a localStorage key scoped to the given agency ID (e.g. 'MAT', 'SUC1').
// If no agencyId is provided the base key is returned unchanged (fallback-safe).
export const agencyKey = (base, agencyId) =>
  agencyId ? `${base}_${agencyId}` : base;

// Convenience read — returns parsed value or fallback on error/missing.
export const agencyGet = (base, agencyId, fallback = null) => {
  try {
    const raw = localStorage.getItem(agencyKey(base, agencyId));
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// Convenience write — JSON-serialises value.
export const agencySet = (base, agencyId, value) => {
  localStorage.setItem(agencyKey(base, agencyId), JSON.stringify(value));
};

// Convenience remove.
export const agencyRemove = (base, agencyId) => {
  localStorage.removeItem(agencyKey(base, agencyId));
};

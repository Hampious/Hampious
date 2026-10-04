const getBaseURL = () => {
  if (process.env.REACT_APP_BACKEND_URL) return process.env.REACT_APP_BACKEND_URL;
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8000/api";
  }
  return "https://hampious.onrender.com/api";
};

const API_BASE = `${getBaseURL()}/admin`;

export function getToken() {
  return localStorage.getItem('admin_token') || '';
}

function withAuth(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${API_BASE}${path}${sep}token=${encodeURIComponent(getToken())}`;
}

export async function adminGet(path) {
  const res = await fetch(withAuth(path), {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  return res;
}

export async function adminPost(path, body) {
  const res = await fetch(withAuth(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  });
  return res;
}

export async function adminPut(path, body) {
  const res = await fetch(withAuth(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  });
  return res;
}

export async function adminDelete(path) {
  const res = await fetch(withAuth(path), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  return res;
}

export function handleUnauth(res, navigate) {
  // Don't log out if using local token — backend may just be offline
  if (res.status === 401 || res.status === 403) {
    const token = getToken();
    if (token === 'local_admin_token') return false; // local auth — ignore 401
    localStorage.removeItem('admin_token');
    navigate('/admin');
    return true;
  }
  return false;
}

export async function parseError(res) {
  try {
    const d = await res.json();
    if (typeof d.detail === 'string') return d.detail;
    if (Array.isArray(d.detail)) return d.detail.map(e => `${e.loc?.slice(-1)[0]}: ${e.msg}`).join(', ');
    return JSON.stringify(d);
  } catch {
    return `HTTP ${res.status}`;
  }
}

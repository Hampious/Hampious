const API_BASE = 'http://localhost:8000/api/admin';

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
  if (res.status === 401 || res.status === 403) {
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

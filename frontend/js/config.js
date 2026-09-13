// Change this if your backend runs on a different host/port
const API_BASE = 'http://localhost:5000/api';

// Helper: attach the saved JWT token to a fetch request
function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  };
}

// Helper: redirect to login if not authenticated, else return the stored user
function requireAuth(expectedRole) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    window.location.href = 'index.html';
    return null;
  }

  const user = JSON.parse(userStr);
  if (expectedRole && user.role !== expectedRole) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

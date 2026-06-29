// public/js/common.js
// Shared utility functions used across all frontend pages:
// API requests, toast notifications, auth/session helpers, theme toggle.

const API_BASE = '/api';

// ---------- Session helpers ----------
const Auth = {
  getToken: () => localStorage.getItem('lms_token'),
  getUser: () => JSON.parse(localStorage.getItem('lms_user') || 'null'),
  setSession: (user, token) => {
    localStorage.setItem('lms_token', token);
    localStorage.setItem('lms_user', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
  },
  isLoggedIn: () => !!localStorage.getItem('lms_token'),
  logout: () => {
    Auth.clearSession();
    window.location.href = '/';
  },
};

// Redirects to login if not authenticated; redirects to the correct
// dashboard if a user with the wrong role tries to access a page.
function guardPage(requiredRole) {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/';
    return;
  }
  const user = Auth.getUser();
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = user.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
  }
}

// ---------- API request wrapper ----------
async function apiRequest(endpoint, { method = 'GET', body = null, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data;
}

// ---------- Toast notifications ----------
function ensureToastContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'info') {
  const container = ensureToastContainer();
  const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span>${message}</span>
    <span class="toast-close" role="button">✕</span>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ---------- Theme (dark mode) ----------
function initTheme() {
  const saved = localStorage.getItem('lms_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('lms_theme', next);
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

initTheme();

// ---------- Helpers ----------
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Sidebar mobile toggle ----------
function initSidebarToggle() {
  const toggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

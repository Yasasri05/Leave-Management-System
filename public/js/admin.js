// public/js/admin.js
// Logic for the Admin Dashboard: stats, all leave requests with
// search/filter, approve/reject/delete actions, employees list.

document.addEventListener('DOMContentLoaded', () => {
  guardPage('admin');
  initSidebarToggle();

  const user = Auth.getUser();
  document.querySelectorAll('.user-name').forEach((el) => (el.textContent = user.name));
  document.querySelectorAll('.user-role').forEach((el) => (el.textContent = user.role));
  document.querySelectorAll('.user-avatar').forEach((el) => (el.textContent = user.name.charAt(0).toUpperCase()));

  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
    themeBtn.addEventListener('click', toggleTheme);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', Auth.logout);

  initAdminDashboard();
  initFilters();
});

// ========================================================
// DASHBOARD STATS
// ========================================================
async function initAdminDashboard() {
  try {
    const res = await apiRequest('/admin/stats');
    const s = res.data;
    document.getElementById('statEmployees').textContent = s.totalEmployees;
    document.getElementById('statTotalLeaves').textContent = s.totalLeaves;
    document.getElementById('statApproved').textContent = s.approvedLeaves;
    document.getElementById('statRejected').textContent = s.rejectedLeaves;
    document.getElementById('statPending').textContent = s.pendingLeaves;
  } catch (err) {
    showToast(err.message, 'error');
  }

  loadAllLeaves();
}

// ========================================================
// FILTERS
// ========================================================
function initFilters() {
  const employeeFilter = document.getElementById('filterEmployee');
  const typeFilter = document.getElementById('filterType');
  const statusFilter = document.getElementById('filterStatus');
  const startFilter = document.getElementById('filterStartDate');
  const endFilter = document.getElementById('filterEndDate');
  const resetBtn = document.getElementById('resetFiltersBtn');

  let debounce;
  if (employeeFilter) {
    employeeFilter.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(loadAllLeaves, 400);
    });
  }
  [typeFilter, statusFilter, startFilter, endFilter].forEach((el) => {
    if (el) el.addEventListener('change', loadAllLeaves);
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (employeeFilter) employeeFilter.value = '';
      if (typeFilter) typeFilter.value = '';
      if (statusFilter) statusFilter.value = '';
      if (startFilter) startFilter.value = '';
      if (endFilter) endFilter.value = '';
      loadAllLeaves();
    });
  }
}

function buildQueryString() {
  const params = new URLSearchParams();
  const employee = document.getElementById('filterEmployee')?.value.trim();
  const leaveType = document.getElementById('filterType')?.value;
  const status = document.getElementById('filterStatus')?.value;
  const startDate = document.getElementById('filterStartDate')?.value;
  const endDate = document.getElementById('filterEndDate')?.value;

  if (employee) params.append('employee', employee);
  if (leaveType) params.append('leaveType', leaveType);
  if (status) params.append('status', status);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return params.toString();
}

// ========================================================
// LOAD & RENDER ALL LEAVES
// ========================================================
async function loadAllLeaves() {
  const tbody = document.getElementById('leavesTableBody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8"><div class="loading-wrap"><div class="spinner"></div>Loading leave requests...</div></td></tr>`;

  try {
    const qs = buildQueryString();
    const res = await apiRequest(`/admin/leaves${qs ? '?' + qs : ''}`);
    const leaves = res.data;

    document.getElementById('resultCount').textContent = `${res.count} result(s)`;

    if (!leaves.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="icon">🗂️</div>No leave requests match your filters</div></td></tr>`;
      return;
    }

    tbody.innerHTML = leaves.map(renderAdminRow).join('');
  } catch (err) {
    showToast(err.message, 'error');
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">Failed to load leave requests</div></td></tr>`;
  }
}

function renderAdminRow(leave) {
  const actions =
    leave.status === 'Pending'
      ? `
      <button class="icon-btn approve" title="Approve" onclick="updateLeaveStatus('${leave._id}', 'approve')">✓</button>
      <button class="icon-btn reject" title="Reject" onclick="updateLeaveStatus('${leave._id}', 'reject')">✕</button>
      <button class="icon-btn delete" title="Delete" onclick="deleteLeaveRequest('${leave._id}')">🗑</button>`
      : `<button class="icon-btn delete" title="Delete" onclick="deleteLeaveRequest('${leave._id}')">🗑</button>`;

  return `
    <tr>
      <td>
        <strong>${escapeHtml(leave.employeeName)}</strong><br>
        <span style="color:var(--color-ink-soft);font-size:12px;">${escapeHtml(leave.employeeId)}</span>
      </td>
      <td><span class="badge type-badge">${leave.leaveType}</span></td>
      <td>${formatDate(leave.startDate)} → ${formatDate(leave.endDate)}</td>
      <td>${leave.totalDays}</td>
      <td title="${escapeHtml(leave.reason)}">${escapeHtml(leave.reasonSummary || leave.reason)}</td>
      <td><span class="badge status-${leave.status}">${leave.status}</span>${leave.autoApproved ? ' 🤖' : ''}</td>
      <td>${leave.reviewedBy || '—'}</td>
      <td><div class="action-icons">${actions}</div></td>
    </tr>`;
}

// ========================================================
// ACTIONS: Approve / Reject / Delete
// ========================================================
async function updateLeaveStatus(id, action) {
  const verb = action === 'approve' ? 'approve' : 'reject';
  if (!confirm(`Are you sure you want to ${verb} this leave request?`)) return;

  try {
    const res = await apiRequest(`/admin/leaves/${id}/${action}`, { method: 'PUT' });
    showToast(res.message, 'success');
    loadAllLeaves();
    initAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteLeaveRequest(id) {
  if (!confirm('Permanently delete this leave request? This cannot be undone.')) return;

  try {
    const res = await apiRequest(`/admin/leaves/${id}`, { method: 'DELETE' });
    showToast(res.message, 'success');
    loadAllLeaves();
    initAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

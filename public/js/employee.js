// public/js/employee.js
// Logic for: Employee Dashboard, Apply Leave form (with AI helpers),
// and Leave History page (cancel pending leave).

document.addEventListener('DOMContentLoaded', () => {
  guardPage('employee');
  initSidebarToggle();

  const user = Auth.getUser();
  renderUserChip(user);

  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
    themeBtn.addEventListener('click', toggleTheme);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', Auth.logout);

  // Page-specific initializers
  if (document.getElementById('dashboardStats')) initDashboard();
  if (document.getElementById('applyLeaveForm')) initApplyLeaveForm();
  if (document.getElementById('historyTableBody')) initLeaveHistory();
});

function renderUserChip(user) {
  document.querySelectorAll('.user-name').forEach((el) => (el.textContent = user.name));
  document.querySelectorAll('.user-role').forEach((el) => (el.textContent = user.role));
  document.querySelectorAll('.user-avatar').forEach((el) => (el.textContent = user.name.charAt(0).toUpperCase()));
  document.querySelectorAll('.user-empid').forEach((el) => (el.textContent = user.employeeId));
}

// ========================================================
// EMPLOYEE DASHBOARD
// ========================================================
async function initDashboard() {
  try {
    const res = await apiRequest('/leaves/my');
    const { stats, leaveBalance, data } = res;

    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statPending').textContent = stats.pending;
    document.getElementById('statApproved').textContent = stats.approved;
    document.getElementById('statRejected').textContent = stats.rejected;

    // Leave balance chips
    const balanceGrid = document.getElementById('balanceGrid');
    if (balanceGrid && leaveBalance) {
      balanceGrid.innerHTML = Object.entries(leaveBalance)
        .map(
          ([type, count]) => `
          <div class="balance-chip">
            <div class="num">${count}</div>
            <div class="lbl">${type}</div>
          </div>`
        )
        .join('');
    }

    // Recent leaves (latest 5)
    const recentBody = document.getElementById('recentLeavesBody');
    if (recentBody) {
      const recent = data.slice(0, 5);
      recentBody.innerHTML = recent.length
        ? recent.map(renderLeaveRow).join('')
        : `<tr><td colspan="6"><div class="empty-state"><div class="icon">🗂️</div>No leave requests yet</div></td></tr>`;
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderLeaveRow(leave) {
  return `
    <tr>
      <td><span class="badge type-badge">${leave.leaveType}</span></td>
      <td>${formatDate(leave.startDate)} → ${formatDate(leave.endDate)}</td>
      <td>${leave.totalDays} day(s)</td>
      <td title="${escapeHtml(leave.reason)}">${escapeHtml(leave.reasonSummary || leave.reason)}</td>
      <td><span class="badge status-${leave.status}">${leave.status}</span></td>
      <td>${leave.autoApproved ? '🤖 Auto' : (leave.reviewedBy || '—')}</td>
    </tr>`;
}

// ========================================================
// APPLY LEAVE FORM
// ========================================================
function initApplyLeaveForm() {
  const form = document.getElementById('applyLeaveForm');
  const reasonInput = document.getElementById('reason');
  const leaveTypeSelect = document.getElementById('leaveType');
  const aiBox = document.getElementById('aiSuggestionBox');
  const autoApproveNote = document.getElementById('autoApproveNote');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');

  // Pre-fill employee info (read-only display)
  const user = Auth.getUser();
  document.getElementById('employeeIdDisplay').value = user.employeeId;
  document.getElementById('employeeNameDisplay').value = user.name;

  // Prevent past dates
  const today = new Date().toISOString().split('T')[0];
  startDateInput.min = today;
  endDateInput.min = today;

  let debounceTimer;
  let lastSuggestion = null;

  // ---- AI Leave Type Suggestion (debounced, as user types the reason) ----
  reasonInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const text = reasonInput.value.trim();
    if (text.length < 8) {
      aiBox.classList.remove('show');
      return;
    }
    debounceTimer = setTimeout(async () => {
      try {
        const res = await apiRequest('/leaves/ai/suggest-type', {
          method: 'POST',
          body: { reason: text },
        });
        lastSuggestion = res.suggestion;
        document.getElementById('aiSuggestionText').textContent =
          `AI suggests: "${res.suggestion} Leave" based on your reason`;
        aiBox.classList.add('show');
      } catch (err) {
        /* fail silently for AI suggestion */
      }
    }, 500);
  });

  document.getElementById('applySuggestionBtn').addEventListener('click', () => {
    if (lastSuggestion) {
      leaveTypeSelect.value = lastSuggestion;
      aiBox.classList.remove('show');
      showToast(`Leave type set to ${lastSuggestion}`, 'info');
    }
  });

  // ---- AI Auto-Approval preview (1-2 days) ----
  function checkAutoApprovePreview() {
    const start = startDateInput.value;
    const end = endDateInput.value;
    if (!start || !end) { autoApproveNote.classList.remove('show'); return; }

    const days = Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
    if (days >= 1 && days <= 2 && days > 0) {
      autoApproveNote.textContent = `✓ This ${days}-day leave qualifies for instant AI auto-approval.`;
      autoApproveNote.classList.add('show');
    } else {
      autoApproveNote.classList.remove('show');
    }
  }
  startDateInput.addEventListener('change', checkAutoApprovePreview);
  endDateInput.addEventListener('change', checkAutoApprovePreview);

  // ---- Form submission ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const reason = reasonInput.value.trim();
    const leaveType = leaveTypeSelect.value;

    if (new Date(startDate) > new Date(endDate)) {
      showToast('Start date cannot be after end date', 'error');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm" style="margin:0;"></span> Submitting...';

    try {
      const res = await apiRequest('/leaves', {
        method: 'POST',
        body: {
          employeeId: user.employeeId,
          employeeName: user.name,
          leaveType,
          startDate,
          endDate,
          reason,
        },
      });

      showToast(res.message, 'success');
      form.reset();
      aiBox.classList.remove('show');
      autoApproveNote.classList.remove('show');

      setTimeout(() => (window.location.href = '/leave-history'), 1200);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Submit Leave Request';
    }
  });
}

// ========================================================
// LEAVE HISTORY
// ========================================================
async function initLeaveHistory() {
  await loadHistory();

  const filterStatus = document.getElementById('filterStatus');
  if (filterStatus) {
    filterStatus.addEventListener('change', () => loadHistory(filterStatus.value));
  }
}

let allLeaves = [];

async function loadHistory(statusFilter = '') {
  const tbody = document.getElementById('historyTableBody');
  tbody.innerHTML = `<tr><td colspan="7"><div class="loading-wrap"><div class="spinner"></div>Loading your leave history...</div></td></tr>`;

  try {
    const res = await apiRequest('/leaves/my');
    allLeaves = res.data;

    const filtered = statusFilter ? allLeaves.filter((l) => l.status === statusFilter) : allLeaves;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">🗂️</div>No leave requests found</div></td></tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map(
        (leave) => `
      <tr>
        <td><span class="badge type-badge">${leave.leaveType}</span></td>
        <td>${formatDate(leave.startDate)} → ${formatDate(leave.endDate)}</td>
        <td>${leave.totalDays}</td>
        <td title="${escapeHtml(leave.reason)}">${escapeHtml(leave.reasonSummary || leave.reason)}</td>
        <td><span class="badge status-${leave.status}">${leave.status}</span></td>
        <td>${leave.autoApproved ? '🤖 Auto' : (leave.reviewedBy || '—')}</td>
        <td>
          ${
            leave.status === 'Pending'
              ? `<button class="btn btn-sm btn-danger" onclick="cancelLeaveRequest('${leave._id}')">Cancel</button>`
              : '—'
          }
        </td>
      </tr>`
      )
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">Failed to load leave history</div></td></tr>`;
  }
}

async function cancelLeaveRequest(id) {
  if (!confirm('Are you sure you want to cancel this leave request?')) return;
  try {
    const res = await apiRequest(`/leaves/${id}/cancel`, { method: 'DELETE' });
    showToast(res.message, 'success');
    loadHistory();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

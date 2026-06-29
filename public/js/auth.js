// public/js/auth.js
// Handles login form and registration form submission + role toggle

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect straight to the right dashboard
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    window.location.href = user.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // ---------------- LOGIN ----------------
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner spinner-sm" style="margin:0;"></span> Logging in...';

      try {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: { email, password },
          auth: false,
        });

        Auth.setSession(res.data, res.data.token);
        showToast(`Welcome back, ${res.data.name}!`, 'success');

        setTimeout(() => {
          window.location.href = res.data.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
        }, 600);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Login';
      }
    });
  }

  // ---------------- REGISTER ----------------
  if (registerForm) {
    let selectedRole = 'employee';

    const roleButtons = document.querySelectorAll('.role-toggle button');
    roleButtons.forEach((b) => {
      b.addEventListener('click', () => {
        roleButtons.forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        selectedRole = b.dataset.role;
      });
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector('button[type="submit"]');

      const payload = {
        employeeId: document.getElementById('employeeId').value.trim(),
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        department: document.getElementById('department').value.trim(),
        role: selectedRole,
      };

      const confirmPassword = document.getElementById('confirmPassword').value;
      if (payload.password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      if (payload.password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner spinner-sm" style="margin:0;"></span> Creating account...';

      try {
        const res = await apiRequest('/auth/register', {
          method: 'POST',
          body: payload,
          auth: false,
        });

        Auth.setSession(res.data, res.data.token);
        showToast('Account created successfully!', 'success');

        setTimeout(() => {
          window.location.href = res.data.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
        }, 600);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
      }
    });
  }
});

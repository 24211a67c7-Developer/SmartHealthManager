// If already logged in, skip straight to the right dashboard
(function redirectIfLoggedIn() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user) goToDashboard(user.role);
})();

function goToDashboard(role) {
  if (role === 'patient') window.location.href = 'patient.html';
  else if (role === 'doctor') window.location.href = 'doctor.html';
  else if (role === 'owner') window.location.href = 'owner.html';
}

function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
}

function toggleRoleFields() {
  const role = document.querySelector('input[name="regRole"]:checked').value;
  document.getElementById('patientFields').classList.toggle('hidden', role !== 'patient');
  document.getElementById('doctorFields').classList.toggle('hidden', role !== 'doctor');
}

// ---------------- LOGIN ----------------
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const role = document.querySelector('input[name="loginRole"]:checked').value;
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const msgEl = document.getElementById('loginMsg');

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();

    if (!res.ok) {
      msgEl.textContent = data.message;
      msgEl.className = 'msg error';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    goToDashboard(data.user.role);
  } catch (err) {
    msgEl.textContent = 'Could not reach the server. Is the backend running?';
    msgEl.className = 'msg error';
  }
});

// ---------------- REGISTER ----------------
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const role = document.querySelector('input[name="regRole"]:checked').value;
  const msgEl = document.getElementById('registerMsg');

  const payload = {
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value,
    role
  };

  if (role === 'patient') {
    payload.age = document.getElementById('regAge').value;
    payload.healthIssue = document.getElementById('regHealthIssue').value;
    payload.symptoms = document.getElementById('regSymptoms').value;
  } else if (role === 'doctor') {
    payload.specialty = document.getElementById('regSpecialty').value;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      msgEl.textContent = data.message;
      msgEl.className = 'msg error';
      return;
    }

    msgEl.textContent = 'Registered successfully! You can log in now.';
    msgEl.className = 'msg success';
    document.getElementById('registerForm').reset();
    setTimeout(() => switchTab('login'), 1200);
  } catch (err) {
    msgEl.textContent = 'Could not reach the server. Is the backend running?';
    msgEl.className = 'msg error';
  }
});

const user = requireAuth('patient');
if (user) document.getElementById('patientName').textContent = user.name;

// ---------------- Load doctors for chosen specialty ----------------
async function loadDoctors() {
  const specialty = document.getElementById('specialtySelect').value;
  const doctorSelect = document.getElementById('doctorSelect');
  doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
  if (!specialty) return;

  try {
    const res = await fetch(`${API_BASE}/patients/doctors?specialty=${encodeURIComponent(specialty)}`, {
      headers: authHeaders()
    });
    const doctors = await res.json();

    doctors.forEach((doc) => {
      const opt = document.createElement('option');
      opt.value = doc._id;
      opt.textContent = `${doc.name} ${doc.isAvailable ? '' : '(Busy)'}`;
      doctorSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load doctors', err);
  }
}

// ---------------- Book appointment ----------------
document.getElementById('bookForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('bookMsg');

  const payload = {
    doctorId: document.getElementById('doctorSelect').value,
    specialty: document.getElementById('specialtySelect').value,
    symptoms: document.getElementById('symptomsInput').value,
    healthIssue: document.getElementById('healthIssueInput').value,
    preferredDate: document.getElementById('preferredDate').value
  };

  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      msgEl.textContent = data.message;
      msgEl.className = 'msg error';
      return;
    }

    msgEl.textContent = 'Appointment booked successfully!';
    msgEl.className = 'msg success';
    document.getElementById('bookForm').reset();
    loadAppointments();
  } catch (err) {
    msgEl.textContent = 'Could not reach the server.';
    msgEl.className = 'msg error';
  }
});

// ---------------- Load appointments ----------------
async function loadAppointments() {
  try {
    const res = await fetch(`${API_BASE}/appointments/my`, { headers: authHeaders() });
    const appointments = await res.json();
    const body = document.getElementById('appointmentsBody');
    body.innerHTML = '';

    appointments.forEach((a) => {
      body.innerHTML += `
        <tr>
          <td>${a.doctor?.name || 'N/A'}</td>
          <td>${a.specialty}</td>
          <td>${a.symptoms}</td>
          <td><span class="badge ${a.status}">${a.status}</span></td>
        </tr>`;
    });
  } catch (err) {
    console.error('Failed to load appointments', err);
  }
}

// ---------------- Load reports ----------------
async function loadReports() {
  try {
    const res = await fetch(`${API_BASE}/patients/my-reports`, { headers: authHeaders() });
    const reports = await res.json();
    const body = document.getElementById('reportsBody');
    body.innerHTML = '';

    reports.forEach((r) => {
      const meds = r.medicines.map((m) => `${m.name} (${m.dosage}, ${m.timesPerDay}x/day for ${m.durationDays}d)`).join('<br>');
      body.innerHTML += `
        <tr>
          <td>${r.doctor?.name || 'N/A'}</td>
          <td>${r.diagnosis}</td>
          <td>${meds || '-'}</td>
          <td><span class="badge ${r.pharmacyStatus === 'dispensed' ? 'completed' : 'pending'}">${r.pharmacyStatus}</span></td>
          <td>${new Date(r.createdAt).toLocaleDateString()}</td>
        </tr>`;
    });
  } catch (err) {
    console.error('Failed to load reports', err);
  }
}

loadAppointments();
loadReports();

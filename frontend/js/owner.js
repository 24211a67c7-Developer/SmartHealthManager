const user = requireAuth('owner');
if (user) document.getElementById('ownerName').textContent = user.name;

async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/owner/dashboard`, { headers: authHeaders() });
    const stats = await res.json();
    document.getElementById('statPatients').textContent = stats.totalPatients;
    document.getElementById('statDoctors').textContent = stats.totalDoctors;
    document.getElementById('statAppointments').textContent = stats.totalAppointments;
    document.getElementById('statReports').textContent = stats.totalReports;
  } catch (err) {
    console.error('Failed to load dashboard stats', err);
  }
}

async function loadDoctors() {
  try {
    const res = await fetch(`${API_BASE}/owner/doctors`, { headers: authHeaders() });
    const doctors = await res.json();
    const body = document.getElementById('doctorsBody');
    body.innerHTML = '';

    doctors.forEach((d) => {
      const actionBtn = d.isActive
        ? `<button class="btn-sm btn-remove" onclick="removeDoctor('${d._id}')">Remove</button>`
        : `<button class="btn-sm btn-accept" onclick="reinstateDoctor('${d._id}')">Reinstate</button>`;

      body.innerHTML += `
        <tr>
          <td>${d.name}</td>
          <td>${d.specialty}</td>
          <td><span class="badge ${d.isActive ? 'completed' : 'cancelled'}">${d.isActive ? 'Active' : 'Removed'}</span></td>
          <td>${actionBtn}</td>
        </tr>`;
    });
  } catch (err) {
    console.error('Failed to load doctors', err);
  }
}

async function removeDoctor(id) {
  if (!confirm('Remove this doctor from the system?')) return;
  await fetch(`${API_BASE}/owner/doctors/${id}/remove`, { method: 'PUT', headers: authHeaders() });
  loadDoctors();
  loadDashboard();
}

async function reinstateDoctor(id) {
  await fetch(`${API_BASE}/owner/doctors/${id}/reinstate`, { method: 'PUT', headers: authHeaders() });
  loadDoctors();
  loadDashboard();
}

async function loadPatients() {
  try {
    const res = await fetch(`${API_BASE}/owner/patients`, { headers: authHeaders() });
    const patients = await res.json();
    const body = document.getElementById('patientsBody');
    body.innerHTML = '';

    patients.forEach((p) => {
      body.innerHTML += `
        <tr>
          <td>${p.name}</td>
          <td>${p.age || '-'}</td>
          <td>${p.healthIssue || '-'}</td>
        </tr>`;
    });
  } catch (err) {
    console.error('Failed to load patients', err);
  }
}

async function loadAppointments() {
  try {
    const res = await fetch(`${API_BASE}/owner/appointments`, { headers: authHeaders() });
    const appointments = await res.json();
    const body = document.getElementById('appointmentsBody');
    body.innerHTML = '';

    appointments.forEach((a) => {
      body.innerHTML += `
        <tr>
          <td>${a.patient?.name || 'N/A'}</td>
          <td>${a.doctor?.name || 'N/A'}</td>
          <td>${a.specialty}</td>
          <td><span class="badge ${a.status}">${a.status}</span></td>
        </tr>`;
    });
  } catch (err) {
    console.error('Failed to load appointments', err);
  }
}

async function loadPharmacyQueue() {
  try {
    const res = await fetch(`${API_BASE}/reports/pharmacy/pending`, { headers: authHeaders() });
    const reports = await res.json();
    const body = document.getElementById('pharmacyBody');
    body.innerHTML = '';

    reports.forEach((r) => {
      const meds = r.medicines.map((m) => `${m.name} (${m.dosage})`).join(', ');
      body.innerHTML += `
        <tr>
          <td>${r.patient?.name || 'N/A'}</td>
          <td>${r.doctor?.name || 'N/A'}</td>
          <td>${meds || '-'}</td>
          <td><button class="btn-sm btn-complete" onclick="dispense('${r._id}')">Mark Dispensed</button></td>
        </tr>`;
    });
  } catch (err) {
    console.error('Failed to load pharmacy queue', err);
  }
}

async function dispense(reportId) {
  await fetch(`${API_BASE}/reports/${reportId}/dispense`, { method: 'PUT', headers: authHeaders() });
  loadPharmacyQueue();
}

loadDashboard();
loadDoctors();
loadPatients();
loadAppointments();
loadPharmacyQueue();

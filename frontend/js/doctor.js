const user = requireAuth('doctor');
if (user) document.getElementById('doctorName').textContent = `${user.name} (${user.specialty})`;

// ---------------- Load assigned cases ----------------
async function loadCases() {
  try {
    const res = await fetch(`${API_BASE}/appointments/doctor`, { headers: authHeaders() });
    const cases = await res.json();
    const body = document.getElementById('casesBody');
    body.innerHTML = '';

    cases.forEach((c) => {
      const actions = [];
      if (c.status === 'pending') {
        actions.push(`<button class="btn-sm btn-accept" onclick="acceptCase('${c._id}')">Accept</button>`);
      }
      if (c.status !== 'completed') {
        actions.push(`<button class="btn-sm btn-reassign" onclick="openReassign('${c._id}')">Reassign</button>`);
        actions.push(`<button class="btn-sm btn-complete" onclick="openReport('${c._id}')">Add Report</button>`);
      }

      body.innerHTML += `
        <tr>
          <td>${c.patient?.name || 'N/A'}</td>
          <td>${c.patient?.age || '-'}</td>
          <td>${c.symptoms}</td>
          <td><span class="badge ${c.status}">${c.status}</span></td>
          <td>${actions.join('')}</td>
        </tr>`;
    });
  } catch (err) {
    console.error('Failed to load cases', err);
  }
}

// ---------------- Accept a case ----------------
async function acceptCase(id) {
  await fetch(`${API_BASE}/appointments/${id}/accept`, { method: 'PUT', headers: authHeaders() });
  loadCases();
}

// ---------------- Toggle availability ----------------
async function toggleAvailability() {
  const res = await fetch(`${API_BASE}/appointments/toggle-availability`, { method: 'PUT', headers: authHeaders() });
  const data = await res.json();
  alert(`You are now marked as ${data.isAvailable ? 'Available' : 'Busy'}`);
}

// ---------------- Reassign flow ----------------
async function openReassign(appointmentId) {
  document.getElementById('reassignAppointmentId').value = appointmentId;
  document.getElementById('reassignPanel').classList.remove('hidden');
  document.getElementById('reportPanel').classList.add('hidden');

  const select = document.getElementById('reassignDoctorSelect');
  select.innerHTML = '<option value="">Select doctor</option>';

  const res = await fetch(`${API_BASE}/patients/doctors?specialty=${encodeURIComponent(user.specialty)}`, {
    headers: authHeaders()
  });
  const doctors = await res.json();
  doctors
    .filter((d) => d._id !== user.id)
    .forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d._id;
      opt.textContent = `${d.name} ${d.isAvailable ? '(Available)' : '(Busy)'}`;
      select.appendChild(opt);
    });
}

function closeReassign() {
  document.getElementById('reassignPanel').classList.add('hidden');
}

async function submitReassign() {
  const appointmentId = document.getElementById('reassignAppointmentId').value;
  const newDoctorId = document.getElementById('reassignDoctorSelect').value;
  const reason = document.getElementById('reassignReason').value;

  if (!newDoctorId) return alert('Please select a doctor to reassign to.');

  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/reassign`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ newDoctorId, reason })
  });

  if (res.ok) {
    alert('Case reassigned successfully.');
    closeReassign();
    loadCases();
  } else {
    const data = await res.json();
    alert(data.message);
  }
}

// ---------------- Medical report flow ----------------
let medicineCount = 0;

function openReport(appointmentId) {
  document.getElementById('reportAppointmentId').value = appointmentId;
  document.getElementById('reportPanel').classList.remove('hidden');
  document.getElementById('reassignPanel').classList.add('hidden');
  document.getElementById('medicineList').innerHTML = '';
  medicineCount = 0;
  addMedicineRow(); // start with one row
}

function closeReport() {
  document.getElementById('reportPanel').classList.add('hidden');
}

function addMedicineRow() {
  medicineCount++;
  const row = document.createElement('div');
  row.className = 'medicine-row';
  row.id = `medRow${medicineCount}`;
  row.innerHTML = `
    <input type="text" placeholder="Medicine name" class="med-name" />
    <input type="text" placeholder="Dosage (e.g. 500mg)" class="med-dosage" />
    <input type="number" placeholder="Times/day" class="med-times" min="1" />
    <input type="number" placeholder="Duration (days)" class="med-duration" min="1" />
    <input type="text" placeholder="Instructions (e.g. after food)" class="med-instructions" />
    <button type="button" class="btn-sm btn-remove" onclick="document.getElementById('medRow${medicineCount}').remove()">✕</button>
  `;
  document.getElementById('medicineList').appendChild(row);
}

async function submitReport() {
  const appointmentId = document.getElementById('reportAppointmentId').value;
  const diagnosis = document.getElementById('reportDiagnosis').value;
  const notes = document.getElementById('reportNotes').value;
  const msgEl = document.getElementById('reportMsg');

  if (!diagnosis) {
    msgEl.textContent = 'Diagnosis is required.';
    msgEl.className = 'msg error';
    return;
  }

  const medicines = [];
  document.querySelectorAll('.medicine-row').forEach((row) => {
    const name = row.querySelector('.med-name').value;
    const dosage = row.querySelector('.med-dosage').value;
    const timesPerDay = parseInt(row.querySelector('.med-times').value) || 1;
    const durationDays = parseInt(row.querySelector('.med-duration').value) || 1;
    const instructions = row.querySelector('.med-instructions').value;

    if (name) {
      // Auto-generate simple even-spaced timings across the day based on timesPerDay
      const timings = generateTimings(timesPerDay);
      medicines.push({ name, dosage, timesPerDay, durationDays, instructions, timings });
    }
  });

  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ appointmentId, diagnosis, notes, medicines })
  });

  const data = await res.json();

  if (!res.ok) {
    msgEl.textContent = data.message;
    msgEl.className = 'msg error';
    return;
  }

  msgEl.textContent = 'Report submitted and sent to pharmacy!';
  msgEl.className = 'msg success';
  setTimeout(() => {
    closeReport();
    loadCases();
  }, 1000);
}

// Spreads doses evenly through waking hours (8 AM - 10 PM) as a simple default schedule
function generateTimings(timesPerDay) {
  const startHour = 8;
  const endHour = 22;
  const timings = [];
  if (timesPerDay <= 1) return ['08:00 AM'];

  const interval = (endHour - startHour) / (timesPerDay - 1);
  for (let i = 0; i < timesPerDay; i++) {
    let hour = Math.round(startHour + interval * i);
    const period = hour >= 12 ? 'PM' : 'AM';
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    timings.push(`${displayHour}:00 ${period}`);
  }
  return timings;
}

loadCases();

Healthcare Management System
Full-stack app: patient, doctor, and owner roles, appointment booking with
doctor reassignment, medical reports with medicine schedules, and a
pharmacy queue.
Structure
```
healthcare-app/
├── backend/          Node.js + Express + MongoDB Atlas (Mongoose)
└── frontend/          Plain HTML/CSS/JS
```
1. Backend setup
```bash
cd backend
npm install
```
Create a `.env` file (copy `.env.example`) and fill in:
`MONGO_URI` — your MongoDB Atlas connection string
(Atlas dashboard → Connect → Drivers → copy the string, replace
`<username>`/`<password>`, and add your app's DB name before the `?`)
`JWT_SECRET` — any long random string
`PORT` — defaults to 5000
Then start the server:
```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start
```
You should see:
```
✅ Connected to MongoDB Atlas
🚀 Server running on http://localhost:5000
```
Important — MongoDB Atlas Network Access: in Atlas, go to
Network Access and add your current IP (or `0.0.0.0/0` for testing)
or the connection will time out.
2. Frontend setup
No build step — it's plain HTML/CSS/JS. Just open `frontend/index.html`
in a browser, or serve it (recommended, avoids CORS/file:// quirks):
```bash
cd frontend
npx serve .
# or use the VS Code "Live Server" extension
```
If your backend runs on a different port/host, update `API_BASE` in
`frontend/js/config.js`.
3. How the pieces connect
`frontend/js/config.js` holds `API_BASE` and the JWT auth helpers.
On login, the backend returns a JWT + user object; the frontend saves
both in `localStorage` and sends the token as `Authorization: Bearer <token>`
on every subsequent request.
`backend/middleware/auth.js` verifies that token and enforces role
access (`protect` + `allowRoles`).
4. Flow overview
index.html — Register/login as patient, doctor, or owner.
Doctors must pick a specialty at registration.
patient.html — Book an appointment (pick specialty → doctor),
view appointment status, view medical reports once a doctor writes one.
doctor.html — View assigned cases, accept them, reassign to
another doctor of the same specialty if busy, toggle own availability,
and submit a medical report (diagnosis + medicines with dosage/timing)
once a case is done — this automatically lands in the pharmacy queue.
owner.html — Dashboard stats, manage (remove/reinstate) doctors,
view all patients/appointments, and mark pharmacy items as dispensed.
5. Extending it further
Add password-reset / email verification
Add pagination for large patient/doctor lists
Add real-time updates (Socket.io) so doctors see new bookings instantly
Add a proper pharmacy inventory/stock model tied to `Medicine`
Deploy backend (Render/Railway) and frontend (Netlify/Vercel) separately,
then update `API_BASE` accordingly

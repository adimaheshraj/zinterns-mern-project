# Fix: 400 Bad Request on Login

## ✅ Completed Steps

1. **✅ Diagnosed the root cause** — The `data/user.json` fallback file was empty (`[]`), meaning no users existed in storage. MongoDB was available, but the seed had never been run to populate it.

2. **✅ Executed database seeding** — Ran `node backend/seed.js` which successfully:
   - Connected to MongoDB at `mongodb://localhost:27017/zinterns`
   - Created all test accounts: admin, manager, mentor, mentor2, intern, intern2, intern3
   - Populated departments, attendance history, tasks, leaves, holidays, announcements, reports, and files

3. **✅ Verified backend server** — Backend is running on `http://localhost:5000` with all APIs functional

4. **✅ Verified login API** — Tested successfully:
   - `POST /api/auth/login` with admin/ZInt@admin → returns token + user data
   - `POST /api/auth/login` with intern/ZInt@intern → returns token + user data
   - `GET /api/auth/me` with valid token → returns user profile

5. **✅ Started frontend dev server** — Vite dev server is running on `http://localhost:5173`

## Test Accounts Available

| Username | Password       | Role   | Employee ID |
|----------|----------------|--------|-------------|
| admin    | ZInt@admin     | HR     | SB-0001     |
| syed824   | 1234567890@M   | RM     | RM-101      |
| mentor   | ZInt@mentor    | Mentor | MEN-201     |
| intern   | ZInt@intern    | Intern | INT-1001    |


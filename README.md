# BPMN Real-Time Collaboration Challenge

Minimal real-time BPMN editor built with NestJS (WebSocket gateway) and Next.js + bpmn.io (`bpmn-js`).

## What it does
- Renders and edits BPMN diagrams in the browser.
- Syncs diagram changes live between all connected clients via Socket.IO.
- Shows an online user count.
- Stores the current diagram in memory on the server (no database).
- Bonus (not implemented): element lock/marker while another user edits.

## Quick start
Prerequisites: Node 20+, npm.

### Backend (NestJS)
```bash
cd backend
npm install
PORT=4000 npm run start:dev
```

### Frontend (Next.js)
```bash
cd frontend
npm install
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000 npm run dev
# open http://localhost:3000
```

## Notes & limitations
- Diagram state is held in-memory; restarting the backend resets it.
- No authentication.
- Element locking UI is not wired; backend lock handlers are stubbed out.
- If you change the backend port or host, update `NEXT_PUBLIC_SOCKET_URL` accordingly.

# SAINT // COLD STEEL HOSTING

> **"Hosting your bots is the primary infrastructure engine; creating them with AI is a side gig."**  
> — *Saint (`sa1nt.xyz`)*

A production-ready, highly secure, minimalist web application framework engineered for community bot hosting. Built with an aggressive cyber-ops tactical developer aesthetic, Proxmox VE hypervisor simulation, dense 5-bot Docker container packing, strict port reservation guards, token bucket rate limiters, input sanitization, and HTTP-only JWT admin verification.

---

## 1. Brand Identity & Visual Specs

- **Persona:** "Saint" (`sa1nt.xyz`) — Tech bird, infrastructure engineer, self-hosting enthusiast, automated sysadmin.
- **Aesthetic:** Cyber-ops tactical dashboard meets high-end developer terminal.
- **Color Palette:**
  - Pitch Black: `#000000`
  - Charcoal Panels: `#080808` / `#0e0e0e` / `#141414`
  - Neon Crimson Accents: `#FF0000`
  - Subdued Blood Red: `#590000` / `#990000`
  - Silver & Stark White: `#D4D4D8` / `#FFFFFF`
- **UI Architecture:** Hard edges (`rounded-none`), thin 1px pixel-borders, subtle glowing box-shadows (`box-shadow: 0 0 15px rgba(255, 0, 0, 0.35)`), custom pitch-black/crimson scrollbar.

---

## 2. Ports & Security Hardening

### Strict Port Constraints
Local server environments **MUST NOT** bind to ports `8080`, `8081`, `8082`, `8083`, or `8084` under any circumstances (strictly reserved for active infrastructure nodes).
- **Frontend Port:** `3000` (Vite dev server)
- **Backend Port:** `5000` (Express + TypeScript API)
- *Runtime Guard:* `server/src/config.ts` will immediately terminate the process with exit code `1` if any configuration attempts to bind within the forbidden port range.

### Security Defenses
- **Rate Limiting:** Token-bucket rate limiter enforcing max **5 requests per minute** on code/form submissions (`/api/deploy`, `/api/blueprint`, `/api/contact`).
- **Input Sanitization:** Deep-clean sanitization preventing Command Injection and XSS:
  - Strict regex validation for public GitHub URLs (`https://github.com/owner/repo`).
  - Command payload stripping, disallowing shell execution meta-characters (`;`, `&&`, `|`, `` ` ``, `$()`, null bytes).
- **Admin Verification Gate:** Protected by JSON Web Tokens stored in **HTTP-only, SameSite cookies** (`saint_admin_token`), keeping the admin control panel completely inaccessible to unauthorized visitors.

---

## 3. Deep Component & Page Implementations

### Page A: The Landing / Node Status Hub (Home)
- **Hero Section:** Bold typographical introduction: `"SAINT // COLD STEEL HOSTING"`.
- **"Why I Do This" Column:** Philosophy of zero renewal traps and transparent community bot hosting.
- **Cluster Metrics & Proxmox Telemetry Grid:** Real-time monitoring of CPU load, RAM pool, NVMe I/O, node temperature, and container density.

### Page B: The Automated Pipeline (GitHub Deployment Hub)
- **Workflow UI:** Input field with strict regex validation for public GitHub repository URLs.
- **The Pipeline Blueprint:** Step-by-step visual terminal layout:
  1. *Ingest:* Pulls and verifies repository framework and manifest.
  2. *Isolate:* Wraps code cleanly in a dedicated lightweight Docker environment with non-root execution.
  3. *Pack:* Efficiently packs up to 5 discrete bots into a single structural node.
  4. *Deploy:* Node fires up inside an isolated Proxmox home-lab cluster environment once cleared by admin.

### Page C: The AI Bot Blueprint Studio (Interactive Request Form)
- **Interactive Questionnaire:** Progressive discovery of bot scope, ecosystem, framework, and persistent storage models.
- **Dynamic Command Configurator:** Modular list builder with `[+ Add Slash Command]`.
  - As soon as a user finishes typing a command name, an indented smooth-expanding crimson text area appears demanding: *"Explain what this command does, its required parameters, and how the AI should code its logic."*

### Page D: The Gatekeeper Node (Contact & Intake)
- **Diagnostic Filter Micro-Quiz:** Requires users to verify entrypoint configuration, environment variable token security, and outbound-only WebSocket operation before transmission unlocks.
- **Secure Contact Form:** Direct encrypted conduit allowing inquiries or raw configuration file payloads (`.env.example`, `bot.yml`).

### Admin Orchestration Gate
- Secured under `/api/admin/approve/:id` and `/api/admin/reject/:id`.
- Enforces the **5-Bot Cluster Ceiling** and **Proxmox Capacity Trigger** alert.
- Supports **Manual Node Provisioning** (`/api/admin/provision-node`) to expand capacity and resolve alerts.

---

## 4. The Core Orchestration & Cluster Logic

1. **The 5-Bot Cluster Ceiling:** The backend inventory maps deployments to virtual containers. Each container has a hard physical ceiling of **exactly 5 bots**.
2. **The Admin Verification Gate:** Submissions default to status `pending_approval`. No code pulls and no container builds until authenticated clearance at `/api/admin/approve/:id`.
3. **The Proxmox Capacity Trigger:** If an approved bot pushes the active queue to a multiple of 5 (e.g. 5th, 10th, 15th overall) and all existing virtual environments are maxed out, the system blocks automatic synthesis and fires the stark crimson alert:
   > `[CRITICAL] CLUSTER CAPACITY REACHED. PROMPT: Manually provision an additional Proxmox VM node or spin up a new global cluster element to accept further deployments.`

---

## 5. Local Runtime & Subdomain Architecture

### One-Command Unified Runtime
Run the entire platform concurrently with a single command:
```bash
npm run dev:all
```
This boots:
- Backend API at: `http://localhost:5000`
- Frontend UI at: `http://localhost:3000`

### Subdomain Production Mapping
All base URLs and endpoints consume `process.env.BASE_URL`, configured for modular deployment under `sa1nt.xyz`:
- `status.sa1nt.xyz` → Page A (Node Status Hub)
- `deploy.sa1nt.xyz` → Page B (Automated Pipeline)
- `studio.sa1nt.xyz` → Page C (AI Bot Blueprint Studio)
- `contact.sa1nt.xyz` → Page D (Gatekeeper Node)
- `admin.sa1nt.xyz` → Admin Orchestrator Control Gate
- `api.sa1nt.xyz` → Node.js / Express Cluster API

---

### Credentials for Local Testing
- **Admin Password:** `saint-admin-coldsteel-2026`
- **Admin Email:** `sysadmin@sa1nt.xyz`

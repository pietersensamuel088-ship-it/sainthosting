# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- Frontend: React (Vite) + Tailwind CSS + Lucide Icons (Port 3000)
- Backend: Node.js (Express + TypeScript) + Security middleware (Rate limiters, input sanitization, JWT in HTTP-only cookies) (Port 5000)
- Orchestration: Proxmox VE & Docker 5-bot packed container simulation engine
- Subdomain Routing: Environment variable driven (`process.env.BASE_URL` -> `sa1nt.xyz`)

## Users

Bot developers, automation scripters, Discord/Telegram bot architects, and self-hosting enthusiasts seeking high-reliability containerized hosting without commercial bloat or surprise tier paywalls.

## Product Purpose

Saint (`sa1nt.xyz`) provides cold-steel community bot hosting powered by Proxmox virtualization and dense 5-bot Docker container packing. Hosting bots is the primary infrastructure engine; creating them with AI blueprints is a high-craft accelerator.

## Positioning

Elite hobbyist infrastructure cluster with raw transparency. Zero corporate marketing fluff. Tactical cyber-ops command center with real telemetry, strict admin approval gates, and dense resource packing.

## Operating Context

- Single unified command runtime (`npm run dev:all`) concurrently hosting frontend on port 3000 and API on port 5000.
- Strict port prohibition: Ports 8080, 8081, 8082, 8083, 8084 are strictly forbidden (reserved for active infrastructure nodes).
- Strict security: 5 requests/minute rate-limits on submissions, deep input sanitization (regex URL validation, XSS prevention, parameter escaping), and HTTP-only JWT admin authentication.

## Capabilities and Constraints

- **Page A (Node Status Hub):** Real-time cluster metrics, active container/bot allocation grids, Proxmox hardware telemetry.
- **Page B (GitHub Deployment Hub):** Public repo ingest with 4-stage pipeline visualization (Ingest -> Isolate -> Pack -> Deploy).
- **Page C (AI Bot Blueprint Studio):** Interactive bot scope builder and dynamic slash command configurator with expandable crimson logic areas.
- **Page D (Gatekeeper Intake & Contact):** Pre-contact diagnostic micro-quiz and hardened file/message transmission.
- **Admin Control Panel:** Secured command gate for approvals, rejections, cluster scaling, and capacity overrides.
- **Orchestration Rules:** 5 bots per container hard ceiling; capacity trigger fired at multiples of 5 with stark crimson alert when unprovisioned.

## Brand Commitments

- Persona: "Saint" — infrastructure engineer, tech bird, automated sysadmin.
- Visual Language: Aggressive, ultra-clean minimalism. Cyber-ops tactical terminal meets precision dashboard.
- Colors: Pitch Black `#000000`, Deep Charcoal `#0a0a0a` / `#121212`, Crimson Neon `#FF0000`, Deep Blood Red `#800000`, Silver `#A3A3A3`, Stark White `#FFFFFF`.
- Geometry: Hard edges (`rounded-none`, `rounded-sm`), 1px razor-sharp borders, subtle crimson neon glow (`rgba(255, 0, 0, 0.4)`).

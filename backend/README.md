# CA Portal — Backend (NestJS)

## Overview

NestJS REST API with Supabase (PostgreSQL), Redis/BullMQ for background jobs, and event-driven architecture.

## Quick Start

```bash
npm install
cp ../.env.example .env  # configure your values
npm run start:dev
```

## Architecture

### Modules

| Module | Responsibility |
|--------|---------------|
| `auth` | JWT login, OTP verification, profile |
| `tasks` | Full task lifecycle, approvals, history |
| `clients` | Client master, health scoring, registrations |
| `notifications` | In-app, WhatsApp (WATI), Email |
| `billing` | Invoice CRUD, payment tracking |
| `timesheets` | Time entry, weekly hours |
| `teams` | Team management, membership |
| `compliance` | Statutory calendar, recurring schedules |
| `documents` | File upload to Supabase Storage |
| `analytics` | Firm-wide reporting |
| `announcements` | Broadcast messages |
| `users` | Staff list, capacity data |

### Background Jobs (BullMQ)

```
jobs/
├── jobs.service.ts              # Cron schedulers
├── recurring-tasks.processor.ts # Creates tasks from schedules
├── deadline-alerts.processor.ts # Sends deadline warnings
└── document-chase.processor.ts  # Client document reminders
```

## API Endpoints

Swagger UI: `http://localhost:3001/api/docs`

## Build

```bash
npm run build
node dist/main
```

## Environment Variables

See root `.env.example` for all required variables.

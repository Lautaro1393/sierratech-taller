# SierraTech · Taller (backoffice)

Sistema de gestión de taller de electrónica y software: backoffice interno para Lautaro (técnico) + portal público de seguimiento para clientes.

## Documentación

- **[`CONTEXT.md`](./CONTEXT.md)** — documento vivo del proyecto: estado actual, decisiones, gotchas, próximos pasos.
- **[`SPEC-taller.md`](./SPEC-taller.md)** — especificación funcional completa (modelo de datos, design system, fases).
- **[`AGENTS.md`](./AGENTS.md)** — advertencia crítica sobre Next.js 16 (rompe convenciones respecto a versiones anteriores).

## Stack

- Next.js 16.3.3 + React 19.2.8
- Tailwind CSS 4
- Supabase (PostgreSQL + Auth + Storage) vía `@supabase/ssr` 0.12.5
- Deploy: Vercel (push-to-`main`)

## Desarrollo local

```bash
npm install
npm run dev
```

App disponible en `http://localhost:3000`.

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`.env.local` no se commitea (cubierto por `.gitignore`).

## Deploy

Push a `main` → Vercel redesplega automáticamente.

## Repos relacionados

- `Lautaro1393/SierraTech-lab` — sitio público (HTML/CSS/JS vanilla, GitHub Pages). Repo independiente.

---

© 2026 Sierra Tech · Almagro, Buenos Aires.

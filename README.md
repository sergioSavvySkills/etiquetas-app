# Etiquetas App

Aplicación web construida con [Next.js](https://nextjs.org) (App Router), pensada
para desplegarse en [Vercel](https://vercel.com). El backend y la base de datos
se gestionan en [Xano](https://xano.com).

## Stack

- **Next.js 16** (App Router, TypeScript)
- **React 19**
- **Tailwind CSS 4**
- **ESLint**
- **Backend / DB:** Xano (API REST)
- **Hosting:** Vercel

## Requisitos

- Node.js 18.18+ (recomendado Node 20+)

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

| Variable                   | Descripción                                              |
| -------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_XANO_API_URL` | URL base del grupo de API de Xano (incluye `/api:xxxx`). |

## Integración con Xano

El cliente HTTP para Xano está en [`src/lib/xano.ts`](src/lib/xano.ts). Ejemplo:

```ts
import { xanoFetch } from "@/lib/xano";

const etiquetas = await xanoFetch("/etiquetas");
```

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servir el build de producción
- `npm run lint` — linter

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Configura las variables de entorno (`NEXT_PUBLIC_XANO_API_URL`).
3. Vercel detecta Next.js automáticamente y despliega en cada push.

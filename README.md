# Etiquetas App

Aplicación web construida con [Next.js](https://nextjs.org) (App Router), pensada
para desplegarse en [Vercel](https://vercel.com). El backend y la base de datos
se gestionan en [Xano](https://xano.com).

## Qué hace

Espacio de trabajo para redactar la etiqueta de un producto alimentario a
partir de su documentación (ruta `/`):

- **Panel izquierdo — Requisitos.** Lista dinámica de todo lo que hace falta
  para la etiqueta. Se calcula con la matriz maestra (`src/data/matriz.json`)
  según el tipo de producto y sus certificaciones: no todos los productos
  necesitan lo mismo. Cada requisito tiene estado (pendiente, recibido,
  analizando, verificado, incidencia, no aplica) y guía (qué es, por qué se
  pide, cómo se cubre, base legal).
  La fase «Análisis de laboratorio» sale de un catálogo completo
  (`src/lib/laboratorio.ts`): nutricional, vida útil, microbiológico,
  físico-químico, grado alcohólico, contaminantes, residuos de plaguicidas,
  alérgenos analíticos, soporte de claims, OMG, autenticidad y sensorial. Cada
  uno decide si aplica, si es obligatorio y qué parámetros debe incluir el
  informe según el sector, las certificaciones y el **perfil del producto**
  (conservación, listo para consumo, alcohol, claims, líquido de cobertura,
  ingrediente único). Los que no aplican se muestran con su motivo.

  **Aprobación humana.** Lo que el asistente extrae o verifica queda «Por
  confirmar»; solo pasa a «Aprobado» cuando un consultor lo confirma desde la
  ficha del requisito (o desde la cola de la vista previa), y la aprobación
  queda firmada con su nombre y hora. Un requisito por confirmar se puede
  rechazar con un motivo (pasa a incidencia). Los datos que la persona
  introduce a mano quedan aprobados directamente. La etiqueta solo se puede
  generar cuando todos los obligatorios están aprobados o descartados por una
  persona.
- **Panel central — Chat.** Conversación con el asistente donde se escriben
  datos y se adjuntan documentos (arrastrar y soltar). El asistente vincula
  cada documento con los requisitos que cubre.
- **Panel derecho — Detalle / Etiqueta.** Al pulsar un requisito o un
  documento se ve su contexto: visor, datos extraídos, requisitos que cubre y
  acciones. Sin selección muestra la vista previa de la etiqueta, que se
  rellena sola con lo verificado y marca lo que falta.

Estado actual: **solo UI/UX**. Los datos son de demostración y el análisis de
documentos está simulado en el cliente (`src/lib/demo.ts`,
`src/components/workspace/`). La versión anterior (asistente paso a paso) se
conserva en `/wizard`.

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

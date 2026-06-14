/**
 * Cliente HTTP mínimo para consumir la API de Xano.
 *
 * El backend y la base de datos viven en Xano. Configura la URL base del
 * grupo de API en la variable de entorno `NEXT_PUBLIC_XANO_API_URL`
 * (ver `.env.example`).
 */

const BASE_URL = process.env.NEXT_PUBLIC_XANO_API_URL;

export class XanoError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "XanoError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  /** Cuerpo de la petición; se serializa a JSON automáticamente. */
  body?: unknown;
  /** Token de autenticación opcional para el header Authorization. */
  authToken?: string;
};

/**
 * Realiza una petición a la API de Xano y devuelve la respuesta parseada.
 *
 * @param path Ruta del endpoint relativa a la base, por ejemplo `/etiquetas`.
 */
export async function xanoFetch<T = unknown>(
  path: string,
  { body, authToken, headers, ...init }: RequestOptions = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new XanoError(
      "Falta configurar NEXT_PUBLIC_XANO_API_URL (ver .env.example).",
      0,
    );
  }

  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new XanoError(
      `Error ${res.status} al llamar a Xano: ${path}`,
      res.status,
      data,
    );
  }

  return data as T;
}

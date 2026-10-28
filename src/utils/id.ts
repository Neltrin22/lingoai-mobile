let counter = 0;

/** Identificador simple y único para mensajes en memoria. */
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

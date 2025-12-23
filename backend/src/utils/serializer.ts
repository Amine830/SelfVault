/**
 * Utilitaires pour la sérialisation JSON
 */

/**
 * Convertit récursivement les BigInt en string dans un objet
 * pour permettre la sérialisation JSON
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return String(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    const arr = obj as unknown as unknown[];
    return arr.map((item) => serializeBigInt(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized as T;
  }

  return obj;
}

import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * Calcule le hash SHA256 d'un buffer
 */
export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calcule le hash SHA256 d'un fichier
 */
export async function calculateFileSha256(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return calculateSha256(buffer);
}

/**
 * Nettoie et sécurise un nom de fichier
 */
export function sanitizeFilename(filename: string): string {
  // Supprime les caractères dangereux
  const sanitized = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);

  // Ajoute un timestamp pour éviter les collisions
  const timestamp = Date.now();
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);

  return `${name}_${timestamp}${ext}`;
}

/**
 * Génère un chemin de stockage organisé par date
 */
export function generateStoragePath(userId: string, filename: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${userId}/${year}/${month}/${day}/${filename}`;
}

/**
 * Formate la taille de fichier en format lisible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Convertit un stream en buffer
 */
export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer | Uint8Array | string) => {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      } else {
        chunks.push(Buffer.from(chunk));
      }
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Crée un répertoire s'il n'existe pas
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

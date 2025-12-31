import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { fileService } from '../services/FileService';
import { AppError } from '../utils/errors';
import { serializeBigInt } from '../utils/serializer';

/**
 * Contrôleur pour gérer les fichiers
 */
export class FileController {
  /**
   * POST /files/upload - Upload un fichier
   */
  async uploadFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      if (!req.file) {
        throw new AppError('No file provided', 400);
      }

      const { filename, categoryId, visibility } = req.body as unknown as {
        filename: string;
        categoryId?: string | number | null;
        visibility?: string;
      };

      const file = await fileService.uploadFile(req.user.id, req.file, {
        filename,
        categoryId: categoryId ? parseInt(String(categoryId), 10) : undefined,
        visibility,
      });

      // Sérialiser les BigInt avant de renvoyer la réponse JSON
      res.status(201).json({ file: serializeBigInt(file) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /files - Liste les fichiers
   */
  async listFiles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const categoryId = req.query.categoryId
        ? parseInt(req.query.categoryId as string, 10)
        : undefined;
      const search = req.query.search as string | undefined;

      const result = await fileService.listFiles(req.user.id, {
        page,
        limit,
        categoryId,
        search,
      });

      // Sérialiser les BigInt dans la liste de fichiers
      res.json(serializeBigInt(result));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /files/:id - Récupère un fichier
   */
  async getFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const file = await fileService.getFileById(req.params.id, req.user.id);

      // Sérialiser les BigInt avant de renvoyer
      res.json({ file: serializeBigInt(file) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /files/:id/download - Télécharge un fichier
   */
  async downloadFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { buffer, filename, mimetype } = await fileService.downloadFile(
        req.params.id,
        req.user.id
      );

      res.setHeader('Content-Type', mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /files/:id/url - Génère une URL signée
   */
  async getDownloadUrl(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const expiresIn = req.query.expiresIn ? parseInt(req.query.expiresIn as string, 10) : 3600;

      const url = await fileService.getDownloadUrl(req.params.id, req.user.id, expiresIn);

      res.json({ url, expiresIn });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /files/:id - Met à jour un fichier
   */
  async updateFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { filename, visibility, categoryId } = req.body as unknown as {
        filename?: string;
        visibility?: string;
        categoryId?: string | number | null;
      };

      const file = await fileService.updateFile(req.params.id, req.user.id, {
        filename,
        visibility,
        categoryId:
          categoryId !== undefined
            ? categoryId === null
              ? null
              : parseInt(String(categoryId), 10)
            : undefined,
      });

      // Sérialiser les BigInt avant de renvoyer
      res.json({ file: serializeBigInt(file) });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /files/:id - Supprime un fichier
   */
  async deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      await fileService.deleteFile(req.params.id, req.user.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const fileController = new FileController();

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { shareService } from '../services/ShareService';
import { AppError } from '../utils/errors';

/**
 * Contrôleur pour gérer le partage de fichiers
 */
export class ShareController {
  /**
   * POST /files/:id/share - Crée un lien de partage
   */
  async createShareLink(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { expiresIn, password, maxDownloads } = req.body as {
        expiresIn?: number;
        password?: string;
        maxDownloads?: number;
      };

      const shareInfo = await shareService.createShareLink(req.params.id, req.user.id, {
        expiresIn,
        password,
        maxDownloads,
      });

      res.status(201).json(shareInfo);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /files/:id/share - Récupère les infos de partage
   */
  async getShareInfo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const shareInfo = await shareService.getShareInfo(req.params.id, req.user.id);

      if (!shareInfo) {
        res.json({ shared: false });
        return;
      }

      res.json({ shared: true, ...shareInfo });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /files/:id/share - Révoque le partage
   */
  async revokeShareLink(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      await shareService.revokeShareLink(req.params.id, req.user.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /share/:token - Récupère les infos publiques d'un fichier partagé
   * Route publique (sans authentification)
   */
  async getPublicFileInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fileInfo = await shareService.getPublicFileInfo(req.params.token);
      res.json(fileInfo);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /share/:token/download - Télécharge un fichier partagé
   * Route publique (sans authentification)
   */
  async downloadSharedFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const password = req.query.password as string | undefined;

      const { buffer, filename, mimetype } = await shareService.downloadSharedFile(
        req.params.token,
        password
      );

      res.setHeader('Content-Type', mimetype || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /share/:token/download - Télécharge avec mot de passe (POST pour le body)
   * Route publique (sans authentification)
   */
  async downloadSharedFileWithPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { password } = req.body as { password?: string };

      const { buffer, filename, mimetype } = await shareService.downloadSharedFile(
        req.params.token,
        password
      );

      res.setHeader('Content-Type', mimetype || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /share/:token/url - Génère une URL signée pour un fichier partagé
   * Route publique (sans authentification)
   */
  async getSharedFileUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const password = req.query.password as string | undefined;
      const expiresIn = req.query.expiresIn ? parseInt(req.query.expiresIn as string, 10) : 3600;

      const url = await shareService.getSharedFileUrl(req.params.token, password, expiresIn);

      res.json({ url, expiresIn });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /public/files - Liste les fichiers publics
   * Route publique (sans authentification)
   */
  async listPublicFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await shareService.listPublicFiles({ page, limit });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const shareController = new ShareController();

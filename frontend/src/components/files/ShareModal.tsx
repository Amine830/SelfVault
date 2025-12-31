import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  Lock,
  Globe,
  Clock,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import { createShareLink, getShareInfo, revokeShareLink } from '../../api/share';
import type { File as FileItem, ShareOptions } from '../../types';

interface ShareModalProps {
  file: FileItem;
  onClose: () => void;
}

export default function ShareModal({ file, onClose }: ShareModalProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Options de partage
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [password, setPassword] = useState('');
  const [maxDownloads, setMaxDownloads] = useState<string>('');

  // Récupérer les infos de partage existantes
  const shareInfoQuery = useQuery({
    queryKey: ['shareInfo', file.id],
    queryFn: () => getShareInfo(file.id),
  });

  const createShareMutation = useMutation({
    mutationFn: (options: ShareOptions) => createShareLink(file.id, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareInfo', file.id] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const revokeShareMutation = useMutation({
    mutationFn: () => revokeShareLink(file.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shareInfo', file.id] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const shareInfo = shareInfoQuery.data;
  const isShared = shareInfo?.shared && shareInfo?.shareUrl;

  const handleCreateShare = async () => {
    const options: ShareOptions = {};

    // Convertir l'expiration en secondes
    if (expiresIn !== 'never') {
      const expiresInSeconds: Record<string, number> = {
        '1h': 3600,
        '24h': 86400,
        '7d': 604800,
        '30d': 2592000,
      };
      options.expiresIn = expiresInSeconds[expiresIn];
    }

    if (password.trim()) {
      options.password = password.trim();
    }

    if (maxDownloads && parseInt(maxDownloads, 10) > 0) {
      options.maxDownloads = parseInt(maxDownloads, 10);
    }

    await createShareMutation.mutateAsync(options);
  };

  const handleCopyLink = async () => {
    if (shareInfo?.shareUrl) {
      await navigator.clipboard.writeText(shareInfo.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeShare = async () => {
    await revokeShareMutation.mutateAsync();
  };

  const formatExpiry = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return 'Jamais';
    const date = new Date(expiresAt);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <LinkIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Partager</h3>
              <p className="text-sm text-gray-500 truncate max-w-[200px]">{file.filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {shareInfoQuery.isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
            </div>
          )}

          {!shareInfoQuery.isLoading && isShared && (
            <div className="space-y-4">
              {/* Lien actif */}
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Globe className="h-5 w-5" />
                  <span className="font-medium">Lien de partage actif</span>
                </div>

                {/* URL */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={shareInfo.shareUrl}
                    readOnly
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatExpiry(shareInfo.expiresAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Download className="h-4 w-4" />
                    <span>
                      {shareInfo.downloads || 0}
                      {shareInfo.maxDownloads ? ` / ${shareInfo.maxDownloads}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    {shareInfo.hasPassword ? (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Protégé</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Public</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bouton révoquer */}
              <button
                onClick={handleRevokeShare}
                disabled={revokeShareMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {revokeShareMutation.isPending ? 'Révocation...' : 'Révoquer le partage'}
              </button>
            </div>
          )}

          {!shareInfoQuery.isLoading && !isShared && (
            <div className="space-y-4">
              {/* Fichier privé */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Lock className="h-5 w-5" />
                  <span className="font-medium">Ce fichier est privé</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Créez un lien de partage pour permettre à d&apos;autres personnes d&apos;accéder à ce fichier.
                </p>
              </div>

              {/* Options de partage */}
              <div className="space-y-3">
                {/* Expiration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expiration du lien
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="never">Jamais (permanent)</option>
                    <option value="1h">1 heure</option>
                    <option value="24h">24 heures</option>
                    <option value="7d">7 jours</option>
                    <option value="30d">30 jours</option>
                  </select>
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mot de passe (optionnel)
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Laisser vide pour aucun mot de passe"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:border-primary-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Limite de téléchargements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre max de téléchargements (optionnel)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(e.target.value)}
                    placeholder="Illimité"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bouton créer */}
              <button
                onClick={handleCreateShare}
                disabled={createShareMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
              >
                <LinkIcon className="h-4 w-4" />
                {createShareMutation.isPending ? 'Création...' : 'Créer le lien de partage'}
              </button>

              {createShareMutation.isError && (
                <p className="text-sm text-red-600">
                  Erreur lors de la création du lien de partage.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

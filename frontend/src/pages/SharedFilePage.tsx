import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Download,
  FileIcon,
  Lock,
  AlertCircle,
  Clock,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getPublicFileInfo, downloadSharedFile, downloadSharedFileWithPassword } from '../api/share';
import ThemeToggle from '../components/common/ThemeToggle';

function formatSize(size: string) {
  const value = Number(size);
  if (!Number.isFinite(value)) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getFileIcon(mimetype: string | null) {
  if (!mimetype) return '📄';
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype.startsWith('video/')) return '🎬';
  if (mimetype.startsWith('audio/')) return '🎵';
  if (mimetype.includes('pdf')) return '📕';
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('tar')) return '📦';
  if (mimetype.includes('text')) return '📝';
  return '📄';
}

export default function SharedFilePage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const fileInfoQuery = useQuery({
    queryKey: ['sharedFile', token],
    queryFn: () => getPublicFileInfo(token!),
    enabled: !!token,
    retry: false,
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Token manquant');
      setDownloadError(null);
      if (fileInfoQuery.data?.hasPassword) {
        await downloadSharedFileWithPassword(token, password);
      } else {
        await downloadSharedFile(token);
      }
    },
    onError: (error: unknown) => {
      // Vérifier le code d'erreur Axios
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || (error as Error).message || '';
      
      if (status === 401 || message.toLowerCase().includes('password') || message.toLowerCase().includes('mot de passe')) {
        setDownloadError('Mot de passe incorrect');
      } else if (status === 410 || message.includes('expired') || message.includes('limit')) {
        setDownloadError('Ce lien a expiré ou la limite de téléchargements a été atteinte');
      } else if (status === 404) {
        setDownloadError('Ce lien de partage n\'existe pas');
      } else {
        setDownloadError('Erreur lors du téléchargement');
      }
    },
  });

  const handleDownload = () => {
    downloadMutation.mutate();
  };

  // Erreur de chargement
  if (fileInfoQuery.error) {
    const errorMessage =
      (fileInfoQuery.error as Error).message?.includes('404')
        ? 'Ce lien de partage n\'existe pas ou n\'est plus valide.'
        : (fileInfoQuery.error as Error).message?.includes('410')
        ? 'Ce lien de partage a expiré.'
        : 'Une erreur est survenue lors du chargement du fichier.';

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black px-4 transition-colors duration-300">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-8 shadow-lg dark:shadow-black/50 text-center border border-transparent dark:border-zinc-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Lien invalide</h1>
          <p className="mt-2 text-gray-600 dark:text-zinc-400">{errorMessage}</p>
          <a
            href="/"
            className="mt-6 inline-block rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25 transition-all"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  // Chargement
  if (fileInfoQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black transition-colors duration-300">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const file = fileInfoQuery.data;
  if (!file) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-black dark:to-zinc-900 px-4 py-12 transition-colors duration-300">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        {/* Card principale */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-xl dark:shadow-2xl dark:shadow-black/50 overflow-hidden border border-transparent dark:border-zinc-800">
          {/* Header avec icône */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-4xl backdrop-blur-sm">
              {getFileIcon(file.mimetype)}
            </div>
            <h1 className="text-xl font-semibold truncate" title={file.filename}>
              {file.filename}
            </h1>
            <p className="mt-1 text-primary-100">{formatSize(file.size)}</p>
          </div>

          {/* Infos */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                <FileIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                <span className="truncate">{file.mimetype || 'Fichier'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                <Clock className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                <span>
                  {new Date(file.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {file.ownerUsername && (
                <div className="col-span-2 flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                  <User className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                  <span>Partagé par {file.ownerUsername}</span>
                </div>
              )}
            </div>

            {/* Mot de passe requis */}
            {file.hasPassword && (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Ce fichier est protégé par un mot de passe</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez le mot de passe"
                    className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Erreur de téléchargement */}
            {downloadError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800">
                <AlertCircle className="h-4 w-4" />
                <span>{downloadError}</span>
              </div>
            )}

            {/* Bouton de téléchargement */}
            <button
              onClick={handleDownload}
              disabled={downloadMutation.isPending || (file.hasPassword && !password.trim())}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3 font-medium text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
            >
              {downloadMutation.isPending ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Téléchargement...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Télécharger</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-zinc-500">
          Partagé via{' '}
          <a href="/" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
            SelfVault
          </a>
        </p>
      </div>
    </div>
  );
}

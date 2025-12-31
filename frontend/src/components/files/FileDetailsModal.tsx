import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Save } from 'lucide-react';
import { getFile, updateFile } from '../../api/files';
import type { Category, File as FileItem } from '../../types';

interface FileDetailsModalProps {
  fileId: string;
  categories: Category[];
  onClose: () => void;
  onUpdated: () => void;
}

function formatDate(value: FileItem['createdAt']) {
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    return value;
  }
  return '—';
}

export default function FileDetailsModal({ fileId, categories, onClose, onUpdated }: FileDetailsModalProps) {
  const queryClient = useQueryClient();
  const [filename, setFilename] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const fileQuery = useQuery({
    queryKey: ['file', fileId],
    queryFn: () => getFile(fileId),
    enabled: Boolean(fileId),
  });

  useEffect(() => {
    if (fileQuery.data) {
      setFilename(fileQuery.data.filename);
      setVisibility(fileQuery.data.visibility);
      setCategoryId(fileQuery.data.categoryId);
    }
  }, [fileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (data: { filename: string; visibility: 'private' | 'public'; categoryId: number | null }) =>
      updateFile(fileId, {
        filename: data.filename,
        visibility: data.visibility,
        categoryId: data.categoryId === null ? null : data.categoryId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      await queryClient.invalidateQueries({ queryKey: ['files'] });
      onUpdated();
    },
  });

  const file = fileQuery.data;
  const isSaving = updateMutation.isPending;

  const categoryOptions = useMemo(() => [{ id: 0, name: 'Aucune', color: '#9ca3af', ownerId: '' }, ...categories], [categories]);

  const handleSubmit = async () => {
    if (!file) return;
    await updateMutation.mutateAsync({ filename, visibility, categoryId });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 dark:bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-zinc-900 shadow-xl dark:shadow-2xl dark:shadow-black/50 border border-transparent dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Détails du fichier</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Identifiant {fileId}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {fileQuery.isLoading && <p className="text-sm text-gray-500 dark:text-zinc-400">Chargement...</p>}
          {fileQuery.error && <p className="text-sm text-red-600 dark:text-red-400">Impossible de charger ce fichier.</p>}

          {file && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">Nom du fichier</label>
                  <input
                    type="text"
                    value={filename}
                    onChange={(event) => setFilename(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">Visibilité</label>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-700 dark:text-zinc-300">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={visibility === 'private'}
                        onChange={() => setVisibility('private')}
                        className="accent-primary-500"
                      />
                      Privé
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={visibility === 'public'}
                        onChange={() => setVisibility('public')}
                        className="accent-primary-500"
                      />
                      Public
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">Catégorie</label>
                  <select
                    value={categoryId ?? 0}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setCategoryId(value === 0 ? null : value);
                    }}
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.id === 0 ? 'Aucune' : category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">Taille</label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">{file.size}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">Hash SHA256</label>
                  <p className="mt-1 break-all text-sm text-gray-700 dark:text-zinc-300">{file.sha256}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">Chemin de stockage</label>
                  <p className="mt-1 break-all text-sm text-gray-700 dark:text-zinc-300">{file.storagePath}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">Créé le</label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">{formatDate(file.createdAt)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-gray-500 dark:text-zinc-400">Mis à jour le</label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">{formatDate(file.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors">
            Fermer
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !file}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60 shadow-lg shadow-primary-500/25 transition-all"
          >
            {isSaving ? (
              <span>Enregistrement...</span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
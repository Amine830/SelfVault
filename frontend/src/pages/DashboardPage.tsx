import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LogOut,
  User,
  Upload,
  Download,
  Trash,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { listFiles, uploadFile as uploadFileApi, deleteFile, downloadFile } from '../api/files';
import { listCategories, createCategory } from '../api/categories';
import type { File as FileItem } from '../types';

function formatSize(size: string) {
  const value = Number(size);
  if (!Number.isFinite(value)) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#0ea5e9');
  const [page, setPage] = useState(1);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
    staleTime: 5 * 60 * 1000,
  });

  const filesQuery = useQuery({
    queryKey: ['files', page, selectedCategoryId],
    queryFn: () =>
      listFiles({
        page,
        limit: 10,
        categoryId: selectedCategoryId ?? undefined,
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Aucun fichier sélectionné');
      return uploadFileApi(selectedFile, {
        visibility,
        categoryId: selectedCategoryId ?? undefined,
      });
    },
    onSuccess: () => {
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFile(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: () => createCategory({ name: newCategoryName, color: newCategoryColor }),
    onSuccess: () => {
      setNewCategoryName('');
      setNewCategoryColor('#0ea5e9');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const files = filesQuery.data?.files ?? [];
  const totalPages = filesQuery.data?.totalPages ?? 1;

  const isLoading = filesQuery.isFetching || uploadMutation.isPending || deleteMutation.isPending;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleUpload = async () => {
    try {
      await uploadMutation.mutateAsync();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async (file: FileItem) => {
    await downloadFile(file.id, file.filename);
  };

  const handleDelete = async (file: FileItem) => {
    await deleteMutation.mutateAsync(file.id);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategoryMutation.mutateAsync();
  };

  const currentCategory = useMemo(() => {
    if (!selectedCategoryId) return 'Toutes les catégories';
    const match = categoriesQuery.data?.find((c) => c.id === selectedCategoryId);
    return match ? match.name : 'Catégorie';
  }, [selectedCategoryId, categoriesQuery.data]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">SelfVault</h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="text-sm">{user?.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Fichiers</h2>
              <p className="text-gray-600 text-sm">Gérez vos uploads et vos catégories</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                <Upload className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {selectedFile ? selectedFile.name : 'Choisir un fichier'}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisibility('private')}
                  className={`px-3 py-2 text-sm rounded-lg border ${
                    visibility === 'private'
                      ? 'border-primary-500 text-primary-700 bg-primary-50'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Privé
                </button>
                <button
                  onClick={() => setVisibility('public')}
                  className={`px-3 py-2 text-sm rounded-lg border ${
                    visibility === 'public'
                      ? 'border-primary-500 text-primary-700 bg-primary-50'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Public
                </button>
              </div>

              <select
                value={selectedCategoryId ?? ''}
                onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
              >
                <option value="">Toutes les catégories</option>
                {categoriesQuery.data?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Create category */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nouvelle catégorie"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-12 h-10 border border-gray-200 rounded"
                aria-label="Couleur"
              />
              <button
                onClick={handleCreateCategory}
                disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                <FolderPlus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            <div className="flex items-center justify-end text-sm text-gray-600 gap-2">
              <span>Filtre : {currentCategory}</span>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['files'] })}
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
              >
                <RefreshCw className="w-4 h-4" />
                Rafraîchir
              </button>
            </div>
          </div>
        </div>

        {/* Files table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {filesQuery.isFetching ? 'Chargement...' : `${files.length} fichier(s)`}
            </span>
            {filesQuery.error && (
              <span className="text-sm text-red-600">Erreur de chargement</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Visibilité</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Taille</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{file.filename}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {file.category ? (
                        <span
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs"
                          style={{ backgroundColor: `${file.category.color}20`, color: file.category.color }}
                        >
                          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: file.category.color }} />
                          {file.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          file.visibility === 'private'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {file.visibility === 'private' ? 'Privé' : 'Public'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatSize(file.size)}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(file)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-primary-700 bg-primary-50 border border-primary-100 rounded-lg hover:bg-primary-100"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 disabled:opacity-60"
                        >
                          <Trash className="w-4 h-4" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {files.length === 0 && !filesQuery.isFetching && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Aucun fichier pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-xs text-gray-500">Page {page} / {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || filesQuery.isFetching}
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white disabled:opacity-60"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || filesQuery.isFetching}
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white disabled:opacity-60"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>

        {(isLoading || categoriesQuery.isFetching) && (
          <div className="text-sm text-gray-500">Mises à jour en cours...</div>
        )}
      </main>
    </div>
  );
}

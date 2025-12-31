import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LogOut,
  User,
  Upload,
  Download,
  Trash,
  FolderPlus,
  RefreshCw,
  Link as LinkIcon,
  Info,
  Share2,
  Globe,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  listFiles,
  uploadFile as uploadFileApi,
  deleteFile,
  downloadFile,
  getFileUrl,
} from '../api/files';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import { getMe } from '../api/user';
import type { File as FileItem, Category } from '../types';
import FileDetailsModal from '../components/files/FileDetailsModal';
import ShareModal from '../components/files/ShareModal';
import QuotaBar from '../components/common/QuotaBar';
import ThemeToggle from '../components/common/ThemeToggle';

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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [detailsFileId, setDetailsFileId] = useState<string | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
    staleTime: 5 * 60 * 1000,
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 60 * 1000,
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
      setCategoryFeedback('Catégorie créée.');
      window.setTimeout(() => setCategoryFeedback(null), 2000);
      setCategoryError(null);
    },
    onError: () => {
      setCategoryError('Impossible de créer la catégorie (vérifiez le nom).');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data: { id: number; name: string; color: string }) =>
      updateCategory(data.id, { name: data.name, color: data.color }),
    onSuccess: () => {
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryFeedback('Catégorie mise à jour.');
      window.setTimeout(() => setCategoryFeedback(null), 2000);
      setCategoryError(null);
    },
    onError: () => {
      setCategoryError('Échec de la mise à jour de la catégorie.');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: (_, id) => {
      if (selectedCategoryId === id) {
        setSelectedCategoryId(null);
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setCategoryFeedback('Catégorie supprimée.');
      window.setTimeout(() => setCategoryFeedback(null), 2000);
      setCategoryError(null);
    },
    onError: () => {
      setCategoryError('Impossible de supprimer la catégorie.');
    },
  });

  const signedUrlMutation = useMutation({
    mutationFn: (id: string) => getFileUrl(id),
    onSuccess: (_data, id) => {
      setCopiedFileId(id);
      window.setTimeout(() => setCopiedFileId((current) => (current === id ? null : current)), 2500);
      setCopyErrorId(null);
    },
    onError: (_error, id) => {
      setCopyErrorId(id);
      window.setTimeout(() => setCopyErrorId((current) => (current === id ? null : current)), 2500);
      setCopiedFileId(null);
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

  const handleCopySignedUrl = async (file: FileItem) => {
    try {
      const { url } = await signedUrlMutation.mutateAsync(file.id);
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error('Copy signed URL failed:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategoryMutation.mutateAsync();
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory({ ...category });
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    if (!editingCategory.name.trim()) return;
    await updateCategoryMutation.mutateAsync({
      id: editingCategory.id,
      name: editingCategory.name,
      color: editingCategory.color ?? '#6366f1',
    });
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Supprimer la catégorie “${category.name}” ?`)) return;
    await deleteCategoryMutation.mutateAsync(category.id);
  };

  const currentCategory = useMemo(() => {
    if (!selectedCategoryId) return 'Toutes les catégories';
    const match = categoriesQuery.data?.find((c) => c.id === selectedCategoryId);
    return match ? match.name : 'Catégorie';
  }, [selectedCategoryId, categoriesQuery.data]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 shadow-sm border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SelfVault</h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-zinc-300">
                <User className="w-5 h-5" />
                <span className="text-sm hidden sm:inline">{user?.email}</span>
              </div>

              <ThemeToggle />

              <Link
                to="/settings"
                className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Paramètres
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Quota Bar */}
        {meQuery.data?.storage && (
          <QuotaBar storage={meQuery.data.storage} />
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow dark:shadow-black/20 p-6 border border-transparent dark:border-zinc-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Fichiers</h2>
              <p className="text-gray-600 dark:text-zinc-400 text-sm">Gérez vos uploads et vos catégories</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                <Upload className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                <span className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[150px]">
                  {selectedFile ? selectedFile.name : 'Choisir un fichier'}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisibility('private')}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    visibility === 'private'
                      ? 'border-primary-500 text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  Privé
                </button>
                <button
                  onClick={() => setVisibility('public')}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    visibility === 'public'
                      ? 'border-primary-500 text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  Public
                </button>
              </div>

              <select
                value={selectedCategoryId ?? ''}
                onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
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
                className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
              />
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-12 h-10 border border-gray-200 dark:border-zinc-700 rounded cursor-pointer"
                aria-label="Couleur"
              />
              <button
                onClick={handleCreateCategory}
                disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-60 transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
            <div className="flex items-center justify-end text-sm text-gray-600 dark:text-zinc-400 gap-2">
              <span>Filtre : {currentCategory}</span>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['files'] })}
                className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <RefreshCw className="w-4 h-4" />
                Rafraîchir
              </button>
            </div>
          </div>

          {(categoryFeedback || categoryError) && (
            <div
              className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                categoryFeedback 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {categoryFeedback || categoryError}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mb-3">Catégories</h3>
            <div className="overflow-x-auto border border-gray-100 dark:border-zinc-800 rounded-lg">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-zinc-400">Nom</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-zinc-400">Couleur</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 text-sm">
                  {categoriesQuery.data?.map((category) => {
                    const colorValue = category.color ?? '#6366f1';
                    const isEditing = editingCategory?.id === category.id;
                    return (
                      <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingCategory.name}
                              onChange={(event) =>
                                setEditingCategory((prev) => prev && { ...prev, name: event.target.value })
                              }
                              className="w-full rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-sm text-gray-900 dark:text-white"
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-zinc-100">{category.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="color"
                              value={editingCategory.color ?? '#6366f1'}
                              onChange={(event) =>
                                setEditingCategory((prev) => prev && { ...prev, color: event.target.value })
                              }
                              className="h-8 w-12 rounded border border-gray-200 dark:border-zinc-700 cursor-pointer"
                            />
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded-full"
                                style={{ backgroundColor: colorValue }}
                              />
                              <span className="text-gray-700 dark:text-zinc-300">{colorValue}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleSaveCategory}
                                  disabled={updateCategoryMutation.isPending}
                                  className="rounded-md bg-primary-500 px-3 py-1 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-60"
                                >
                                  Sauver
                                </button>
                                <button
                                  onClick={() => setEditingCategory(null)}
                                  className="rounded-md border border-gray-200 dark:border-zinc-700 px-3 py-1 text-xs text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                >
                                  Annuler
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  className="rounded-md border border-gray-200 dark:border-zinc-700 px-3 py-1 text-xs text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                >
                                  Éditer
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category)}
                                  disabled={deleteCategoryMutation.isPending}
                                  className="rounded-md border border-red-200 dark:border-red-800 px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60"
                                >
                                  Supprimer
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(!categoriesQuery.data || categoriesQuery.data.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-400 dark:text-zinc-500">
                        Aucune catégorie.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Files table */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow dark:shadow-black/20 overflow-hidden border border-transparent dark:border-zinc-800">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-zinc-300">
              {filesQuery.isFetching ? 'Chargement...' : `${files.length} fichier(s)`}
            </span>
            {filesQuery.error && (
              <span className="text-sm text-red-600 dark:text-red-400">Erreur de chargement</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
              <thead className="bg-gray-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400">Visibilité</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400">Taille</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-100">{file.filename}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-zinc-300">
                      {file.category ? (
                        <span
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs"
                          style={{ backgroundColor: `${file.category.color}20`, color: file.category.color }}
                        >
                          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: file.category.color }} />
                          {file.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          file.visibility === 'private'
                            ? 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        }`}
                      >
                        {file.visibility === 'private' ? (
                          <><Lock className="w-3 h-3" /> Privé</>
                        ) : (
                          <><Globe className="w-3 h-3" /> Public</>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-zinc-300">{formatSize(file.size)}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => setShareFile(file)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          Partager
                        </button>
                        <button
                          onClick={() => handleCopySignedUrl(file)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          disabled={signedUrlMutation.isPending && signedUrlMutation.variables === file.id}
                        >
                          <LinkIcon className="w-4 h-4" />
                          URL temp.
                        </button>
                        <button
                          onClick={() => setDetailsFileId(file.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Info className="w-4 h-4" />
                          Détails
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-60 transition-colors"
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
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-zinc-500">
                      Aucun fichier pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(copiedFileId || copyErrorId) && (
            <div className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm">
              {copiedFileId && <span className="text-green-600 dark:text-green-400">Lien copié dans le presse-papiers (valide 1h).</span>}
              {copyErrorId && <span className="text-red-600 dark:text-red-400">Impossible de copier le lien pour ce fichier.</span>}
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
            <span className="text-xs text-gray-500 dark:text-zinc-400">Page {page} / {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || filesQuery.isFetching}
                className="px-3 py-2 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 disabled:opacity-60 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || filesQuery.isFetching}
                className="px-3 py-2 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 disabled:opacity-60 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>

        {(isLoading || categoriesQuery.isFetching) && (
          <div className="text-sm text-gray-500 dark:text-zinc-400">Mises à jour en cours...</div>
        )}
      </main>

      {detailsFileId && (
        <FileDetailsModal
          fileId={detailsFileId}
          categories={(categoriesQuery.data as Category[] | undefined) ?? []}
          onClose={() => setDetailsFileId(null)}
          onUpdated={() => {
            setDetailsFileId(null);
            queryClient.invalidateQueries({ queryKey: ['files'] });
          }}
        />
      )}

      {shareFile && (
        <ShareModal
          file={shareFile}
          onClose={() => setShareFile(null)}
        />
      )}
    </div>
  );
}

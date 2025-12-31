import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getSettings, updateSettings, updateProfile } from '../api/user';
import ThemeToggle from '../components/common/ThemeToggle';

const bytesToGigabytes = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '1';
  return (numeric / (1024 ** 3)).toFixed(2);
};

const gigabytesToBytes = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return '1073741824';
  return Math.round(numeric * (1024 ** 3)).toString();
};

export default function SettingsPage() {
  const { user, fetchUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState(user?.username ?? '');
  const [storageLimitGb, setStorageLimitGb] = useState('1.00');
  const [preferencesText, setPreferencesText] = useState('{}');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  useEffect(() => {
    setUsername(user?.username ?? '');
  }, [user]);

  useEffect(() => {
    if (settingsQuery.data) {
      setStorageLimitGb(bytesToGigabytes(settingsQuery.data.storageLimit));
      setPreferencesText(JSON.stringify(settingsQuery.data.preferences ?? {}, null, 2));
    }
  }, [settingsQuery.data]);

  const profileMutation = useMutation({
    mutationFn: () => updateProfile({ username: username || null }),
    onSuccess: async () => {
      await fetchUser();
      setFeedback('Profil mis à jour.');
      setError(null);
      window.setTimeout(() => setFeedback(null), 2000);
    },
    onError: () => {
      setError('Impossible de mettre à jour le profil.');
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async () => {
      let preferences: Record<string, unknown>;
      try {
        preferences = JSON.parse(preferencesText || '{}');
      } catch {
        throw new Error('Le JSON des préférences est invalide.');
      }
      const storageLimit = gigabytesToBytes(storageLimitGb);
      await updateSettings({ storageLimit, preferences });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
      setFeedback('Paramètres enregistrés.');
      setError(null);
      window.setTimeout(() => setFeedback(null), 2000);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Erreur lors de la sauvegarde.');
    },
  });

  const isLoading = settingsQuery.isLoading;
  const settings = settingsQuery.data;

  const storageSummary = useMemo(() => {
    if (!settings) return null;
    const limitGb = Number(storageLimitGb);
    if (!Number.isFinite(limitGb)) return null;
    return `${limitGb.toFixed(2)} GB alloués`;
  }, [settings, storageLimitGb]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <header className="bg-white dark:bg-zinc-900 shadow-sm border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <div className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            <Link to="/dashboard" className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
              Retour au dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {(feedback || error) && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              feedback 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'
            }`}
          >
            {feedback || error}
          </div>
        )}

        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow dark:shadow-black/20 p-6 border border-transparent dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profil</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Mettre à jour votre nom d'utilisateur.</p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Adresse email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="mt-1 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 px-3 py-2 text-sm text-gray-600 dark:text-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Votre pseudo"
                className="mt-1 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60 shadow-lg shadow-primary-500/25 transition-all"
              >
                {profileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow dark:shadow-black/20 p-6 border border-transparent dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Stockage et préférences</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Configurer votre quota et vos préférences personnalisées.</p>
            </div>
            {storageSummary && <span className="text-xs text-gray-500 dark:text-zinc-400">{storageSummary}</span>}
          </div>

          {isLoading ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-zinc-400">Chargement des paramètres...</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Quota de stockage (en GB)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={storageLimitGb}
                  onChange={(event) => setStorageLimitGb(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Préférences (JSON)</label>
                <textarea
                  value={preferencesText}
                  onChange={(event) => setPreferencesText(event.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 font-mono text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">Exemple: {`{"defaultVisibility":"private"}`}</p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => settingsQuery.refetch()}
                  className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => settingsMutation.mutate()}
                  disabled={settingsMutation.isPending}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60 shadow-lg shadow-primary-500/25 transition-all"
                >
                  {settingsMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

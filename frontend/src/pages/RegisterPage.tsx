import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Lock, Mail, User, UserPlus } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await register(email, password, username || undefined);
      navigate('/dashboard');
    } catch (err) {
      console.error('Register failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-black dark:to-zinc-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/50 w-full max-w-md p-8 border border-transparent dark:border-zinc-800">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4 shadow-lg shadow-primary-500/30">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Créer un compte</h1>
          <p className="text-gray-600 dark:text-zinc-400 mt-2">Rejoignez SelfVault</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Nom d'utilisateur (optionnel)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg 
                         bg-white dark:bg-zinc-800/50 text-gray-900 dark:text-white
                         placeholder-gray-400 dark:placeholder-zinc-500
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Votre pseudo"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg 
                         bg-white dark:bg-zinc-800/50 text-gray-900 dark:text-white
                         placeholder-gray-400 dark:placeholder-zinc-500
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-lg 
                         bg-white dark:bg-zinc-800/50 text-gray-900 dark:text-white
                         placeholder-gray-400 dark:placeholder-zinc-500
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg 
                     transition-all duration-200 flex items-center justify-center gap-2 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Création...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Créer mon compte
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-zinc-400">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
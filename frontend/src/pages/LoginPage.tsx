import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { Lock, Mail, LogIn } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
      toast.success('Connexion réussie', 'Bienvenue sur SelfVault !');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Erreur de connexion', 'Email ou mot de passe incorrect.');
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-black dark:to-zinc-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle - Position fixe en haut à droite */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/50 w-full max-w-md p-8 border border-transparent dark:border-zinc-800">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4 shadow-lg shadow-primary-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SelfVault</h1>
          <p className="text-gray-600 dark:text-zinc-400 mt-2">Connectez-vous à votre compte</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                Connexion...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-zinc-400">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}

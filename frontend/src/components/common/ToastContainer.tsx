import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore, type Toast, type ToastType } from '../../store/toastStore';

const toastConfig: Record<ToastType, { 
  icon: typeof CheckCircle; 
  bgClass: string; 
  borderClass: string;
  iconClass: string;
  titleClass: string;
}> = {
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    borderClass: 'border-green-200 dark:border-green-800',
    iconClass: 'text-green-500 dark:text-green-400',
    titleClass: 'text-green-800 dark:text-green-300',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-red-50 dark:bg-red-900/20',
    borderClass: 'border-red-200 dark:border-red-800',
    iconClass: 'text-red-500 dark:text-red-400',
    titleClass: 'text-red-800 dark:text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    borderClass: 'border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-500 dark:text-amber-400',
    titleClass: 'text-amber-800 dark:text-amber-300',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    borderClass: 'border-blue-200 dark:border-blue-800',
    iconClass: 'text-blue-500 dark:text-blue-400',
    titleClass: 'text-blue-800 dark:text-blue-300',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
        setProgress(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onRemove, 200);
  };

  return (
    <div
      className={`
        relative overflow-hidden w-full max-w-sm rounded-xl border shadow-lg
        ${config.bgClass} ${config.borderClass}
        transform transition-all duration-200 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconClass}`} />
          
          <div className="flex-1 min-w-0">
            <p className={`font-medium ${config.titleClass}`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                {toast.message}
              </p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-lg text-gray-400 dark:text-zinc-500 
                     hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-600 dark:hover:text-zinc-300
                     transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
          <div
            className={`h-full transition-all duration-100 ease-linear ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 items-end"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

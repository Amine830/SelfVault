import type { StorageInfo } from '../../types';

interface QuotaBarProps {
  storage: StorageInfo;
  className?: string;
}

function formatBytes(bytes: string | number): string {
  const value = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (!Number.isFinite(value) || value === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / Math.pow(1024, exponent);
  
  return `${size.toFixed(1)} ${units[exponent]}`;
}

export default function QuotaBar({ storage, className = '' }: QuotaBarProps) {
  const percentage = Math.min(storage.percentage, 100);
  
  // Couleur selon le niveau d'utilisation
  let barColor = 'bg-sky-500';
  if (percentage >= 90) {
    barColor = 'bg-red-500';
  } else if (percentage >= 75) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Espace utilisé</span>
        <span className="text-sm text-gray-500">
          {formatBytes(storage.used)} / {formatBytes(storage.limit)}
        </span>
      </div>
      
      <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="mt-1 text-right">
        <span className={`text-xs font-medium ${percentage >= 90 ? 'text-red-600' : 'text-gray-500'}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

import React from 'react';
import { Loader2 } from 'lucide-react';

export function Loading({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      {Icon && <div className="bg-gray-100 rounded-full p-5"><Icon className="h-10 w-10 text-gray-400" /></div>}
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="bg-red-50 rounded-full p-5">
        <span className="text-3xl">⚠️</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-700">Something went wrong</h3>
      <p className="text-sm text-gray-400 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-2">Try Again</button>
      )}
    </div>
  );
}

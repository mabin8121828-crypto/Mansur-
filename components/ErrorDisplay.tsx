
import React from 'react';
import { AlertTriangleIcon } from './icons';

interface ErrorDisplayProps {
  message: string | null;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="text-center text-red-400 bg-red-900/20 border border-red-500/50 rounded-lg p-6 w-full">
      <AlertTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
      <h3 className="text-xl font-semibold text-red-300 mb-2">操作失败</h3>
      <p className="mb-6">{message || '发生未知错误。'}</p>
      <button
        onClick={onRetry}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
      >
        重试
      </button>
    </div>
  );
};
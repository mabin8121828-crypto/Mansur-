
import React from 'react';
import { LoaderCircleIcon } from './icons';

export const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <LoaderCircleIcon className="w-12 h-12 text-blue-500 animate-spin" />
    </div>
  );
};

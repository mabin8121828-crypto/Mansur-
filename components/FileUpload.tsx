import React, { useCallback, useState } from 'react';
import { UploadCloudIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(`文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB。`);
      return;
    }
    setError(null);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setError(null);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
    // Reset file input to allow re-uploading the same file
    e.target.value = '';
  };

  const baseClasses = "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg transition-colors duration-300 ease-in-out";
  const enabledClasses = "cursor-pointer border-slate-600 bg-slate-800 hover:bg-slate-700/80";
  const disabledClasses = "cursor-not-allowed border-slate-700 bg-slate-800/50 text-slate-500";
  const draggingClasses = "border-blue-400 bg-slate-700/50";
  const errorClasses = "border-red-500/50";

  const dropzoneClasses = `${baseClasses} ${disabled ? disabledClasses : enabledClasses} ${isDragging ? draggingClasses : ''} ${error ? errorClasses : ''}`;

  return (
    <div className="w-full">
      <label
        htmlFor="dropzone-file"
        className={dropzoneClasses}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadCloudIcon className={`w-12 h-12 mb-4 ${disabled ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`mb-2 text-lg ${disabled ? 'text-slate-600' : 'text-slate-300'}`}>
            <span className="font-semibold">点击上传</span> 或拖放文件
          </p>
          <p className={`text-sm ${disabled ? 'text-slate-600' : 'text-slate-500'}`}>支持 MP3, WAV, M4A 等格式 (最大 50MB)</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" onChange={handleChange} accept="audio/*" disabled={disabled} />
      </label>
      {error && <p className="mt-2 text-sm text-center text-red-400">{error}</p>}
    </div>
  );
};

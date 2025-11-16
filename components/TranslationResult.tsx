import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ClipboardCopyIcon, CheckIcon, FileAudioIcon, DownloadIcon } from './icons';
import { decodeBase64, pcmToWavBlob } from '../utils/audioUtils';

interface TranslationResultProps {
  result: {
    text: string;
    audioB64: string;
  };
  fileName: string;
  onReset: () => void;
}

export const TranslationResult: React.FC<TranslationResultProps> = ({ result, fileName, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result.text]);

  const audioUrl = useMemo(() => {
    if (!result.audioB64) return null;
    try {
      const pcmBytes = decodeBase64(result.audioB64);
      const wavBlob = pcmToWavBlob(pcmBytes.buffer);
      return URL.createObjectURL(wavBlob);
    } catch (e) {
      console.error("Failed to create audio URL:", e);
      return null;
    }
  }, [result.audioB64]);
  
  const handleDownload = useCallback(() => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-z0-9_ -.]/gi, '_').replace(/^_*/, '');
    const baseName = sanitizedFileName.split('.')[0] || 'audio';
    link.download = `${baseName}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [audioUrl, fileName]);


  useEffect(() => {
    // Cleanup object URL to prevent memory leaks
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);


  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center gap-3 bg-slate-700/50 p-3 rounded-lg">
        <FileAudioIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
        <p className="text-slate-300 truncate font-mono text-sm" title={fileName}>{fileName}</p>
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="w-full rounded-md">
            您的浏览器不支持音频播放。
        </audio>
      )}
      
      <div className="relative">
        <textarea
          readOnly
          value={result.text}
          className="w-full h-48 p-4 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 text-base leading-relaxed resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label="对话脚本"
        />
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-md bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition-all"
          aria-label="复制脚本内容"
        >
          {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardCopyIcon className="w-5 h-5 text-slate-400" />}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
            onClick={handleDownload}
            disabled={!audioUrl}
            className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 flex items-center justify-center gap-2"
        >
          <DownloadIcon className="w-5 h-5" />
          <span>下载音频 (.wav)</span>
        </button>
        <button
          onClick={onReset}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500"
        >
          创建新的内容
        </button>
      </div>
    </div>
  );
};

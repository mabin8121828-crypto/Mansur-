import React, { useState } from 'react';
import { PencilLineIcon } from './icons';

interface TextToSpeechInputProps {
  onGenerate: (text: string) => void;
  disabled: boolean;
  isNarrationMode: boolean;
}

export const TextToSpeechInput: React.FC<TextToSpeechInputProps> = ({ onGenerate, disabled, isNarrationMode }) => {
  const [text, setText] = useState('');

  const handleGenerate = () => {
    if (!disabled && text.trim()) {
      onGenerate(text);
    }
  };

  const title = isNarrationMode ? "从文本创建旁白" : "从文本创建对话";
  const description = isNarrationMode ? "输入一个主题或想法，AI将为您创作旁白或文章。" : "输入一个主题或想法，AI将为您创作对话脚本。";
  const buttonText = isNarrationMode ? "创建旁白脚本" : "创建对话脚本";

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-slate-300">
            {title}
        </h3>
        <p className="text-sm text-slate-400">
            {description}
        </p>
        <p className="text-xs text-slate-500 bg-slate-900/50 p-2 rounded-md border border-slate-700 max-w-md mx-auto">
            提示：脚本将使用上方“语音选择”中设定的声音，您可在上方预览。
        </p>
      </div>
      
      <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-40 p-4 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 text-base leading-relaxed resize-y focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          aria-label="用于生成脚本的主题输入框"
          placeholder="例如：人工智能在艺术创作中的未来"
          disabled={disabled}
      />
      <button
          onClick={handleGenerate}
          disabled={disabled || !text.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 flex items-center justify-center gap-2"
      >
          <PencilLineIcon className="w-5 h-5" />
          <span>{buttonText}</span>
      </button>
    </div>
  );
};

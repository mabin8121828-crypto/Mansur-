import React, { useState } from 'react';

interface TextEditorProps {
  initialText: string;
  onFinalize: (editedText: string) => void;
  onCancel: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ initialText, onFinalize, onCancel }) => {
  const [text, setText] = useState(initialText);

  const handleFinalize = () => {
    onFinalize(text);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-center text-slate-200">编辑脚本</h2>
      <p className="text-sm text-center text-slate-400 -mt-2 mb-2">
        在生成最终音频之前，请检查并编辑生成的脚本。
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-64 p-4 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 text-base leading-relaxed resize-y focus:ring-2 focus:ring-blue-500 focus:outline-none"
        aria-label="可编辑的脚本"
      />
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onCancel}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500"
        >
          取消
        </button>
        <button
          onClick={handleFinalize}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500"
        >
          生成音频
        </button>
      </div>
    </div>
  );
};
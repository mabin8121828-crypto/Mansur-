import React from 'react';
import type { VoiceOption } from '../types';
import { LoaderCircleIcon, Volume2Icon, BookTextIcon } from './icons';

interface VoiceSelectorProps {
  availableVoices: VoiceOption[];
  primaryVoice: string;
  onPrimaryVoiceChange: (voice: string) => void;
  secondaryVoice: string;
  onSecondaryVoiceChange: (voice: string) => void;
  outputLanguage: string;
  onOutputLanguageChange: (language: string) => void;
  isNarrationMode: boolean;
  onNarrationModeChange: (enabled: boolean) => void;
  onPreviewVoice: (voice: string) => void;
  previewingVoice: string | null;
  voiceError: string | null;
  previewError: string | null;
}

const Switch: React.FC<{ checked: boolean; onCheckedChange: (checked: boolean) => void; }> = ({ checked, onCheckedChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`${
        checked ? 'bg-blue-600' : 'bg-slate-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
    >
        <span
        aria-hidden="true"
        className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);


export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  availableVoices,
  primaryVoice,
  onPrimaryVoiceChange,
  secondaryVoice,
  onSecondaryVoiceChange,
  outputLanguage,
  onOutputLanguageChange,
  isNarrationMode,
  onNarrationModeChange,
  onPreviewVoice,
  previewingVoice,
  voiceError,
  previewError,
}) => {
  const commonSelectClasses = "w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors";
  const commonButtonClasses = "p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-200 hover:bg-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="mb-6 p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
        <h2 className="text-xl font-semibold text-slate-200 mb-4 text-center">语音和语言设置</h2>
        <div className="flex flex-col gap-4">
            <div className='flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-600'>
                <div className='flex items-center gap-2'>
                     <BookTextIcon className="w-5 h-5 text-blue-400"/>
                    <label htmlFor="narration-mode" className="font-medium text-slate-300">
                        旁白模式
                    </label>
                </div>
                <Switch checked={isNarrationMode} onCheckedChange={onNarrationModeChange} />
            </div>
             <div>
                <label htmlFor="output-language" className="block text-sm font-medium text-slate-400 mb-2">
                    输出语言
                </label>
                <select
                    id="output-language"
                    value={outputLanguage}
                    onChange={(e) => onOutputLanguageChange(e.target.value)}
                    className={commonSelectClasses}
                >
                    <option value="中文">中文</option>
                    <option value="English (英语)">English (英语)</option>
                </select>
            </div>
            <div className={`grid grid-cols-1 ${isNarrationMode ? '' : 'sm:grid-cols-2'} gap-4`}>
                <div>
                    <label htmlFor="primary-voice" className="block text-sm font-medium text-slate-400 mb-2">
                        {isNarrationMode ? '旁白声音' : '主说话人 (主持人)'}
                    </label>
                    <div className="flex gap-2">
                        <select
                            id="primary-voice"
                            value={primaryVoice}
                            onChange={(e) => onPrimaryVoiceChange(e.target.value)}
                            className={commonSelectClasses}
                        >
                            {availableVoices.map(voice => (
                                <option key={voice.name} value={voice.name}>
                                    {voice.name} - {voice.description}
                                </option>
                            ))}
                        </select>
                        <button 
                            onClick={() => onPreviewVoice(primaryVoice)} 
                            className={commonButtonClasses}
                            disabled={!!previewingVoice}
                            aria-label={`试听 ${primaryVoice} 声音`}
                        >
                            {previewingVoice === primaryVoice ? 
                                <LoaderCircleIcon className="w-5 h-5 animate-spin" /> : 
                                <Volume2Icon className="w-5 h-5" />
                            }
                        </button>
                    </div>
                </div>
                {!isNarrationMode && (
                    <div>
                        <label htmlFor="secondary-voice" className="block text-sm font-medium text-slate-400 mb-2">
                            副说话人 (嘉宾)
                        </label>
                         <div className="flex gap-2">
                            <select
                                id="secondary-voice"
                                value={secondaryVoice}
                                onChange={(e) => onSecondaryVoiceChange(e.target.value)}
                                className={commonSelectClasses}
                            >
                                 {availableVoices.map(voice => (
                                    <option key={voice.name} value={voice.name}>
                                        {voice.name} - {voice.description}
                                    </option>
                                ))}
                            </select>
                            <button 
                                onClick={() => onPreviewVoice(secondaryVoice)} 
                                className={commonButtonClasses}
                                disabled={!!previewingVoice}
                                aria-label={`试听 ${secondaryVoice} 声音`}
                            >
                                {previewingVoice === secondaryVoice ? 
                                    <LoaderCircleIcon className="w-5 h-5 animate-spin" /> : 
                                    <Volume2Icon className="w-5 h-5" />
                                }
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        {(voiceError || previewError) && (
            <div className="mt-4 text-center text-red-400 text-sm">
                {voiceError || previewError}
            </div>
        )}
    </div>
  );
};

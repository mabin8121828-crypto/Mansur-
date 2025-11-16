import React, { useReducer, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { TranslationResult } from './components/TranslationResult';
import { TextEditor } from './components/TextEditor';
import { Loader } from './components/Loader';
import { ErrorDisplay } from './components/ErrorDisplay';
import { translateAudioToTargetLanguageText, generateSpeechFromText, generatePreviewAudio, generateDialogueScriptFromText } from './services/geminiService';
import { toBase64 } from './utils/fileUtils';
import { playAudioFromBase64 } from './utils/audioUtils';
import type { State, Action, VoiceOption } from './types';
import { VoiceSelector } from './components/VoiceSelector';
import { TextToSpeechInput } from './components/TextToSpeechInput';

const availableVoices: VoiceOption[] = [
  { name: 'Zephyr', description: '男声, 深沉有力' },
  { name: 'Puck', description: '男声, 年轻活泼' },
  { name: 'Charon', description: '男声, 成熟稳重' },
  { name: 'Kore', description: '女声, 温柔清晰' },
  { name: 'Fenrir', description: '男声, 响亮热情' },
  { name: 'Erinome', description: '女声, 优雅知性' },
  { name: 'Achernar', description: '男声, 明亮' },
  { name: 'Achird', description: '女声, 友好' },
  { name: 'Algenib', description: '男声, 专业' },
  { name: 'Algieba', description: '女声, 沉静' },
  { name: 'Alnilam', description: '男声, 权威' },
  { name: 'Aoede', description: '女声, 活泼' },
  { name: 'Autonoe', description: '女声, 自信' },
  { name: 'Callirrhoe', description: '女声, 甜美' },
  { name: 'Despina', description: '女声, 柔和' },
  { name: 'Enceladus', description: '男声, 温和' },
  { name: 'Gacrux', description: '男声, 可靠' },
  { name: 'Iapetus', description: '男声, 严肃' },
];

const initialState: State = {
  status: 'idle',
  loadingMessage: '',
  result: null,
  scriptText: '',
  sourceDescription: '',
  error: null,
  primaryVoice: availableVoices[0].name,
  secondaryVoice: availableVoices[1].name,
  outputLanguage: '中文',
  isNarrationMode: false,
  previewingVoice: null,
  voiceError: null,
  previewError: null,
};

function appReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'RESET':
      return {
        ...initialState,
        // Keep user's settings on reset, but clear results
        primaryVoice: state.primaryVoice,
        secondaryVoice: state.secondaryVoice,
        outputLanguage: state.outputLanguage,
        isNarrationMode: state.isNarrationMode,
      };
    case 'START_PROCESSING':
      return {
        ...state,
        status: 'processing',
        sourceDescription: action.payload.sourceDescription,
        loadingMessage: action.payload.loadingMessage,
        error: null,
        result: null,
        scriptText: '',
      };
    case 'EDIT_SCRIPT':
      return { ...state, status: 'editing', scriptText: action.payload };
    case 'START_FINALIZING':
      return {
        ...state,
        status: 'finalizing',
        loadingMessage: `正在为 “${state.sourceDescription}” 生成最终音频...`,
        scriptText: action.payload,
        error: null,
        result: null,
      };
    case 'SET_SUCCESS':
      return { ...state, status: 'success', result: action.payload };
    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload };
    case 'CANCEL_EDIT':
      return {
        ...state,
        status: 'idle',
        result: null,
        error: null,
        scriptText: '',
        sourceDescription: '',
      };
    case 'SET_PRIMARY_VOICE':
      return { ...state, primaryVoice: action.payload };
    case 'SET_SECONDARY_VOICE':
      return { ...state, secondaryVoice: action.payload };
    case 'VALIDATE_VOICES': {
      if (!state.isNarrationMode && state.primaryVoice === state.secondaryVoice) {
        return { ...state, voiceError: "主副说话人的声音必须不同。" };
      }
      return { ...state, voiceError: null };
    }
    case 'SET_OUTPUT_LANGUAGE':
      return { ...state, outputLanguage: action.payload };
    case 'TOGGLE_NARRATION_MODE': {
      const isNarrationMode = !state.isNarrationMode;
      const voiceError = isNarrationMode ? null : (state.primaryVoice === state.secondaryVoice ? "主副说话人的声音必须不同。" : null);
      return { ...state, isNarrationMode, voiceError };
    }
    case 'START_PREVIEW':
      return { ...state, previewingVoice: action.payload, previewError: null };
    case 'END_PREVIEW':
      return { ...state, previewingVoice: null };
    case 'SET_PREVIEW_ERROR':
      return { ...state, previewError: action.payload };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'VALIDATE_VOICES' });
  }, [state.primaryVoice, state.secondaryVoice, state.isNarrationMode]);

  const handlePreviewVoice = useCallback(async (voiceName: string) => {
    if (state.previewingVoice) return;
    dispatch({ type: 'START_PREVIEW', payload: voiceName });
    try {
        const audioB64 = await generatePreviewAudio(voiceName, state.outputLanguage);
        playAudioFromBase64(audioB64);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '无法预览声音。';
        console.error('Preview failed:', errorMessage);
        dispatch({ type: 'SET_PREVIEW_ERROR', payload: '试听失败。' });
        setTimeout(() => dispatch({ type: 'SET_PREVIEW_ERROR', payload: null }), 3000);
    } finally {
        dispatch({ type: 'END_PREVIEW' });
    }
  }, [state.previewingVoice, state.outputLanguage]);
  
  const handleFileSelect = useCallback(async (file: File) => {
    if (state.voiceError) return;
    dispatch({ type: 'START_PROCESSING', payload: {
        sourceDescription: file.name,
        loadingMessage: `[1/2] 正在上传和处理 “${file.name}”...`,
    }});
    try {
      const base64Audio = await toBase64(file);
      dispatch({ type: 'START_PROCESSING', payload: {
        sourceDescription: file.name,
        loadingMessage: `[2/2] 正在识别语音并生成${state.outputLanguage}脚本...`,
      }});
      const textResult = await translateAudioToTargetLanguageText(base64Audio, file.type, state.outputLanguage, state.isNarrationMode);
      dispatch({ type: 'EDIT_SCRIPT', payload: textResult });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
      console.error('Text generation from audio failed:', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.voiceError, state.outputLanguage, state.isNarrationMode]);
  
  const handleGenerateScript = useCallback(async (topic: string) => {
    if (!topic.trim() || state.voiceError) return;
    dispatch({ type: 'START_PROCESSING', payload: {
      sourceDescription: `主题：“${topic}”`,
      loadingMessage: `正在为您的主题创作${state.outputLanguage}脚本...`,
    }});
    try {
        const script = await generateDialogueScriptFromText(topic, state.outputLanguage, state.isNarrationMode);
        dispatch({ type: 'EDIT_SCRIPT', payload: script });
    } catch(err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
        console.error('Script generation failed:', errorMessage);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.voiceError, state.outputLanguage, state.isNarrationMode]);

  const handleFinalize = useCallback(async (editedText: string) => {
    dispatch({ type: 'START_FINALIZING', payload: editedText });
    try {
        const finalResult = await generateSpeechFromText(editedText, state.primaryVoice, state.secondaryVoice, state.isNarrationMode);
        dispatch({ type: 'SET_SUCCESS', payload: finalResult });
    } catch(err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
        console.error('Speech generation failed:', errorMessage);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.primaryVoice, state.secondaryVoice, state.isNarrationMode]);

  const renderContent = () => {
    switch (state.status) {
      case 'idle':
        return (
          <div className="w-full flex flex-col gap-6">
            <FileUpload onFileSelect={handleFileSelect} disabled={!!state.voiceError} />
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-4 text-slate-500 font-medium">或</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>
            <TextToSpeechInput onGenerate={handleGenerateScript} disabled={!!state.voiceError} isNarrationMode={state.isNarrationMode} />
          </div>
        );
      case 'processing':
      case 'finalizing':
         return (
          <div className="text-center">
            <Loader />
            <p className="text-slate-300 mt-4 text-lg">{state.loadingMessage}</p>
            <p className="text-slate-400 mt-2">此过程可能需要一些时间，请稍候。</p>
          </div>
        );
      case 'editing':
        return (
          <TextEditor 
            initialText={state.scriptText}
            onFinalize={handleFinalize}
            onCancel={() => dispatch({ type: 'CANCEL_EDIT' })}
          />
        );
      case 'success':
        return (
          state.result && state.sourceDescription && (
            <TranslationResult
              result={state.result}
              fileName={state.sourceDescription}
              onReset={() => dispatch({ type: 'RESET' })}
            />
          )
        );
      case 'error':
        return <ErrorDisplay message={state.error} onRetry={() => dispatch({ type: 'RESET' })} />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Mansur博客中心
          </h1>
          <p className="mt-3 text-lg text-slate-400">
            上传音频或输入主题，生成多语言、多角色的对话或旁白。
          </p>
        </header>
        
        {state.status === 'idle' || state.status === 'editing' ? (
          <VoiceSelector
            availableVoices={availableVoices}
            primaryVoice={state.primaryVoice}
            onPrimaryVoiceChange={(v) => dispatch({ type: 'SET_PRIMARY_VOICE', payload: v })}
            secondaryVoice={state.secondaryVoice}
            onSecondaryVoiceChange={(v) => dispatch({ type: 'SET_SECONDARY_VOICE', payload: v })}
            outputLanguage={state.outputLanguage}
            onOutputLanguageChange={(l) => dispatch({ type: 'SET_OUTPUT_LANGUAGE', payload: l })}
            isNarrationMode={state.isNarrationMode}
            onNarrationModeChange={() => dispatch({ type: 'TOGGLE_NARRATION_MODE' })}
            onPreviewVoice={handlePreviewVoice}
            previewingVoice={state.previewingVoice}
            voiceError={state.voiceError}
            previewError={state.previewError}
          />
        ) : null}
        
        <div className="bg-slate-800/50 rounded-xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm border border-slate-700 flex items-center justify-center">
          {renderContent()}
        </div>
        <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>由 Google Gemini 强力驱动</p>
        </footer>
      </div>
    </main>
  );
}

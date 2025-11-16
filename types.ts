
// The main application state, managed by a reducer
export type State = {
  status: 'idle' | 'processing' | 'editing' | 'finalizing' | 'success' | 'error';
  loadingMessage: string;
  result: { text: string; audioB64: string } | null;
  scriptText: string;
  sourceDescription: string;
  error: string | null;
  
  // Settings
  primaryVoice: string;
  secondaryVoice: string;
  outputLanguage: string;
  isNarrationMode: boolean;

  // UI state
  previewingVoice: string | null;
  voiceError: string | null;
  previewError: string | null;
};

// All possible actions that can be dispatched to update the state
export type Action =
  | { type: 'RESET' }
  | { type: 'START_PROCESSING'; payload: { sourceDescription: string; loadingMessage: string; } }
  | { type: 'EDIT_SCRIPT'; payload: string }
  | { type: 'START_FINALIZING'; payload: string }
  | { type: 'SET_SUCCESS'; payload: { text: string; audioB64: string; } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SET_PRIMARY_VOICE'; payload: string }
  | { type: 'SET_SECONDARY_VOICE'; payload: string }
  | { type: 'VALIDATE_VOICES' }
  | { type: 'SET_OUTPUT_LANGUAGE'; payload: string }
  | { type: 'TOGGLE_NARRATION_MODE' }
  | { type: 'START_PREVIEW'; payload: string }
  | { type: 'END_PREVIEW' }
  | { type: 'SET_PREVIEW_ERROR'; payload: string | null };

// Voice data structure with descriptions
export type VoiceOption = {
  name: string;
  description: string;
};

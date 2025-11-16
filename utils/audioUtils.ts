// Helper to write string to DataView
function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Convert raw PCM data to a WAV file Blob
export function pcmToWavBlob(pcmData: ArrayBuffer): Blob {
  const sampleRate = 24000; // As specified by Gemini TTS
  const numChannels = 1;
  const bitsPerSample = 16; // PCM is 16-bit

  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.byteLength;

  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // fileSize
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, 1, true); // audio format (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  return new Blob([view, pcmData], { type: 'audio/wav' });
}

// Decode base64 string to Uint8Array
export function decodeBase64(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Play audio from a base64 encoded string
export function playAudioFromBase64(base64Audio: string) {
  try {
    const pcmBytes = decodeBase64(base64Audio);
    const wavBlob = pcmToWavBlob(pcmBytes.buffer);
    const audioUrl = URL.createObjectURL(wavBlob);
    
    const audio = new Audio(audioUrl);
    audio.play();

    // Clean up the object URL after the audio has finished playing
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
    audio.onerror = (e) => {
        console.error("Error playing audio:", e);
        URL.revokeObjectURL(audioUrl);
    }
  } catch (error) {
    console.error("Failed to play audio from base64 string:", error);
  }
}
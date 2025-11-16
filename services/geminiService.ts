import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const languageMap: { [key: string]: string } = {
    '中文': '简体中文',
    'English (英语)': 'English',
};

const testPhrases: { [key: string]: string } = {
    '中文': '你好，这是一个声音测试。',
    'English (英语)': 'Hello, this is a voice test.',
};

export async function generatePreviewAudio(voiceName: string, language: string): Promise<string> {
    try {
        const text = testPhrases[language] || testPhrases['中文'];

        const ttsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }], 
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const audioB64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioB64) {
            throw new Error("Failed to generate preview audio.");
        }

        return audioB64;

    } catch (error) {
        console.error("Error calling Gemini API for preview:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get preview audio from Gemini API: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating preview audio.");
    }
}

export async function generateDialogueScriptFromText(topic: string, language: string, isNarrationMode: boolean): Promise<string> {
  try {
    const targetLanguage = languageMap[language] || '简体中文';
    
    const modeInstruction = isNarrationMode
        ? `You are a professional writer. Based on the following topic, write an engaging and insightful article or narration script in ${targetLanguage}. Return only the script content directly, without any preamble or conclusion.`
        : `You are a professional podcast scriptwriter. Based on the following topic, create a natural and engaging ${targetLanguage} dialogue script with two roles. Use language-agnostic labels for the speakers (e.g., SPEAKER_1, SPEAKER_2). The script should be insightful and captivating. Return only the script content directly, without any preamble or conclusion. Use the format:\nSPEAKER_1: [Content]\nSPEAKER_2: [Content]`;

    const prompt = `${modeInstruction}\n\nTopic: "${topic}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    
    const script = response.text.trim();
    if (!script) {
      throw new Error("模型未能生成脚本。");
    }
    return script;

  } catch (error) {
    console.error("Error calling Gemini API for script generation:", error);
    if (error instanceof Error) {
      throw new Error(`从Gemini API生成脚本失败: ${error.message}`);
    }
    throw new Error("在生成脚本过程中发生未知错误。");
  }
}


export async function translateAudioToTargetLanguageText(
  base64Audio: string, 
  audioMimeType: string,
  language: string,
  isNarrationMode: boolean
): Promise<string> {
    try {
        const targetLanguage = languageMap[language] || '简体中文';
        const audioPart = {
            inlineData: {
                mimeType: audioMimeType,
                data: base64Audio,
            },
        };

        const modeInstruction = isNarrationMode
            ? `Please transcribe this audio into a single-speaker narration script. Then, translate the entire script into ${targetLanguage}. Provide ONLY the translated ${targetLanguage} text.`
            : `Please transcribe this audio. Identify each different speaker using neutral, language-agnostic labels like SPEAKER_1, SPEAKER_2, etc. Then, translate the entire dialogue into ${targetLanguage}, ensuring you preserve these exact speaker labels. Provide ONLY the translated ${targetLanguage} text with the speaker labels, using the following format:\nSPEAKER_1: [Translated content]\nSPEAKER_2: [Translated content]`;

        const textPart = { text: modeInstruction };

        const translationResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [audioPart, textPart] },
        });

        const translatedText = translationResponse.text.trim();
        if (!translatedText) {
            throw new Error("The model did not return any translated text.");
        }
        return translatedText;

    } catch (error) {
        console.error("Error calling Gemini API for text translation:", error);
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                throw new Error('The provided API key is invalid. Please check your configuration.');
            }
            throw new Error(`Failed to get text from Gemini API: ${error.message}`);
        }
        throw new Error("An unknown error occurred during text translation.");
    }
}

export async function generateSpeechFromText(
  text: string,
  primaryVoice: string,
  secondaryVoice: string,
  isNarrationMode: boolean
): Promise<{ text: string; audioB64: string; }> {
    try {
        let speechConfig;
        let textForTTS = text;

        if (isNarrationMode) {
            // Narration mode always uses a single voice.
            // We still clean up potential speaker labels just in case the model returns them.
            textForTTS = text.split('\n')
                .map(line => line.trim().replace(/^(.+?)(:|：)\s*/, ''))
                .join('\n');

            speechConfig = {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: primaryVoice } },
            };
        } else {
            // Dialogue mode logic
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length === 0) throw new Error("Input text is empty.");

            const speakerRegex = /^(.+?)(:|：)\s*/;

            const uniqueSpeakers = [...new Set(
                lines
                    .map(line => line.match(speakerRegex)?.[1]?.trim())
                    .filter((s): s is string => !!s)
            )];

            if (uniqueSpeakers.length >= 2) {
                const primarySpeakerLabel = "SPEAKER_1";
                const secondarySpeakerLabel = "SPEAKER_2";
                
                const speakerMap = new Map<string, string>();
                speakerMap.set(uniqueSpeakers[0], primarySpeakerLabel);
                for (let i = 1; i < uniqueSpeakers.length; i++) {
                    speakerMap.set(uniqueSpeakers[i], secondarySpeakerLabel);
                }

                let lastKnownSpeaker = primarySpeakerLabel;
                const processedLines = lines.map(line => {
                    const match = line.match(speakerRegex);
                    if (match) {
                        const originalSpeaker = match[1].trim();
                        const mappedSpeaker = speakerMap.get(originalSpeaker) || secondarySpeakerLabel;
                        const lineText = line.substring(match[0].length).trim();
                        if (lineText) {
                            lastKnownSpeaker = mappedSpeaker;
                            return `${mappedSpeaker}: ${lineText}`;
                        }
                        return null; // Ignore lines with only a speaker tag
                    }
                    // If no speaker tag, assign to the last known speaker
                    return `${lastKnownSpeaker}: ${line}`;
                }).filter((l): l is string => l !== null);

                textForTTS = processedLines.join('\n');
                
                speechConfig = {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            { speaker: primarySpeakerLabel, voiceConfig: { prebuiltVoiceConfig: { voiceName: primaryVoice } } },
                            { speaker: secondarySpeakerLabel, voiceConfig: { prebuiltVoiceConfig: { voiceName: secondaryVoice } } }
                        ],
                    }
                };
            } else {
                // This block handles 0 or 1 unique speakers in dialogue mode.
                textForTTS = lines.map(line => {
                    const match = line.match(speakerRegex);
                    return match ? line.substring(match[0].length).trim() : line;
                }).join('\n');

                speechConfig = {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: primaryVoice } },
                };
            }
        }

        if (!textForTTS.trim()) {
            throw new Error("Processed text for TTS is empty.");
        }

        const ttsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textForTTS }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig,
            },
        });

        const audioB64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioB64) {
            throw new Error("Failed to generate audio from the text.");
        }

        return { text: text, audioB64 };

    } catch (error) {
        console.error("Error calling Gemini API for speech generation:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate speech from Gemini API: ${error.message}`);
        }
        throw new Error("An unknown error occurred during speech generation.");
    }
}

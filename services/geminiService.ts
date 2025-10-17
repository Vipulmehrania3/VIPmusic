import { GoogleGenAI, Modality } from "@google/genai";

// Assume process.env.API_KEY is available in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateMusic(
  genre: string, 
  style: string, 
  customLyrics?: string
): Promise<{ lyrics: string; audioBase64: string }> {
  try {
    let finalLyrics: string;

    if (customLyrics) {
      finalLyrics = customLyrics;
    } else {
      // Step 1: Generate lyrics with the text model if none are provided
      const lyricsPrompt = `Generate short, catchy song lyrics. The genre is ${genre} and the style is '${style}'. The lyrics should be a single, cohesive block of text, perfect for singing. Do not include song structure labels like "[Verse]", "[Chorus]", or any other metadata. Just provide the raw lyrics.`;

      const textModel = 'gemini-2.5-flash';
      const lyricsResponse = await ai.models.generateContent({
        model: textModel,
        contents: lyricsPrompt,
      });
      
      const generatedLyrics = lyricsResponse.text;

      if (!generatedLyrics) {
        throw new Error("AI failed to generate lyrics.");
      }
      finalLyrics = generatedLyrics;
    }
    
    // Step 2: Generate audio from the final lyrics with the TTS model
    const ttsModel = 'gemini-2.5-flash-preview-tts';
    
    // Enhanced prompt to encourage a more musical and stylized performance.
    // While the model doesn't compose music, this can influence the vocal delivery.
    const audioPrompt = `Sing the following lyrics in a melodic, ${style} ${genre} style with an Indian accent. The performance should be expressive and song-like:

${finalLyrics}`;

    const audioResponse = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ parts: [{ text: audioPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              // Using a versatile voice. The "Indian accent" is requested in the prompt.
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, 
            },
        },
      },
    });

    const audioBase64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      throw new Error("AI failed to generate audio.");
    }

    return { lyrics: finalLyrics, audioBase64 };
  } catch (error) {
    console.error("Error in Gemini service:", error);
    throw new Error("Failed to generate music. Please check your API key and try again.");
  }
}

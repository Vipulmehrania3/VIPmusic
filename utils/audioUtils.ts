// Decodes a base64 string into a Uint8Array.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Encodes a Uint8Array into a base64 string.
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Fix: Create a helper function to write strings into a DataView to avoid modifying the DataView prototype.
function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Encodes raw PCM audio samples into a WAV file format ArrayBuffer.
function encodeWAV(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const bufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // RIFF header
  // Fix: Replaced prototype method with a local helper function `writeString` to fix TypeScript errors.
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  // Fix: Replaced prototype method with a local helper function `writeString` to fix TypeScript errors.
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  // Fix: Replaced prototype method with a local helper function `writeString` to fix TypeScript errors.
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, 1, true); // Audio format (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  // Fix: Replaced prototype method with a local helper function `writeString` to fix TypeScript errors.
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }

  return buffer;
}

// Creates a playable audio data URL (WAV format) from a base64 encoded string of raw PCM data.
export function createWavUrl(base64Pcm: string): string {
  const pcmBytes = decode(base64Pcm);
  
  // The raw data from Gemini TTS is 16-bit PCM.
  // We can create a view of the Uint8Array's buffer as an Int16Array.
  const pcmSamples = new Int16Array(pcmBytes.buffer);

  // The Gemini TTS model outputs at a 24000 Hz sample rate.
  const sampleRate = 24000;

  const wavBuffer = encodeWAV(pcmSamples, sampleRate);
  const wavBytes = new Uint8Array(wavBuffer);
  const wavBase64 = encode(wavBytes);
  
  return `data:audio/wav;base64,${wavBase64}`;
}

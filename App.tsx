import React, { useState, useCallback } from 'react';
import { generateMusic } from './services/geminiService';
import { createWavUrl } from './utils/audioUtils';
import { type GeneratedSong } from './types';
import Loader from './components/Loader';

const GENRES = ["Pop", "Rock", "Jazz", "Hip-Hop", "Electronic", "Folk", "Classical", "R&B"];

type LyricMode = 'ai' | 'custom';

const Header: React.FC = () => (
  <header className="text-center my-8">
    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
      AI Music Generator
    </h1>
    <p className="text-gray-400 mt-2">Craft a song from just a genre and a style.</p>
  </header>
);

const App: React.FC = () => {
  const [genre, setGenre] = useState<string>(GENRES[0]);
  const [style, setStyle] = useState<string>('Upbeat and catchy');
  const [lyricMode, setLyricMode] = useState<LyricMode>('ai');
  const [customLyrics, setCustomLyrics] = useState<string>('');
  const [song, setSong] = useState<GeneratedSong | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (lyricMode === 'custom' && !customLyrics.trim()) {
      setError("Please enter your custom lyrics before generating.");
      return;
    }
     if (!genre || !style) {
      setError("Please select a genre and provide a style.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSong(null);

    try {
      const lyricsToUse = lyricMode === 'custom' ? customLyrics : undefined;
      const { lyrics, audioBase64 } = await generateMusic(genre, style, lyricsToUse);
      if (audioBase64) {
        const audioUrl = createWavUrl(audioBase64);
        setSong({ lyrics, audioUrl });
      } else {
        throw new Error("The AI could not generate audio for the song.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [genre, style, lyricMode, customLyrics]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4">
      <div className="w-full max-w-3xl">
        <Header />

        <main>
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700">
             <div className="flex justify-center mb-6 rounded-lg bg-gray-700 p-1">
                <button 
                  onClick={() => setLyricMode('ai')} 
                  className={`px-4 py-2 text-sm font-medium rounded-md w-1/2 transition-colors ${lyricMode === 'ai' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-600/50'}`}
                >
                  AI Lyrics
                </button>
                <button 
                  onClick={() => setLyricMode('custom')} 
                  className={`px-4 py-2 text-sm font-medium rounded-md w-1/2 transition-colors ${lyricMode === 'custom' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-600/50'}`}
                >
                  Custom Lyrics
                </button>
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-2">
                  Genre
                </label>
                <select
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-2">
                  Style / Mood
                </label>
                <input
                  id="style"
                  type="text"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="e.g., Melancholic ballad"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {lyricMode === 'custom' && (
              <div className="mt-6">
                <label htmlFor="customLyrics" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Lyrics
                </label>
                <textarea
                  id="customLyrics"
                  value={customLyrics}
                  onChange={(e) => setCustomLyrics(e.target.value)}
                  placeholder="Enter your song lyrics here..."
                  className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y"
                  aria-label="Custom Lyrics Input"
                />
              </div>
            )}
            
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader />
                  <span className="ml-2">Composing...</span>
                </>
              ) : (
                "Generate Music"
              )}
            </button>
          </div>

          <div className="mt-8">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center">
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}
            
            {!isLoading && !song && !error && (
                <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-700 rounded-lg">
                    <p>Your generated song will appear here.</p>
                </div>
            )}

            {song && (
              <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-purple-300">Your AI-Generated Song</h2>
                <audio controls src={song.audioUrl} className="w-full rounded-lg mb-6">
                  Your browser does not support the audio element.
                </audio>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-300">Lyrics</h3>
                  <pre className="bg-gray-900/50 p-4 rounded-lg text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {song.lyrics}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;

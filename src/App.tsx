import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';
import { Loader2, Copy, X, Trash2, FileText, Languages, Download, Brain, Globe, Search } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import OpenAI from 'openai';

const t = {
  title: 'YouTube AI',
  subtitle: 'Simply paste any YouTube video URL and get an instant transcript with AI-powered summary',
  enterUrl: 'Enter YouTube URL',
  transcribe: 'Transcribe',
  transcribing: 'Transcribing...',
  transcript: 'Transcript',
  summary: 'Summary',
  download: 'Download',
  time: 'Time',
  text: 'Text',
  transcriptPlaceholder: 'Transcript will appear here...',
  summaryPlaceholder: 'Summary will appear here after transcription...',
  generating: 'Generating summary...',
  previousVideos: 'Previous Videos',
  clearAll: 'Clear All',
  noSavedVideos: 'No saved videos',
  localStorageNote: 'Note: Video data is stored locally in your browser. Clearing your browser cache or local storage will remove all saved videos.',
  developedBy: 'Developed by',
  search: 'Search in transcript',
  searchPlaceholder: 'What are you looking for?',
  searching: 'Searching...'
};

interface TranscriptChunk {
  text: string;
  timestamp: [number, number];
}

interface VideoData {
  url: string;
  transcript: TranscriptChunk[];
  summary?: string;
}

type Language = 'en' | 'ru';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function App() {
  const [url, setUrl] = useState('');
  const [playerRef, setPlayerRef] = useState<ReactPlayer | null>(null);
  const [transcript, setTranscript] = useState<TranscriptChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [translatedSummary, setTranslatedSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [viewMode, setViewMode] = useState<'time' | 'text'>('time');
  const [savedVideos, setSavedVideos] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ timestamp: string; text: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [selectedSummaryLanguage, setSelectedSummaryLanguage] = useState<Language>('en');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);

  // Initialize t with the default translations and ensure it always has a value
  const translations_t = React.useMemo(() => {
    const defaultTranslations = translations[selectedLanguage] || translations['en'];
    return defaultTranslations || {
      title: 'YouTube AI',
      subtitle: 'Simply paste any YouTube video URL and get an instant transcript with AI-powered summary',
      enterUrl: 'Enter YouTube URL',
      transcribe: 'Transcribe',
      transcribing: 'Transcribing...',
      transcript: 'Transcript',
      summary: 'Summary',
      download: 'Download',
      time: 'Time',
      text: 'Text',
      transcriptPlaceholder: 'Transcript will appear here...',
      summaryPlaceholder: 'Summary will appear here after transcription...',
      generating: 'Generating summary...',
      previousVideos: 'Previous Videos',
      clearAll: 'Clear All',
      noSavedVideos: 'No saved videos',
      localStorageNote: 'Note: Video data is stored locally in your browser. Clearing your browser cache or local storage will remove all saved videos.',
      developedBy: 'Developed by',
      search: 'Search in transcript',
      searchPlaceholder: 'What are you looking for?',
      searching: 'Searching...'
    };
  }, [selectedLanguage, translations]);

  const downloadTranscript = () => {
    const element = document.createElement('a');
    let content = '';
    let filename = '';

    if (viewMode === 'time') {
      content = transcript
        .map(chunk => `[${formatTime(chunk.timestamp[0])} - ${formatTime(chunk.timestamp[1])}] ${chunk.text}`)
        .join('\n');
      filename = 'transcript-with-timestamps.txt';
    } else {
      content = transcript.map(chunk => chunk.text).join(' ');
      filename = 'transcript.txt';
    }

    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  useEffect(() => {
    const saved = localStorage.getItem('savedVideos');
    if (saved) {
      setSavedVideos(JSON.parse(saved));
    }
  }, []);

  const generateSummary = async (text: string) => {
    setIsSummarizing(true);
    setSummary('');
    const systemPrompt = selectedSummaryLanguage === 'en' 
      ? `You will receive a long transcript of a video or text content. Your task is to write a high-quality, structured summary of the content in English.`
      : `Вы получите длинную расшифровку видео или текстового контента. Ваша задача - написать качественное, структурированное резюме контента на русском языке.`;

    const format = selectedSummaryLanguage === 'en'
      ? `# Overview
• Who the speaker is and why the material was created
• Core message and problem being solved
• Value proposition of the content

# Content Structure
• Brief breakdown of key points and flow
• Main arguments or concepts presented

# Practical Benefits
• Clear explanation of audience takeaways
• Real-world applications

# Conclusion
A powerful, concise wrap-up

# 🎯 Key Highlights
• Use emojis for each major takeaway
• Focus on actionable insights
• Highlight surprising or unique points

# 💡 Deep Insights
## Pattern 1
Brief explanation of first key pattern or insight

## Pattern 2
Brief explanation of second key pattern or insight`
      : `# Обзор
• Кто спикер и почему был создан материал
• Основной посыл и решаемая проблема
• Ценностное предложение контента

# Структура контента
• Краткая разбивка ключевых моментов
• Основные аргументы и концепции

# Практическая польза
• Четкое объяснение выводов для аудитории
• Применение в реальном мире

# Заключение
Краткий и емкий итог

# 🎯 Ключевые моменты
• Используйте эмодзи для каждого важного вывода
• Фокус на практических рекомендациях
• Выделение неожиданных или уникальных моментов

# 💡 Глубокие выводы
## Паттерн 1
Краткое объяснение первого ключевого паттерна

## Паттерн 2
Краткое объяснение второго ключевого паттерна`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt + '\n\n' + format
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      });

      let fullText = '';
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullText += content;
        setSummary(fullText);
      }
      return fullText;
    } catch (error) {
      console.error('Error generating summary:', error);
      return '';
    } finally {
      setIsSummarizing(false);
    }
  };

  const saveToLocalStorage = (videoData: VideoData) => {
    const updatedVideos = [...savedVideos.filter(v => v.url !== videoData.url), videoData];
    setSavedVideos(updatedVideos);
    localStorage.setItem('savedVideos', JSON.stringify(updatedVideos));
  };

  const deleteVideo = (videoUrl: string) => {
    const updatedVideos = savedVideos.filter(v => v.url !== videoUrl);
    setSavedVideos(updatedVideos);
    localStorage.setItem('savedVideos', JSON.stringify(updatedVideos));
    if (selectedVideo?.url === videoUrl) {
      setModalOpen(false);
    }
  };

  const clearAllVideos = () => {
    setSavedVideos([]);
    localStorage.removeItem('savedVideos');
    setModalOpen(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]{11})/,
      /(?:youtube\.com\/shorts\/)([^#&?]{11})/,
      /(?:youtu\.be\/)([^?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTranscript = async () => {
    if (!url) return;

    setTranslations({});
    setTranslatedSummary('');
    setLoading(true);
    try {
      const videoId = extractVideoId(url);
      if (!videoId) throw new Error('Invalid YouTube URL');

      const response = await fetch(
        `https://youtube-transcribe-fastest-youtube-transcriber.p.rapidapi.com/transcript?url=${encodeURIComponent(url)}&video_id=${videoId}`,
        {
          headers: {
            'x-rapidapi-host': 'youtube-transcribe-fastest-youtube-transcriber.p.rapidapi.com',
            'x-rapidapi-key': import.meta.env.VITE_RAPIDAPI_KEY
          }
        }
      );

      const data = await response.json();
      if (data.status === 'success') {
        // Combine chunks into 30-second intervals
        const combinedChunks: TranscriptChunk[] = [];
        let currentChunk: TranscriptChunk = {
          text: '',
          timestamp: [0, 0]
        };

        data.data.chunks.forEach((chunk: TranscriptChunk) => {
          const chunkDuration = chunk.timestamp[1] - chunk.timestamp[0];
          const currentDuration = currentChunk.timestamp[1] - currentChunk.timestamp[0];

          if (currentDuration + chunkDuration > 30 || currentChunk.text === '') {
            if (currentChunk.text !== '') {
              combinedChunks.push(currentChunk);
            }
            currentChunk = {
              text: chunk.text,
              timestamp: chunk.timestamp
            };
          } else {
            currentChunk.text += ' ' + chunk.text;
            currentChunk.timestamp[1] = chunk.timestamp[1];
          }
        });

        if (currentChunk.text !== '') {
          combinedChunks.push(currentChunk);
        }

        setTranscript(combinedChunks);
        saveToLocalStorage({
          url,
          transcript: combinedChunks
        });
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setTranscript([]);
    }
    setLoading(false);
  };

  const seekTo = (time: number) => {
    if (playerRef) {
      playerRef.seekTo(time, 'seconds');
      // Safely check if the player is ready and has the playVideo method
      const player = playerRef.getInternalPlayer();
      if (player && typeof player.playVideo === 'function') {
        player.playVideo();
      }
    }
  };

  const searchInTranscript = async () => {
    if (!searchQuery || transcript.length === 0) return;
    
    setSearchResults([]);
    setIsSearching(true);
    try {
      const transcriptWithTimestamps = transcript.map(chunk => 
        `[${formatTime(chunk.timestamp[0])}] ${chunk.text}`
      ).join('\n');

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that finds relevant parts in a video transcript based on user queries. 
            The transcript is formatted with timestamps like [MM:SS].
            
            Return your response in this exact JSON format:
            {
              "matches": [
                {
                  "timestamp": "MM:SS",
                  "text": "relevant text from transcript"
                }
              ]
            }
            
            Rules:
            1. Always return valid JSON
            2. Include up to 3 most relevant matches
            3. Keep the text excerpts brief and relevant
            4. Ensure timestamps are in MM:SS format`
          },
          {
            role: 'user',
            content: `Transcript:\n${transcriptWithTimestamps}\n\nQuery: ${searchQuery}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content || '';
      
      try {
        // Clean the content by removing markdown formatting
        const cleanContent = content.replace(/^```json\n|\n```$/g, '');
        const parsedResults = JSON.parse(cleanContent);
        
        if (Array.isArray(parsedResults.matches)) {
          setSearchResults(parsedResults.matches);
        } else {
          console.error('Invalid search results format:', parsedResults);
          setSearchResults([]);
        }
      } catch (parseError) {
        console.error('Error parsing search results:', parseError);
        setSearchResults([]);
      }
      
    } catch (error) {
      console.error('Error searching transcript:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (timestamp: string) => {
    const [minutes, seconds] = timestamp.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;
    seekTo(totalSeconds);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">YouTube Transcriber AI</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform any YouTube video into a searchable transcript with AI-powered summaries. Perfect for research, content creation, and learning.
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.enterUrl}
                className="w-full p-2 border rounded mb-4"
              />
              <button
                onClick={getTranscript}
                disabled={loading || !url}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    {t.transcribing}
                  </>
                ) : (
                  t.transcribe
                )}
              </button>
            </div>

            {url && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <ReactPlayer
                  ref={setPlayerRef}
                  url={url}
                  width="100%"
                  height="100%"
                  controls
                  config={{
                    youtube: {
                      playerVars: { origin: window.location.origin }
                    }
                  }}
                />
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t.transcript}</h2>
                <div className="flex rounded-lg bg-gray-100 p-1">
                  <button
                    onClick={downloadTranscript}
                    className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 mr-2 flex items-center gap-1"
                  >
                    <Download size={16} />
                    {t.download}
                  </button>
                  <button
                    onClick={() => setViewMode('time')}
                    className={`px-4 py-1 rounded ${viewMode === 'time' ? 'bg-white shadow' : ''}`}
                  >
                    {t.time}
                  </button>
                  <button
                    onClick={() => setViewMode('text')}
                    className={`px-4 py-1 rounded ${viewMode === 'text' ? 'bg-white shadow' : ''}`}
                  >
                    {t.text}
                  </button>
                </div>
              </div>
              {transcript.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchInTranscript()}
                    placeholder={t.searchPlaceholder}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />
                  <button
                    onClick={searchInTranscript}
                    disabled={isSearching || !searchQuery}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>{t.searching}</span>
                      </>
                    ) : (
                      <>
                        <Search size={16} />
                        <span>{t.search}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              <div className="max-h-[400px] overflow-y-auto">
                {searchResults.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium mb-2 text-blue-900">Search Results:</h3>
                    <div className="space-y-2">
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          onClick={() => handleSearchResultClick(result.timestamp)}
                          className="flex gap-2 p-2 bg-white rounded cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          <span className="text-blue-600 font-medium">{result.timestamp}</span>
                          <p className="text-gray-700">{result.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {transcript.length > 0 ? (
                  viewMode === 'time' ? (
                    <div className="space-y-2">
                      {transcript.map((chunk, index) => (
                        <div
                          key={index}
                          onClick={() => seekTo(chunk.timestamp[0])}
                          className="flex gap-4 text-sm group hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors"
                        >
                          <span className="text-gray-500 whitespace-nowrap">
                            {formatTime(chunk.timestamp[0])} - {formatTime(chunk.timestamp[1])}
                          </span>
                          <p className="flex-1">{chunk.text}</p>
                          <button
                            onClick={() => copyToClipboard(chunk.text)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm relative group">
                      <div>{transcript.map(chunk => chunk.text).join(' ')}</div>
                      <button
                        onClick={() => copyToClipboard(transcript.map(chunk => chunk.text).join(' '))}
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  )
                ) : (
                  <p>{t.transcriptPlaceholder}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FileText size={24} />
                  {t.summary}
                  <div className="ml-4 flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setSelectedSummaryLanguage('en')}
                      className={`px-3 py-1 rounded ${
                        selectedSummaryLanguage === 'en' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      En
                    </button>
                    <button
                      onClick={() => setSelectedSummaryLanguage('ru')}
                      className={`px-3 py-1 rounded ${
                        selectedSummaryLanguage === 'ru' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      Ru
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      const fullText = transcript.map(chunk => chunk.text).join(' ');
                      const generatedSummary = await generateSummary(fullText);
                      saveToLocalStorage({
                        url,
                        transcript,
                        summary: generatedSummary
                      });
                    }}
                    disabled={isSummarizing || transcript.length === 0}
                    className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    {isSummarizing ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Brain size={16} />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </h2>
                {transcript.length > 0 && (
                  <button
                    onClick={() => copyToClipboard(summary)}
                    className="text-gray-500 hover:text-gray-700 p-2"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
              {transcript.length === 0 ? (
                <p className="text-gray-500">{t.summaryPlaceholder}</p>
              ) : isSummarizing ? (
                <div className="flex items-center justify-center p-4 min-h-[200px]">
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-4">
                      <Loader2 className="animate-spin mr-2" size={24} />
                      <span className="text-gray-600">{t.generating}</span>
                    </div>
                    {summary && (
                      <div className="space-y-4">
                        {summary.split('\n').map((line, i) => {
                          if (line.startsWith('#')) {
                            return (
                              <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3">
                                {line.replace(/^#\s+/, '')}
                              </h3>
                            );
                          }
                          if (line.startsWith('-') || line.startsWith('•')) {
                            return (
                              <div key={i} className="flex items-start gap-2 text-gray-700">
                                <span className="text-indigo-500">•</span>
                                {line.split('**').map((part, j) => (
                                  j % 2 === 0 ? part : <strong key={j} className="font-semibold">{part}</strong>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <p key={i} className="text-gray-700">
                              {line.split('**').map((part, j) => (
                                j % 2 === 0 ? part : <strong key={j} className="font-semibold">{part}</strong>
                              ))}
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {summary.split('\n').map((line, i) => {
                    if (line.startsWith('#')) {
                      return (
                        <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3">
                          {line.replace(/^#\s+/, '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('-') || line.startsWith('•')) {
                      return (
                        <div key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="text-indigo-500">•</span>
                          {line.split('**').map((part, j) => (
                            j % 2 === 0 ? part : <strong key={j} className="font-semibold">{part}</strong>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <p key={i} className="text-gray-700">
                        {line.split('**').map((part, j) => (
                          j % 2 === 0 ? part : <strong key={j} className="font-semibold">{part}</strong>
                        ))}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t.previousVideos}</h2>
                {savedVideos.length > 0 && (
                  <button
                    onClick={clearAllVideos}
                    className="text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    {t.clearAll}
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {t.localStorageNote}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {savedVideos.map((video, index) => (
                  <div
                    key={index}
                    className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setSelectedVideo(video);
                        setModalOpen(true);
                      }}
                      className="w-full h-full"
                    >
                      <img
                        src={`https://i.ytimg.com/vi/${extractVideoId(video.url)}/mqdefault.jpg`}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    
                    <button
                      onClick={() => deleteVideo(video.url)}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {savedVideos.length === 0 && (
                  <p className="text-gray-500 text-sm">{t.noSavedVideos}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      {summary && !isSummarizing && (
        <>
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          >
            <Brain size={24} />
          </button>
          <ChatWidget
            summary={summary}
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
          />
        </>
      )}
    </div>
  );
}

const ChatWidget = ({ summary, isOpen, onClose }: { summary: string; isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([
    { role: 'assistant', content: 'Хотите обсудить summary?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant discussing a video summary. Here's the summary:\n\n${summary}\n\nStay focused on this content and help users understand it better.`
          },
          ...newMessages
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const assistantMessage = response.choices[0]?.message?.content || '';
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl">
          <Dialog.Title className="sr-only">Chat about Summary</Dialog.Title>
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Chat about Summary</h3>
              <Dialog.Close asChild>
                <button className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
          </div>
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <Loader2 className="animate-spin" size={20} />
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
              >
                Send
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default App;
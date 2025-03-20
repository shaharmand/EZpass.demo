import { useState, useEffect, useCallback } from 'react';

/**
 * Service for text-to-speech functionality with Hebrew support
 * Uses the Web Speech API for speech synthesis with enhancements for Hebrew
 */

// Add these at the top of the file, after imports
let currentUtterance: SpeechSynthesisUtterance | null = null;
const isSpeakingRef = { current: false };
let retryCount = 0;
const MAX_RETRIES = 3;

// Reading style presets
export const ReadingStyles = {
  DEFAULT: { rate: 1.0, pitch: 1.0, volume: 1.0 },
  SLOW: { rate: 0.7, pitch: 0.9, volume: 1.0 },
  FAST: { rate: 1.3, pitch: 1.1, volume: 1.0 },
  QUESTION: { rate: 0.9, pitch: 1.1, volume: 1.0 },
  OPTION: { rate: 0.9, pitch: 0.95, volume: 0.9 }
};

// Hebrew pronunciation corrections
const hebrewPronunciationFixes: Record<string, string> = {
  // Common words that might be mispronounced
  'בחינה': 'בְּחִינָה',
  'שאלה': 'שְׁאֵלָה',
  'תשובה': 'תְּשׁוּבָה',
  'נכון': 'נָכוֹן',
  'לא נכון': 'לֹא נָכוֹן',
  'אפשרות': 'אֶפְשָׁרוּת',
  'בחר': 'בְּחַר',
  'בחירה': 'בְּחִירָה',
  'מבחן': 'מִבְחָן',
  'תרגיל': 'תַּרְגִּיל',
  'שיעור': 'שִׁיעוּר',
  'כיתה': 'כִּיתָּה',
  'מורה': 'מוֹרֶה',
  'תלמיד': 'תַּלְמִיד',
};

// Utility to improve Hebrew pronunciation
const improveHebrewPronunciation = (text: string): string => {
  let improvedText = text;
  
  // Replace problematic words with better pronunciation versions
  Object.entries(hebrewPronunciationFixes).forEach(([word, replacement]) => {
    const wordRegex = new RegExp(`\\b${word}\\b`, 'g');
    improvedText = improvedText.replace(wordRegex, replacement);
  });
  
  // Add pauses after punctuation marks to make speech more natural
  improvedText = improvedText
    .replace(/([.!?])\s+/g, '$1. ') // Add slightly longer pause after periods
    .replace(/([,;:])\s+/g, '$1, '); // Add slight pause after commas
  
  return improvedText;
};

// Utility to extract clean text from HTML/markdown
export const extractTextContent = (htmlOrMarkdown: string): string => {
  // Create a temporary element to remove HTML tags
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlOrMarkdown;
  const plainText = tempDiv.textContent || tempDiv.innerText || htmlOrMarkdown;
  
  // Improve Hebrew pronunciation
  return improveHebrewPronunciation(plainText);
};

// Interface for speech options
export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  style?: keyof typeof ReadingStyles;
  improveHebrew?: boolean;
}

// Interface for content with options
export interface SpeechQueueItem {
  text: string;
  options?: SpeechOptions;
  pauseAfter?: number; // pause in milliseconds after this item
}

// Available TTS engines
export enum TTSEngine {
  BROWSER = 'browser',
  // Future options could include GOOGLE_CLOUD, AZURE, AMAZON, etc.
}

// Hook for text-to-speech functionality
export const useTextToSpeech = () => {
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [currentQueue, setCurrentQueue] = useState<SpeechQueueItem[]>([]);
  const [currentEngine, setCurrentEngine] = useState<TTSEngine>(TTSEngine.BROWSER);

  // Initialize speech synthesis and check browser support
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);

      // Get available voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Look for Hebrew voices
        const hebrewVoices = availableVoices.filter(voice => 
          voice.lang.includes('he') || voice.lang.includes('iw')
        );
        
        // If multiple Hebrew voices are available, prefer Microsoft or Google voices
        const bestHebrewVoice = hebrewVoices.find(v => 
          v.name.includes('Microsoft') || v.name.includes('Google')
        ) || (hebrewVoices.length > 0 ? hebrewVoices[0] : null);
        
        // Fallback to any voice if Hebrew isn't available
        setPreferredVoice(bestHebrewVoice || (availableVoices.length > 0 ? availableVoices[0] : null));
        
        // Debug available voices
        console.log('Available TTS voices:', availableVoices.map(v => `${v.name} (${v.lang})`));
        console.log('Selected voice:', bestHebrewVoice ? `${bestHebrewVoice.name} (${bestHebrewVoice.lang})` : 'No Hebrew voice found');
        
        if (hebrewVoices.length === 0) {
          console.warn('No Hebrew voices found. Using default voice which may not pronounce Hebrew correctly.');
        }
      };

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      loadVoices();
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }

    // Cleanup speech synthesis when component unmounts
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Function to set the preferred voice
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setPreferredVoice(voice);
  }, []);

  // Function to prepare and create an utterance
  const createUtterance = useCallback((text: string, options?: SpeechOptions) => {
    // Clean text and improve Hebrew pronunciation if requested
    const improveHebrew = options?.improveHebrew !== false; // Default to true
    const cleanText = improveHebrew 
      ? improveHebrewPronunciation(extractTextContent(text))
      : extractTextContent(text);
    
    // Create a new speech utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Apply style preset if specified
    const stylePreset = options?.style ? ReadingStyles[options.style] : ReadingStyles.DEFAULT;
    
    // Set voice (prefer Hebrew, fallback to default)
    utterance.voice = options?.voice || preferredVoice || null;
    
    // Set language to Hebrew if using a non-Hebrew voice
    if (utterance.voice && !utterance.voice.lang.includes('he') && !utterance.voice.lang.includes('iw')) {
      utterance.lang = 'he-IL'; // Try to enforce Hebrew language
    }
    
    // Set speech rate, pitch, and volume - allow override of style preset
    utterance.rate = options?.rate !== undefined ? options.rate : stylePreset.rate;
    utterance.pitch = options?.pitch !== undefined ? options.pitch : stylePreset.pitch;
    utterance.volume = options?.volume !== undefined ? options.volume : stylePreset.volume;
    
    return utterance;
  }, [preferredVoice]);

  // Function to speak text
  const speak = async (text: string, options: SpeechOptions = {}): Promise<void> => {
    if (!text) return;
    
    // Cancel any ongoing speech
    if (currentUtterance) {
      window.speechSynthesis.cancel();
    }
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set up voice options - prefer Hebrew voice
    const hebrewVoices = voices.filter(v => v.lang.includes('he') || v.lang.includes('iw'));
    if (hebrewVoices.length > 0) {
      utterance.voice = hebrewVoices[0];
      console.log('Using Hebrew voice:', utterance.voice.name);
    } else if (options.voice) {
      utterance.voice = options.voice;
    }
    
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.lang = 'he-IL'; // Force Hebrew language
    
    // Set up event handlers
    utterance.onstart = () => {
      console.log('Browser TTS started speaking');
      isSpeakingRef.current = true;
      retryCount = 0; // Reset retry count when speech starts successfully
    };
    
    utterance.onend = () => {
      console.log('Browser TTS finished speaking');
      isSpeakingRef.current = false;
      currentUtterance = null;
      retryCount = 0; // Reset retry count when speech ends successfully
    };
    
    utterance.onerror = (event) => {
      console.error('Browser TTS error:', event);
      isSpeakingRef.current = false;
      currentUtterance = null;
      
      // If interrupted, try again after a short delay, but limit retries
      if (event.error === 'interrupted' && retryCount < MAX_RETRIES) {
        console.log(`Speech synthesis interrupted, retry attempt ${retryCount + 1}/${MAX_RETRIES}`);
        retryCount++;
        
        // Add a longer delay between retries (increasing with each retry)
        const delay = Math.min(100 * Math.pow(2, retryCount), 1000);
        console.log(`Waiting ${delay}ms before retry...`);
        
        setTimeout(() => {
          if (!isSpeakingRef.current) {
            // Cancel any ongoing speech before retrying
            window.speechSynthesis.cancel();
            // Add a small delay after canceling
            setTimeout(() => {
              // Try to use a different Hebrew voice if available
              if (retryCount > 0) {
                const hebrewVoices = voices.filter(v => v.lang.includes('he') || v.lang.includes('iw'));
                if (hebrewVoices.length > 0) {
                  const currentVoiceIndex = hebrewVoices.findIndex(v => v === utterance.voice);
                  const nextVoiceIndex = (currentVoiceIndex + 1) % hebrewVoices.length;
                  utterance.voice = hebrewVoices[nextVoiceIndex];
                  console.log(`Trying with different Hebrew voice: ${utterance.voice?.name}`);
                }
              }
              window.speechSynthesis.speak(utterance);
            }, 50);
          }
        }, delay);
      } else {
        console.log('Max retries reached or error not due to interruption, stopping speech synthesis');
        retryCount = 0;
        window.speechSynthesis.cancel();
        
        // Try to use Web Audio API as a fallback
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
          
          oscillator.start();
          
          // Stop after 0.5 seconds
          setTimeout(() => {
            oscillator.stop();
            audioContext.close();
          }, 500);
        } catch (error) {
          console.error('Fallback audio also failed:', error);
        }
      }
    };
    
    utterance.onpause = () => {
      console.log('Browser TTS paused');
      isSpeakingRef.current = false;
    };
    
    utterance.onresume = () => {
      console.log('Browser TTS resumed');
      isSpeakingRef.current = true;
    };
    
    // Store current utterance
    currentUtterance = utterance;
    
    // Add a small delay before starting speech
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  // Function to speak a sequence of items
  const speakQueue = useCallback((items: SpeechQueueItem[]) => {
    if (!isSupported || items.length === 0) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Set the current queue
    setCurrentQueue(items);
    
    // Process each item in the queue
    items.forEach((item, index) => {
      const utterance = createUtterance(item.text, item.options);
      
      // Set event handlers for the first item
      if (index === 0) {
        utterance.onstart = () => setIsReading(true);
      }
      
      // Set event handlers for the last item
      if (index === items.length - 1) {
        utterance.onend = () => {
          setIsReading(false);
          setCurrentQueue([]);
        };
      }
      
      // Set common event handlers
      utterance.onpause = () => setIsPaused(true);
      utterance.onresume = () => setIsPaused(false);
      
      // Add a pause after the item if specified
      if (item.pauseAfter && index < items.length - 1) {
        const pause = new SpeechSynthesisUtterance(' ');
        pause.rate = 0.1;
        pause.volume = 0;
        pause.onend = () => {
          // Add a small delay to create a natural pause
          setTimeout(() => {}, item.pauseAfter);
        };
        window.speechSynthesis.speak(pause);
      }
      
      // Add the utterance to the queue
      window.speechSynthesis.speak(utterance);
    });
  }, [isSupported, createUtterance]);

  // Function to read a question with options
  const readQuestion = useCallback((questionText: string, options?: string[]) => {
    if (!isSupported || !questionText) return;
    
    const queue: SpeechQueueItem[] = [
      {
        text: questionText,
        options: { style: 'QUESTION', improveHebrew: true },
        pauseAfter: 500
      }
    ];
    
    // Add options if provided
    if (options && options.length > 0) {
      options.forEach((option, index) => {
        queue.push({
          text: `אפשרות ${index + 1}: ${option}`,
          options: { style: 'OPTION', improveHebrew: true },
          pauseAfter: 300
        });
      });
    }
    
    speakQueue(queue);
  }, [isSupported, speakQueue]);

  // Function to stop speaking
  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    setCurrentQueue([]);
  }, [isSupported]);

  // Function to pause speaking
  const pause = useCallback(() => {
    if (!isSupported || !isReading) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isReading]);

  // Function to resume speaking
  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  return {
    speak,
    speakQueue,
    readQuestion,
    stop,
    pause,
    resume,
    isReading,
    isPaused,
    isSupported,
    voices,
    preferredVoice,
    setVoice,
    currentQueue,
    ReadingStyles,
    currentEngine
  };
}; 
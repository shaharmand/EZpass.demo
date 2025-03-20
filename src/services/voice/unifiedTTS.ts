import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  useTextToSpeech as useBrowserTTS, 
  ReadingStyles, 
  SpeechOptions,
  extractTextContent,
  SpeechQueueItem
} from './textToSpeech';
import {
  synthesizeSpeech,
  playGoogleTTS,
  isGoogleTTSAvailable,
  GOOGLE_HEBREW_VOICES,
  GoogleTTSOptions,
  pauseGoogleTTS,
  resumeGoogleTTS,
  stopGoogleTTS,
  currentAudioSource
} from './googleTTS';

// Debug environment variables - add at the top level
console.log('Environment variables available to React:', {
  GOOGLE_KEY_EXISTS: !!process.env.REACT_APP_GOOGLE_API_KEY,
  GOOGLE_KEY_LENGTH: process.env.REACT_APP_GOOGLE_API_KEY ? process.env.REACT_APP_GOOGLE_API_KEY.length : 0,
  ENV_KEYS: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
});

/**
 * Available TTS engines
 */
export enum TTSEngine {
  BROWSER = 'browser',
  GOOGLE = 'google'
}

/**
 * Unified TTS options
 */
export interface UnifiedTTSOptions extends SpeechOptions {
  engine?: TTSEngine;
  googleOptions?: GoogleTTSOptions;
}

/**
 * Hook for unified text-to-speech functionality
 * Combines Google Cloud TTS and browser's Speech Synthesis
 */
export const useUnifiedTTS = () => {
  // Get browser TTS functionality
  const browserTTS = useBrowserTTS();
  
  // Track preferred engine
  const [preferredEngine, setPreferredEngine] = useState<TTSEngine>(
    isGoogleTTSAvailable() ? TTSEngine.GOOGLE : TTSEngine.BROWSER
  );
  
  // Track currently active audio element from Google TTS
  const googleAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Track reading state for Google TTS
  const [isGoogleReading, setIsGoogleReading] = useState(false);
  const [isGooglePaused, setIsGooglePaused] = useState(false);
  const lastPlayTimeRef = useRef(0);
  const isUserPauseRef = useRef(false);
  const isUserInitiatedPauseRef = useRef(false);
  
  // Determine if Google TTS is supported
  const [isGoogleSupported] = useState(isGoogleTTSAvailable());
  
  // Set current status based on active engine
  const isReading = preferredEngine === TTSEngine.GOOGLE 
    ? isGoogleReading 
    : browserTTS.isReading;
    
  const isPaused = preferredEngine === TTSEngine.GOOGLE 
    ? isGooglePaused 
    : browserTTS.isPaused;
  
  // Stop speaking - defined early to avoid reference issues
  const stop = useCallback(() => {
    // Stop Google TTS if active
    if (googleAudioRef.current) {
      googleAudioRef.current.pause();
      googleAudioRef.current = null;
      setIsGoogleReading(false);
      setIsGooglePaused(false);
    }
    
    // Stop browser TTS
    browserTTS.stop();
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (googleAudioRef.current) {
        googleAudioRef.current.pause();
        googleAudioRef.current = null;
      }
      browserTTS.stop();
    };
  }, []);
  
  // Function to speak text
  const speak = useCallback(async (text: string, options: UnifiedTTSOptions = {}) => {
    if (!text) return;
    
    // Stop any ongoing speech
    stop();
    
    try {
      if (preferredEngine === TTSEngine.GOOGLE && isGoogleSupported) {
        // Use Google TTS
        const googleOptions: GoogleTTSOptions = {
          voiceName: options.googleOptions?.voiceName || GOOGLE_HEBREW_VOICES[0].value,
          pitch: options.pitch,
          speakingRate: options.rate,
          ssmlGender: options.googleOptions?.voiceName?.includes('Female') ? 'FEMALE' : 'MALE'
        };
        
        setIsGoogleReading(true);
        setIsGooglePaused(false);
        lastPlayTimeRef.current = 0;
        isUserPauseRef.current = false;
        
        try {
          const audio = await playGoogleTTS(text, googleOptions);
          googleAudioRef.current = audio;
          
          // Set up event handlers
          audio.onended = () => {
            console.log('Google TTS audio ended, currentTime:', audio.currentTime, 'duration:', audio.duration);
            setIsGoogleReading(false);
            setIsGooglePaused(false);
            lastPlayTimeRef.current = 0;
            isUserPauseRef.current = false;
            googleAudioRef.current = null;
          };
          
          audio.onerror = (error) => {
            console.error('Google TTS error:', error, 'currentTime:', audio.currentTime, 'duration:', audio.duration);
            setIsGoogleReading(false);
            setIsGooglePaused(false);
            lastPlayTimeRef.current = 0;
            isUserPauseRef.current = false;
            googleAudioRef.current = null;
            
            // Fallback to browser TTS
            if (browserTTS.isSupported) {
              console.log('Falling back to browser TTS due to Google TTS error');
              browserTTS.speak(text, {
                voice: options.voice,
                rate: options.rate,
                pitch: options.pitch,
                style: options.style,
                improveHebrew: options.improveHebrew
              });
            }
          };
          
          audio.onpause = () => {
            console.log('Google TTS audio paused event received, currentTime:', audio.currentTime, 'duration:', audio.duration, 'ended:', audio.ended);
            // Only ignore automatic pause events that happen very close to the start
            if (audio.currentTime < 0.1 && !audio.ended && !isUserInitiatedPauseRef.current) {
              console.log('Ignoring initial pause event - audio just started, currentTime:', audio.currentTime);
              audio.play().catch(error => {
                console.error('Error resuming audio:', error);
              });
            }
            // Reset the user-initiated pause flag
            isUserInitiatedPauseRef.current = false;
          };
          
          audio.onplay = () => {
            console.log('Google TTS audio playing, currentTime:', audio.currentTime, 'duration:', audio.duration);
            setIsGooglePaused(false);
            lastPlayTimeRef.current = Date.now();
            isUserPauseRef.current = false;
          };
          
        } catch (error) {
          console.error('Failed to play Google TTS:', error);
          setIsGoogleReading(false);
          setIsGooglePaused(false);
          lastPlayTimeRef.current = 0;
          isUserPauseRef.current = false;
          googleAudioRef.current = null;
          
          // Fallback to browser TTS if Google TTS fails
          if (browserTTS.isSupported) {
            console.log('Falling back to browser TTS');
            browserTTS.speak(text, {
              voice: options.voice,
              rate: options.rate,
              pitch: options.pitch,
              style: options.style,
              improveHebrew: options.improveHebrew
            });
          }
        }
      } else {
        // Use browser TTS
        browserTTS.speak(text, {
          voice: options.voice,
          rate: options.rate,
          pitch: options.pitch,
          style: options.style,
          improveHebrew: options.improveHebrew
        });
      }
    } catch (error) {
      console.error('Error in speak:', error);
      stop();
    }
  }, [preferredEngine, isGoogleSupported, browserTTS, stop]);
  
  // Read a question with options
  const readQuestion = useCallback(async (
    questionText: string, 
    options?: string[], 
    ttsOptions: UnifiedTTSOptions = {}
  ) => {
    if (!questionText) return;
    
    // Extract options
    const { 
      engine = preferredEngine,
      googleOptions,
      ...browserOptions 
    } = ttsOptions;
    
    try {
      // For Google TTS, format the text differently
      if (engine === TTSEngine.GOOGLE && isGoogleSupported) {
        let fullText = questionText;
        
        // Add options if provided
        if (options && options.length > 0) {
          fullText += "\n\n";
          const hebrewLetters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];
          options.forEach((option, index) => {
            fullText += `אפשרות ${hebrewLetters[index]}: ${option}\n`;
          });
        }
        
        // Use Google TTS
        speak(fullText, { 
          engine: TTSEngine.GOOGLE,
          googleOptions
        });
        return;
      }
      
      // Fall back to browser TTS
      const queue: SpeechQueueItem[] = [
        {
          text: questionText,
          options: { 
            ...browserOptions,
            style: 'QUESTION', 
            improveHebrew: true 
          },
          pauseAfter: 500
        }
      ];
      
      // Add options if provided
      if (options && options.length > 0) {
        const hebrewLetters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];
        options.forEach((option, index) => {
          queue.push({
            text: `אפשרות ${hebrewLetters[index]}: ${option}`,
            options: { 
              ...browserOptions,
              style: 'OPTION', 
              improveHebrew: true 
            },
            pauseAfter: 300
          });
        });
      }
      
      browserTTS.speakQueue(queue);
    } catch (error) {
      console.error('Error in unified readQuestion:', error);
      
      // Fall back to browser TTS if Google fails
      if (engine === TTSEngine.GOOGLE) {
        browserTTS.readQuestion(questionText, options);
      }
    }
  }, [
    preferredEngine,
    isGoogleSupported,
    speak,
    browserTTS
  ]);
  
  // Pause speaking
  const pause = useCallback(() => {
    console.log('Pause function called, preferredEngine:', preferredEngine);
    if (preferredEngine === TTSEngine.GOOGLE) {
      // Try to pause using either the ref or the global currentAudioSource
      const audioElement = googleAudioRef.current || currentAudioSource;
      console.log('Attempting to pause Google TTS, audio element:', audioElement);
      if (audioElement) {
        console.log('Pausing audio, current state:', {
          currentTime: audioElement.currentTime,
          duration: audioElement.duration,
          paused: audioElement.paused,
          ended: audioElement.ended
        });
        // Set the user-initiated pause flag before pausing
        isUserInitiatedPauseRef.current = true;
        audioElement.pause();
        setIsGooglePaused(true);
        console.log('Audio paused successfully');
      } else {
        console.log('No audio element found to pause');
      }
    } else {
      console.log('Using browser TTS pause');
      browserTTS.pause();
    }
  }, [preferredEngine, browserTTS]);
  
  // Resume speaking
  const resume = useCallback(() => {
    console.log('Resume function called, preferredEngine:', preferredEngine);
    if (preferredEngine === TTSEngine.GOOGLE) {
      // Try to resume using either the ref or the global currentAudioSource
      const audioElement = googleAudioRef.current || currentAudioSource;
      console.log('Attempting to resume Google TTS, audio element:', audioElement);
      if (audioElement) {
        console.log('Resuming audio, current state:', {
          currentTime: audioElement.currentTime,
          duration: audioElement.duration,
          paused: audioElement.paused,
          ended: audioElement.ended
        });
        audioElement.play().catch(error => {
          console.error('Error resuming audio:', error);
        });
        setIsGooglePaused(false);
        console.log('Audio resumed successfully');
      } else {
        console.log('No audio element found to resume');
      }
    } else {
      console.log('Using browser TTS resume');
      browserTTS.resume();
    }
  }, [preferredEngine, browserTTS]);
  
  return {
    // Core methods
    speak,
    readQuestion,
    stop,
    pause,
    resume,
    
    // Status flags
    isReading,
    isPaused,
    isSupported: browserTTS.isSupported || isGoogleSupported,
    isBrowserSupported: browserTTS.isSupported,
    isGoogleSupported,
    
    // Voice selection
    voices: browserTTS.voices,
    googleVoices: GOOGLE_HEBREW_VOICES,
    
    // Voice preference
    preferredVoice: browserTTS.preferredVoice,
    setVoice: browserTTS.setVoice,
    
    // Engine preference
    preferredEngine,
    setPreferredEngine,
    
    // Utilities
    ReadingStyles,
    extractTextContent
  };
}; 
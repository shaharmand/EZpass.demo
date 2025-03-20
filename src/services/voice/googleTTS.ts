import axios from 'axios';

// Add the API key constant at the top of the file
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

// Utility function to convert base64 to blob
const base64ToBlob = (base64: string, type: string): Blob => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type });
};

/**
 * Google Cloud Text-to-Speech API client
 * Uses existing Google API credentials from environment variables
 */

// Cache for audio blobs
const audioCache = new Map<string, Blob>();

// Available Hebrew voices for Google TTS
export const GOOGLE_HEBREW_VOICES = [
  { value: 'he-IL-Wavenet-A', label: 'Google Hebrew Female 1' },
  { value: 'he-IL-Wavenet-B', label: 'Google Hebrew Male 1' },
  { value: 'he-IL-Wavenet-C', label: 'Google Hebrew Female 2' },
  { value: 'he-IL-Wavenet-D', label: 'Google Hebrew Male 2' },
];

export const DEFAULT_GOOGLE_VOICE = 'he-IL-Wavenet-B';

// Update the GoogleTTSOptions type
export interface GoogleTTSOptions {
  languageCode?: string;
  voiceName?: string;
  ssmlGender?: 'MALE' | 'FEMALE';
  pitch?: number;
  speakingRate?: number;
}

function generateCacheKey(text: string, options: GoogleTTSOptions): string {
  return `${text}-${options.voiceName}-${options.pitch}-${options.speakingRate}-${options.ssmlGender}`;
}

/**
 * Function to test audio playback without making any API calls
 * This helps diagnose if there are basic audio playback issues
 */
export const testGoogleTTSAudio = async (): Promise<boolean> => {
  try {
    if (!isGoogleTTSAvailable()) {
      console.error('Google TTS API key not found');
      return false;
    }

    // Read the options as Hebrew letters with proper format
    const testText = 'אפשרות א. אפשרות ב. אפשרות ג. אפשרות ד.';
    await playGoogleTTS(testText, {
      voiceName: DEFAULT_GOOGLE_VOICE,
      speakingRate: 0.8, // Slower rate for better clarity
      pitch: 0
    });
    return true;
  } catch (error) {
    console.error('Error in testGoogleTTSAudio:', error);
    return false;
  }
};

// Helper function to write strings to DataView
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Synthesize speech using Google Cloud TTS API
 * 
 * @param text Text to synthesize
 * @param options TTS options
 * @returns URL to audio blob
 */
export async function synthesizeSpeech(
  text: string,
  options: GoogleTTSOptions = {}
): Promise<Blob> {
  if (!GOOGLE_API_KEY) {
    throw new Error('Google API key is not configured');
  }

  // Check if we have a cached version
  const cacheKey = generateCacheKey(text, options);
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  // Prepare the request payload
  const requestPayload = {
    input: {
      text
    },
    voice: {
      languageCode: options.languageCode || 'he-IL',
      name: options.voiceName || 'he-IL-Wavenet-A',
      ssmlGender: options.ssmlGender || 'MALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: options.pitch || 0,
      speakingRate: options.speakingRate || 1
    }
  };

  try {
    console.log('Google TTS Request payload:', requestPayload);
    
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.audioContent) {
      throw new Error('Invalid response from Google TTS API');
    }

    const audioContent = response.data.audioContent;
    const audioBlob = base64ToBlob(audioContent, 'audio/mp3');
    audioCache.set(cacheKey, audioBlob);
    return audioBlob;
  } catch (error) {
    console.error('Error in synthesizeSpeech:', error);
    if (axios.isAxiosError(error)) {
      const errorDetails = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      };
      console.error('API Error details:', JSON.stringify(errorDetails, null, 2));
      
      // Handle specific API errors
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error?.message || error.message;
        if (errorMessage.includes('API key not valid')) {
          throw new Error('Invalid Google Cloud API key. Please check your API key in the .env file and ensure it has access to the Text-to-Speech API');
        }
        throw new Error(`Invalid request to Google TTS API: ${errorMessage}`);
      }
    }
    throw error;
  }
}

// Add a global variable to track the audio source
export let currentAudioSource: HTMLAudioElement | null = null;

/**
 * Check if audio is currently playing
 */
export function isGoogleTTSPlaying(): boolean {
  return currentAudioSource !== null && !currentAudioSource.paused;
}

/**
 * Play audio from synthesized speech
 * 
 * @param text Text to speak
 * @param options TTS options
 * @returns Audio element
 */
export async function playGoogleTTS(text: string, options: GoogleTTSOptions = {}): Promise<HTMLAudioElement> {
  try {
    console.log('Starting Google TTS playback...');
    
    // Stop any currently playing audio
    stopGoogleTTS();
    
    // Generate speech
    const audioContent = await synthesizeSpeech(text, options);
    
    // Create audio element
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioContent);
    audio.volume = 1.0;
    
    // Set up event handlers
    audio.oncanplaythrough = () => {
      console.log('Audio ready to play, currentTime:', audio.currentTime, 'duration:', audio.duration);
    };
    
    audio.onplay = () => {
      console.log('Audio playback started, currentTime:', audio.currentTime, 'duration:', audio.duration);
      currentAudioSource = audio; // Ensure currentAudioSource is set when playback starts
    };
    
    audio.onpause = () => {
      console.log('Audio playback paused, currentTime:', audio.currentTime, 'duration:', audio.duration, 'ended:', audio.ended);
    };
    
    audio.onended = () => {
      console.log('Audio playback ended, currentTime:', audio.currentTime, 'duration:', audio.duration);
      URL.revokeObjectURL(audio.src);
      currentAudioSource = null;
    };
    
    audio.onerror = (error) => {
      console.error('Audio playback error:', error, 'currentTime:', audio.currentTime, 'duration:', audio.duration);
      URL.revokeObjectURL(audio.src);
      currentAudioSource = null;
    };
    
    // Start playback
    console.log('Starting audio playback, currentTime:', audio.currentTime, 'duration:', audio.duration);
    await audio.play();
    
    currentAudioSource = audio;
    return audio;
  } catch (error) {
    console.error('Error in playGoogleTTS:', error);
    currentAudioSource = null;
    throw error;
  }
}

// Update pause and resume functions to use HTML5 Audio
export const pauseGoogleTTS = () => {
  console.log('pauseGoogleTTS called, currentAudioSource:', currentAudioSource);
  if (currentAudioSource) {
    console.log('Current audio state:', {
      currentTime: currentAudioSource.currentTime,
      duration: currentAudioSource.duration,
      paused: currentAudioSource.paused,
      ended: currentAudioSource.ended
    });
    currentAudioSource.pause();
    console.log('Google TTS paused successfully');
  } else {
    console.log('No audio source to pause');
  }
};

export const resumeGoogleTTS = () => {
  console.log('resumeGoogleTTS called, currentAudioSource:', currentAudioSource);
  if (currentAudioSource) {
    console.log('Current audio state:', {
      currentTime: currentAudioSource.currentTime,
      duration: currentAudioSource.duration,
      paused: currentAudioSource.paused,
      ended: currentAudioSource.ended
    });
    currentAudioSource.play().catch(error => {
      console.error('Error resuming audio:', error);
    });
    console.log('Google TTS resumed successfully');
  } else {
    console.log('No audio source to resume');
  }
};

export function stopGoogleTTS(): void {
  if (currentAudioSource) {
    currentAudioSource.pause();
    currentAudioSource = null;
    console.log('Google TTS stopped');
  }
}

// Cache for API key availability check
let apiKeyCheckCache: { available: boolean; timestamp: number } | null = null;
const API_KEY_CHECK_CACHE_DURATION = 5000; // 5 seconds

/**
 * Check if Google TTS is available (API key exists)
 */
export const isGoogleTTSAvailable = (): boolean => {
  // Check cache first
  if (apiKeyCheckCache && Date.now() - apiKeyCheckCache.timestamp < API_KEY_CHECK_CACHE_DURATION) {
    return apiKeyCheckCache.available;
  }

  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const available = !!apiKey && apiKey !== 'AIzaSyDK9SYhHcnYS0JK9SEPktZ_Jvxs0unV1r0';

  // Only log warning if the status changed
  if (!available && (!apiKeyCheckCache || apiKeyCheckCache.available)) {
    if (!apiKey) {
      console.warn('Google TTS API key not found in environment variables');
    } else if (apiKey === 'AIzaSyDK9SYhHcnYS0JK9SEPktZ_Jvxs0unV1r0') {
      console.warn('Using default API key. Please set up your own Google Cloud API key in .env file');
    }
  }

  // Update cache
  apiKeyCheckCache = {
    available,
    timestamp: Date.now()
  };

  return available;
};

/**
 * Clear the audio cache
 */
export function clearTTSCache(): void {
  audioCache.clear();
} 
# Voice Services

This directory contains services for voice interactions in the EZpass application.

## Services

### Text-to-Speech Service

Uses the browser's Speech Synthesis API to read text aloud. It automatically tries to use a Hebrew voice if available.

```typescript
import { useTextToSpeech, extractTextContent } from './voice/textToSpeech';

// In your component
const { 
  speak, 
  stop, 
  pause, 
  resume, 
  isReading, 
  isPaused, 
  isSupported,
  voices,
  preferredVoice
} = useTextToSpeech();

// Read text aloud
speak('Text to be read aloud');

// With custom options
speak('Text to be read aloud', { rate: 0.8, pitch: 1.2 });

// Clean HTML/markdown before speaking
const cleanText = extractTextContent('<p>Some <strong>HTML</strong> text</p>');
speak(cleanText);
```

### Speech Recognition Service (Coming Soon)

Will use either the browser's Speech Recognition API or OpenAI's Whisper API to convert speech to text.

```typescript
import { useSpeechRecognition } from './voice/speechRecognition';

// In your component
const { 
  startListening, 
  stopListening, 
  transcript, 
  isListening, 
  isSupported 
} = useSpeechRecognition();

// Start listening for speech
startListening({ language: 'he-IL' });

// Stop listening
stopListening();

// Access the transcript
console.log(transcript);
```

## Implementation Notes

- The Speech Synthesis API has variable support for Hebrew across browsers
- For production, consider using a cloud-based TTS service with better Hebrew support
- Future implementation will include OpenAI Whisper API integration for better speech recognition 
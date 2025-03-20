# Voice Interaction Components

This directory contains components for voice interactions in the EZpass application.

## Components

### VoiceReadingButton

A button that reads text aloud using the browser's Speech Synthesis API. It automatically tries to use a Hebrew voice if available.

```jsx
import { VoiceReadingButton } from './voice/VoiceReadingButton';

// Basic usage
<VoiceReadingButton text="Text to be read aloud" />

// Icon-only variant
<VoiceReadingButton text="Text to be read aloud" iconOnly />

// Custom size
<VoiceReadingButton text="Text to be read aloud" size="small" />
```

### VoiceInputButton (Coming Soon)

A button that allows users to input text via voice using either the browser's Speech Recognition API or OpenAI's Whisper API.

```jsx
import { VoiceInputButton } from './voice/VoiceInputButton';

// Basic usage
<VoiceInputButton onTranscriptReceived={(text) => console.log(text)} />

// Icon-only variant
<VoiceInputButton onTranscriptReceived={(text) => console.log(text)} iconOnly />
```

## Future Enhancements

- Switch to OpenAI Whisper API for better Hebrew speech recognition
- Add voice input for question answers
- Support voice commands for navigation
- Save voice preferences in user settings 
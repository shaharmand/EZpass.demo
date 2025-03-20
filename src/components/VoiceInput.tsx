import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'antd';
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons';
import styled from 'styled-components';

interface StyledButtonProps {
  $isRecording: boolean;
}

const StyledButton = styled(Button)<StyledButtonProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  background-color: ${props => props.$isRecording ? '#fee2e2' : '#f3f4f6'};
  border-color: ${props => props.$isRecording ? '#ef4444' : '#e5e7eb'};
  color: ${props => props.$isRecording ? '#ef4444' : '#374151'};
  
  &:hover {
    background-color: ${props => props.$isRecording ? '#fecaca' : '#e5e7eb'};
    border-color: ${props => props.$isRecording ? '#ef4444' : '#d1d5db'};
  }
`;

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Google Speech Recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      console.log('Initializing Google Speech Recognition...');
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'he-IL'; // Set language to Hebrew

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
      };

      recognitionRef.current.onresult = (event: any) => {
        console.log('Received speech recognition results:', event.results);
        const transcript = Array.from(event.results)
          .map((result: any) => {
            console.log('Processing result:', result[0].transcript);
            return result[0].transcript;
          })
          .join('');
        console.log('Final transcript:', transcript);
        onTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        if (isRecording) {
          console.log('Restarting speech recognition...');
          recognitionRef.current.start();
        }
      };

      recognitionRef.current.onnomatch = () => {
        console.log('No speech was recognized');
      };

      recognitionRef.current.onaudiostart = () => {
        console.log('Audio capturing started');
      };

      recognitionRef.current.onaudioend = () => {
        console.log('Audio capturing ended');
      };

      recognitionRef.current.onsoundstart = () => {
        console.log('Sound detected');
      };

      recognitionRef.current.onsoundend = () => {
        console.log('Sound ended');
      };

      recognitionRef.current.onspeechend = () => {
        console.log('Speech ended');
      };
    } else {
      console.error('Speech recognition is not supported in this browser');
      setError('Speech recognition is not supported in this browser');
    }

    return () => {
      console.log('Cleaning up speech recognition...');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording, onTranscript]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition is not supported in this browser');
      setError('Speech recognition is not supported in this browser');
      return;
    }

    if (isRecording) {
      console.log('Stopping speech recognition...');
      recognitionRef.current.stop();
    } else {
      console.log('Starting speech recognition...');
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };

  return (
    <div>
      <StyledButton
        onClick={toggleRecording}
        disabled={disabled}
        $isRecording={isRecording}
        icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
      >
        {isRecording ? 'הפסק הקלטה' : 'התחל הקלטה'}
      </StyledButton>
      {error && (
        <div style={{ color: '#ef4444', marginTop: '8px', fontSize: '14px' }}>
          {error}
        </div>
      )}
    </div>
  );
}; 
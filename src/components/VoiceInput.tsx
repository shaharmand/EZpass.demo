import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'antd';
import { AudioOutlined, EditOutlined } from '@ant-design/icons';
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
  background-color: #f3f4f6;
  border-color: #e5e7eb;
  color: #374151;
  
  &:hover {
    background-color: #e5e7eb;
    border-color: #d1d5db;
  }
`;

const IconWrapper = styled.span<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: ${props => props.$active ? '#1890ff' : '#9ca3af'};
  font-size: 18px;
  border: ${props => props.$active ? '2px solid #1890ff' : '2px solid transparent'};
  transition: all 0.2s ease;
  position: relative;
`;

const SpeechIndicator = styled.div<{ $isSpeaking: boolean }>`
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.$isSpeaking ? '#52c41a' : 'transparent'};
  transition: all 0.2s ease;
`;

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  canUpdateText?: boolean;
  onModeChange?: (isVoiceMode: boolean) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscript, 
  disabled = false,
  canUpdateText = true,
  onModeChange
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      console.log('Initializing Google Speech Recognition...');
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'he-IL';

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
        if (canUpdateText) {
          onTranscript(transcript);
          setIsSpeaking(true);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error);
        setIsSpeaking(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsSpeaking(false);
      };

      recognitionRef.current.onspeechend = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
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
  }, [canUpdateText]);

  const toggleMode = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition is not supported in this browser');
      setError('Speech recognition is not supported in this browser');
      return;
    }

    try {
      if (isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
        setIsSpeaking(false);
        onModeChange?.(false);
      } else {
        setTimeout(() => {
          recognitionRef.current.start();
          setIsRecording(true);
          onModeChange?.(true);
        }, 100);
      }
    } catch (error) {
      console.error('Error toggling speech recognition:', error);
      setError('Failed to toggle speech recognition');
    }
  };

  return (
    <div>
      <StyledButton
        onClick={toggleMode}
        disabled={disabled}
        $isRecording={isRecording}
      >
        <IconWrapper $active={!isRecording}>
          <EditOutlined />
        </IconWrapper>
        <IconWrapper $active={isRecording}>
          <AudioOutlined />
          <SpeechIndicator $isSpeaking={isSpeaking} />
        </IconWrapper>
      </StyledButton>
      {error && (
        <div style={{ color: '#1890ff', marginTop: '8px', fontSize: '14px' }}>
          {error}
        </div>
      )}
    </div>
  );
}; 
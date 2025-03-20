import React, { useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { AudioOutlined, LoadingOutlined, StopOutlined } from '@ant-design/icons';
import { useSpeechRecognition } from '../../services/voice/speechRecognition';

interface VoiceInputButtonProps {
  onTranscriptReceived: (text: string) => void;
  iconOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  tooltipText?: string;
  size?: 'small' | 'middle' | 'large';
}

/**
 * Button that captures voice input and converts it to text
 * This is a placeholder for future implementation
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscriptReceived,
  iconOnly = false,
  className,
  style,
  tooltipText = 'הכנס תשובה קולית',
  size = 'middle'
}) => {
  const { startListening, stopListening, isListening, transcript, isSupported } = useSpeechRecognition();

  // When transcript changes, send it to the parent component
  useEffect(() => {
    if (transcript) {
      onTranscriptReceived(transcript);
    }
  }, [transcript, onTranscriptReceived]);

  // If speech recognition is not supported, don't render the button
  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      // When implemented, this will use language: 'he-IL' for Hebrew
      startListening({ language: 'he-IL', continuous: false });
    }
  };

  const icon = isListening ? <LoadingOutlined /> : <AudioOutlined />;
  const buttonText = isListening ? 'מפסיק הקלטה...' : 'הקלט תשובה';

  return (
    <Tooltip title={tooltipText}>
      <Button
        type={isListening ? "primary" : "default"}
        danger={isListening}
        icon={icon}
        onClick={handleClick}
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        size={size}
      >
        {!iconOnly && buttonText}
      </Button>
    </Tooltip>
  );
}; 
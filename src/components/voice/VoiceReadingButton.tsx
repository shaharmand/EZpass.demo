import React, { useEffect, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { 
  SoundOutlined, 
  LoadingOutlined, 
  PauseOutlined, 
  PlayCircleOutlined
} from '@ant-design/icons';
import { useUnifiedTTS, UnifiedTTSOptions } from '../../services/voice/unifiedTTS';

interface VoiceReadingButtonProps {
  text: string;
  options?: string[]; // For multiple choice questions
  iconOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  tooltipText?: string;
  size?: 'small' | 'middle' | 'large';
}

/**
 * Button that reads text aloud when clicked
 * Uses either Google Cloud TTS or the browser's speech synthesis API
 */
export const VoiceReadingButton: React.FC<VoiceReadingButtonProps> = ({
  text,
  options,
  iconOnly = false,
  className,
  style,
  tooltipText = 'הקרא את הטקסט',
  size = 'middle'
}) => {
  const { 
    speak, 
    readQuestion, 
    stop, 
    pause, 
    resume, 
    isReading, 
    isPaused, 
    isSupported,
    preferredEngine
  } = useUnifiedTTS();
  
  const [currentStyle, setCurrentStyle] = useState<string>('DEFAULT');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  
  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const handleClick = () => {
    if (!isSupported) {
      console.warn('Speech synthesis is not supported in this browser');
      return;
    }

    if (isReading) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      if (options && options.length > 0) {
        // Read question with options
        readQuestion(text, options);
      } else {
        // Read only the question text
        const speechOptions: UnifiedTTSOptions = {
          style: currentStyle as any,
          rate: speechRate,
          improveHebrew: true
        };
        speak(text, speechOptions);
      }
    }
  };

  // If speech synthesis is not supported, don't render the button
  if (!isSupported) {
    return null;
  }

  // Determine which icon to show based on the reading state
  const icon = isReading
    ? isPaused
      ? <PlayCircleOutlined />
      : <PauseOutlined />
    : <PlayCircleOutlined />;

  const buttonText = isReading
    ? isPaused
      ? 'המשך הקראה'
      : 'השהה הקראה'
    : options && options.length > 0 
      ? 'הקרא שאלה ואפשרויות'
      : 'הקרא';

  return (
    <Tooltip title={tooltipText}>
      <Button
        type="default"
        icon={icon}
        onClick={handleClick}
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 8px',
          width: '32px',
          height: '32px'
        }}
        size={size}
      />
    </Tooltip>
  );
}; 
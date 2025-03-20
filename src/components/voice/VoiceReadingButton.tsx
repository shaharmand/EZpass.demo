import React, { useEffect, useState } from 'react';
import { Button, Tooltip, Space } from 'antd';
import { 
  SoundOutlined, 
  LoadingOutlined, 
  PauseOutlined, 
  PlayCircleOutlined, 
  SettingOutlined,
  GoogleOutlined
} from '@ant-design/icons';
import { useUnifiedTTS, TTSEngine, UnifiedTTSOptions } from '../../services/voice/unifiedTTS';
import { VoiceSettingsPanel } from './VoiceSettingsPanel';

interface VoiceReadingButtonProps {
  text: string;
  options?: string[]; // For multiple choice questions
  iconOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  tooltipText?: string;
  size?: 'small' | 'middle' | 'large';
  showStyleControls?: boolean;
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
  size = 'middle',
  showStyleControls = false
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
    isGoogleSupported,
    preferredEngine
  } = useUnifiedTTS();
  
  const [currentStyle, setCurrentStyle] = useState<string>('DEFAULT');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isSettingsVisible, setIsSettingsVisible] = useState<boolean>(false);
  
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

  const openSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsVisible(true);
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
    <>
      <Space size={0}>
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
              borderTopRightRadius: showStyleControls ? 0 : undefined,
              borderBottomRightRadius: showStyleControls ? 0 : undefined,
              borderRight: showStyleControls ? 'none' : undefined,
              padding: '4px 8px',
              width: '32px',
              height: '32px'
            }}
            size={size}
          />
        </Tooltip>
        
        {showStyleControls && (
          <Button
            type="default"
            icon={<SettingOutlined />}
            onClick={openSettings}
            size={size}
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              padding: '4px 8px',
              width: '32px',
              height: '32px'
            }}
          />
        )}
      </Space>

      <VoiceSettingsPanel 
        visible={isSettingsVisible} 
        onClose={() => setIsSettingsVisible(false)} 
      />
    </>
  );
}; 
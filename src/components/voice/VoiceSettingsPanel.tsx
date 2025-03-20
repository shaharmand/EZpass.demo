import React, { useState, useEffect } from 'react';
import { Drawer, Slider, Select, Switch, Typography, Divider, Button, Space, Radio, Tabs, Alert } from 'antd';
import { 
  SettingOutlined, 
  SoundOutlined, 
  CloudOutlined,
  PlayCircleOutlined,
  PauseOutlined,
  GoogleOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useUnifiedTTS, TTSEngine } from '../../services/voice/unifiedTTS';
import { GOOGLE_HEBREW_VOICES } from '../../services/voice/googleTTS';

const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const SettingsContainer = styled.div`
  direction: rtl;
  padding: 16px 0;
`;

const SettingRow = styled.div`
  margin-bottom: 24px;
`;

const SliderContainer = styled.div`
  margin-top: 8px;
  padding: 0 8px;
`;

interface VoiceSettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({
  visible,
  onClose
}) => {
  const { 
    speak, 
    stop, 
    isReading,
    isSupported,
    isBrowserSupported,
    isGoogleSupported,
    voices, 
    preferredVoice, 
    setVoice,
    preferredEngine,
    setPreferredEngine,
    ReadingStyles
  } = useUnifiedTTS();

  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [selectedStyle, setSelectedStyle] = useState<keyof typeof ReadingStyles>('DEFAULT');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(preferredVoice);
  const [selectedGoogleVoice, setSelectedGoogleVoice] = useState<string>(GOOGLE_HEBREW_VOICES[0].value);
  const [improveHebrew, setImproveHebrew] = useState<boolean>(true);
  const [testText, setTestText] = useState<string>('שלום, זוהי בדיקה של מערכת ההקראה.');
  const [activeTab, setActiveTab] = useState<string>(
    preferredEngine === TTSEngine.GOOGLE ? 'google' : 'browser'
  );

  // Update local state when preferred voice changes
  useEffect(() => {
    if (preferredVoice && (!selectedVoice || selectedVoice.name !== preferredVoice.name)) {
      setSelectedVoice(preferredVoice);
    }
  }, [preferredVoice]);

  // Update preferred engine when tab changes
  useEffect(() => {
    const newEngine = activeTab === 'google' && isGoogleSupported 
      ? TTSEngine.GOOGLE 
      : TTSEngine.BROWSER;
    
    // Only update if the engine is actually changing
    if (newEngine !== preferredEngine) {
      setPreferredEngine(newEngine);
    }
  }, [activeTab, isGoogleSupported, setPreferredEngine, preferredEngine]);

  // Apply style preset when style changes
  useEffect(() => {
    if (selectedStyle) {
      const style = ReadingStyles[selectedStyle];
      if (style.rate !== rate || style.pitch !== pitch) {
        setRate(style.rate);
        setPitch(style.pitch);
      }
    }
  }, [selectedStyle, ReadingStyles, rate, pitch]);

  // Function to create and play a simple test beep
  const playTestBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context created:', audioContext.state);
      
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('Audio context resumed successfully');
        }).catch(err => {
          console.error('Failed to resume audio context:', err);
          alert('יש לאשר את השמע באופן ידני. נסה שוב לאחר אישור.');
        });
      }
      
      // Create an oscillator for a beep sound
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      
      // Create a gain node to control volume
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
      
      // Connect the nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Start and stop the beep
      oscillator.start();
      console.log('Test beep started');
      
      // Stop after 0.5 seconds
      setTimeout(() => {
        oscillator.stop();
        console.log('Test beep stopped');
        
        // Close the context when done to free resources
        setTimeout(() => {
          audioContext.close().then(() => {
            console.log('Audio context closed');
          });
        }, 100);
      }, 500);
    } catch (error) {
      console.error('Error creating test beep:', error);
      alert(`שגיאת השמעה: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test current voice settings
  const handleTestVoice = () => {
    if (isReading) {
      stop();
    } else {
      // Use the appropriate engine based on active tab
      const engine = activeTab === 'google' ? TTSEngine.GOOGLE : TTSEngine.BROWSER;
      
      speak(testText, {
        engine,
        rate,
        pitch,
        voice: selectedVoice || undefined,
        improveHebrew,
        googleOptions: {
          voiceName: selectedGoogleVoice
        }
      });
    }
  };

  // Filter to show only Hebrew voices first, then others
  const sortedVoices = [...voices].sort((a, b) => {
    const aIsHebrew = a.lang.includes('he') || a.lang.includes('iw');
    const bIsHebrew = b.lang.includes('he') || b.lang.includes('iw');
    
    if (aIsHebrew && !bIsHebrew) return -1;
    if (!aIsHebrew && bIsHebrew) return 1;
    return a.name.localeCompare(b.name);
  });

  // Function to test if audio playback works with an embedded sound
  const playEmbeddedSound = () => {
    try {
      // Create a simple test audio using Web Audio API
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
      console.error('Error in audio test:', error);
      alert('שגיאת השמעה: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', direction: 'rtl' }}>
          <SoundOutlined />
          <span>הגדרות הקראה</span>
        </div>
      }
      placement="right"
      closable={true}
      onClose={onClose}
      open={visible}
      width={350}
    >
      <div style={{ marginBottom: 20 }}>
        <Alert
          message="בעיות שמע?"
          description={
            <div>
              <p>אם אינך שומע את השמע, נסה את האפשרויות הבאות:</p>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button onClick={playTestBeep} type="primary">
                  השמע צליל בדיקה
                </Button>
                <Button onClick={playEmbeddedSound} type="default">
                  בדיקת שמע מהאינטרנט
                </Button>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>
                  בדוק גם שהדפדפן לא מושתק והווליום פתוח במחשב.
                </div>
              </Space>
            </div>
          }
          type="info"
          showIcon
        />
      </div>
      <SettingsContainer>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          centered
          type="card"
        >
          <TabPane 
            tab={
              <span>
                <GlobalOutlined /> דפדפן
              </span>
            } 
            key="browser"
            disabled={!isBrowserSupported}
          >
            <SettingRow>
              <Title level={5}>סגנון הקראה</Title>
              <Radio.Group 
                value={selectedStyle} 
                onChange={(e) => setSelectedStyle(e.target.value)} 
                buttonStyle="solid"
                style={{ marginTop: '8px', width: '100%', display: 'flex', justifyContent: 'space-between' }}
              >
                <Radio.Button value="DEFAULT">רגיל</Radio.Button>
                <Radio.Button value="SLOW">איטי</Radio.Button>
                <Radio.Button value="QUESTION">שאלה</Radio.Button>
                <Radio.Button value="OPTION">אפשרות</Radio.Button>
              </Radio.Group>
            </SettingRow>

            <SettingRow>
              <Title level={5}>מהירות הקראה</Title>
              <SliderContainer>
                <Slider
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={rate}
                  onChange={setRate}
                  marks={{
                    0.5: 'איטי',
                    1: 'רגיל',
                    2: 'מהיר'
                  }}
                />
              </SliderContainer>
            </SettingRow>

            <SettingRow>
              <Title level={5}>גובה קול</Title>
              <SliderContainer>
                <Slider
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  value={pitch}
                  onChange={setPitch}
                  marks={{
                    0.5: 'נמוך',
                    1: 'רגיל',
                    1.5: 'גבוה'
                  }}
                />
              </SliderContainer>
            </SettingRow>

            <SettingRow>
              <Title level={5}>בחירת קול</Title>
              <Select
                value={selectedVoice?.name || ''}
                style={{ width: '100%', marginTop: '8px' }}
                onChange={(value) => {
                  const voice = voices.find(v => v.name === value);
                  if (voice) {
                    setSelectedVoice(voice);
                    if (setVoice) setVoice(voice);
                  }
                }}
              >
                {sortedVoices.map((voice, index) => (
                  <Option key={`${voice.name}-${index}`} value={voice.name}>
                    {voice.name} ({voice.lang})
                    {(voice.lang.includes('he') || voice.lang.includes('iw')) && ' ⭐'}
                  </Option>
                ))}
              </Select>
            </SettingRow>

            <SettingRow>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={5}>שיפור הגייה בעברית</Title>
                <Switch checked={improveHebrew} onChange={setImproveHebrew} />
              </div>
              <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                משפר את ההגייה של מילים נפוצות בעברית
              </Text>
            </SettingRow>
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <GoogleOutlined /> Google
              </span>
            } 
            key="google"
            disabled={!isGoogleSupported}
          >
            <SettingRow>
              <Title level={5}>קול Google</Title>
              <Select
                value={selectedGoogleVoice}
                style={{ width: '100%', marginTop: '8px' }}
                onChange={setSelectedGoogleVoice}
              >
                {GOOGLE_HEBREW_VOICES.map((voice, index) => (
                  <Option key={`google-${voice.value}`} value={voice.value}>
                    {voice.label} {index % 2 === 0 ? '(נשי)' : '(גברי)'}
                  </Option>
                ))}
              </Select>
              <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                קולות Google מספקים איכות הקראה גבוהה יותר בעברית
              </Text>
            </SettingRow>

            <SettingRow>
              <Title level={5}>מהירות דיבור</Title>
              <SliderContainer>
                <Slider
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  value={rate}
                  onChange={setRate}
                  marks={{
                    0.5: 'איטי',
                    1: 'רגיל',
                    1.5: 'מהיר'
                  }}
                />
              </SliderContainer>
            </SettingRow>

            <SettingRow>
              <Title level={5}>גובה קול</Title>
              <SliderContainer>
                <Slider
                  min={-5}
                  max={5}
                  step={1}
                  value={Math.round((pitch - 1) * 10)}
                  onChange={(value) => setPitch(value / 10 + 1)}
                  marks={{
                    '-5': 'נמוך',
                    '0': 'רגיל',
                    '5': 'גבוה'
                  }}
                />
              </SliderContainer>
            </SettingRow>
          </TabPane>
        </Tabs>

        <Divider />

        <SettingRow>
          <Title level={5}>בדיקת הגדרות</Title>
          <div style={{ marginTop: '8px' }}>
            <Button 
              type="primary" 
              icon={isReading ? <PauseOutlined /> : <PlayCircleOutlined />} 
              onClick={handleTestVoice}
              style={{ width: '100%' }}
            >
              {isReading ? 'עצור בדיקה' : 'בדוק הגדרות'}
            </Button>
          </div>
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary">
              מנוע נוכחי: {preferredEngine === TTSEngine.GOOGLE ? 'Google Cloud TTS' : 'דפדפן מקומי'}
            </Text>
          </div>
        </SettingRow>
      </SettingsContainer>
    </Drawer>
  );
}; 
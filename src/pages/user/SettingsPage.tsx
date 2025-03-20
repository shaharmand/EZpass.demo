import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Divider, Radio, Slider, Select, Switch, Button } from 'antd';
import { SettingOutlined, PlayCircleOutlined, PauseOutlined, GlobalOutlined, ArrowRightOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useUnifiedTTS, TTSEngine } from '../../services/voice/unifiedTTS';
import { GOOGLE_HEBREW_VOICES } from '../../services/voice/googleTTS';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
`;

const SettingsCard = styled(Card)`
  margin-bottom: 24px;
`;

const SettingRow = styled.div`
  margin-bottom: 24px;
`;

const SliderContainer = styled.div`
  margin-top: 8px;
  padding: 0 8px;
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const BackButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  height: 32px;
`;

interface VoiceSettings {
  style: string;
  rate: number;
  pitch: number;
  improveHebrew: boolean;
  selectedVoiceName?: string;
  engine?: TTSEngine;
}

const STORAGE_KEY = 'voice_settings';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    speak, 
    stop, 
    isReading, 
    isSupported,
    voices,
    preferredVoice,
    setVoice,
    preferredEngine,
    setPreferredEngine,
    isGoogleSupported
  } = useUnifiedTTS();

  // Load saved settings from localStorage
  const loadSettings = (): VoiceSettings => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      style: 'DEFAULT',
      rate: 1.0,
      pitch: 1.0,
      improveHebrew: true,
      selectedVoiceName: isGoogleSupported ? GOOGLE_HEBREW_VOICES[0].value : preferredVoice?.name,
      engine: isGoogleSupported ? TTSEngine.GOOGLE : TTSEngine.BROWSER
    };
  };

  const [settings, setSettings] = useState<VoiceSettings>(loadSettings());

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Update voice when settings change
  useEffect(() => {
    if (settings.selectedVoiceName) {
      if (settings.engine === TTSEngine.GOOGLE) {
        const voice = GOOGLE_HEBREW_VOICES.find(v => v.value === settings.selectedVoiceName);
        if (voice) {
          if (setVoice) setVoice(voice as any);
        }
      } else {
        const voice = voices.find(v => v.name === settings.selectedVoiceName);
        if (voice) {
          if (setVoice) setVoice(voice);
        }
      }
    }
  }, [settings.selectedVoiceName, settings.engine, voices, setVoice]);

  // Update engine preference when settings change
  useEffect(() => {
    if (settings.engine) {
      setPreferredEngine(settings.engine);
    }
  }, [settings.engine, setPreferredEngine]);

  const handleTestVoice = () => {
    if (isReading) {
      stop();
    } else {
      const testText = "שלום, זהו טקסט בדיקה להגדרות הקול.";
      const speechOptions = {
        style: settings.style as any,
        improveHebrew: settings.improveHebrew,
        engine: settings.engine,
        googleOptions: settings.engine === TTSEngine.GOOGLE ? {
          voiceName: settings.selectedVoiceName,
          pitch: settings.pitch,
          speakingRate: settings.rate,
          ssmlGender: (settings.selectedVoiceName?.includes('Female') ? 'FEMALE' : 'MALE') as 'FEMALE' | 'MALE'
        } : undefined
      };
      speak(testText, speechOptions);
    }
  };

  const handleEngineChange = (engine: TTSEngine) => {
    setSettings(prev => ({ ...prev, engine }));
  };

  const handleVoiceChange = (value: string) => {
    setSettings(prev => ({ ...prev, selectedVoiceName: value }));
  };

  const sortedVoices = [...voices].sort((a, b) => {
    const aIsHebrew = a.lang.includes('he') || a.lang.includes('iw');
    const bIsHebrew = b.lang.includes('he') || b.lang.includes('iw');
    if (aIsHebrew && !bIsHebrew) return -1;
    if (!aIsHebrew && bIsHebrew) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleBack = () => {
    // Get the return URL from location state or default to home
    const returnUrl = (location.state as any)?.from || '/';
    // Force a full page navigation
    window.location.href = returnUrl;
  };

  return (
    <Container>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <HeaderContainer>
          <BackButton onClick={handleBack} icon={<ArrowRightOutlined />}>
            חזור
          </BackButton>
          <Title level={2} style={{ margin: 0 }}>
            <SettingOutlined style={{ marginLeft: 8 }} />
            הגדרות
          </Title>
        </HeaderContainer>

        <SettingsCard>
          <Title level={4}>הגדרות הקראה</Title>
          <Text>כאן תוכל להגדיר את ההעדפות שלך להקראת טקסט</Text>
          <Divider />
          
          <SettingRow>
            <Title level={5}>מנוע הקראה</Title>
            <Radio.Group 
              value={settings.engine} 
              onChange={(e) => handleEngineChange(e.target.value)}
              buttonStyle="solid"
              style={{ marginTop: '8px', width: '100%', display: 'flex', justifyContent: 'space-between' }}
            >
              {isGoogleSupported && (
                <Radio.Button value={TTSEngine.GOOGLE}>Google Cloud TTS</Radio.Button>
              )}
              <Radio.Button value={TTSEngine.BROWSER}>דפדפן מקומי</Radio.Button>
            </Radio.Group>
          </SettingRow>

          <SettingRow>
            <Title level={5}>סגנון הקראה</Title>
            <Radio.Group 
              value={settings.style} 
              onChange={(e) => setSettings(prev => ({ ...prev, style: e.target.value }))} 
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
                value={settings.rate}
                onChange={(value) => setSettings(prev => ({ ...prev, rate: value }))}
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
                value={settings.pitch}
                onChange={(value) => setSettings(prev => ({ ...prev, pitch: value }))}
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
              value={settings.selectedVoiceName}
              style={{ width: '100%', marginTop: '8px' }}
              onChange={handleVoiceChange}
            >
              {settings.engine === TTSEngine.GOOGLE ? (
                GOOGLE_HEBREW_VOICES.map((voice) => (
                  <Option key={voice.value} value={voice.value}>
                    {voice.label}
                  </Option>
                ))
              ) : (
                voices.map((voice, index) => (
                  <Option key={`${voice.name}-${index}`} value={voice.name}>
                    {voice.name} ({voice.lang})
                    {(voice.lang.includes('he') || voice.lang.includes('iw')) && ' ⭐'}
                  </Option>
                ))
              )}
            </Select>
          </SettingRow>

          <SettingRow>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5}>שיפור הגייה בעברית</Title>
              <Switch 
                checked={settings.improveHebrew} 
                onChange={(checked) => setSettings(prev => ({ ...prev, improveHebrew: checked }))} 
              />
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
              משפר את ההגייה של מילים נפוצות בעברית
            </Text>
          </SettingRow>

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
                מנוע נוכחי: {settings.engine === TTSEngine.GOOGLE ? 'Google Cloud TTS' : 'דפדפן מקומי'}
              </Text>
            </div>
          </SettingRow>
        </SettingsCard>

        <SettingsCard>
          <Title level={4}>הגדרות תצוגה</Title>
          <Text>הגדרות הקשורות לתצוגת הממשק</Text>
          <Divider />
          {/* Add display settings here */}
        </SettingsCard>

        <SettingsCard>
          <Title level={4}>הגדרות התראות</Title>
          <Text>הגדרות הקשורות להתראות מערכת</Text>
          <Divider />
          {/* Add notification settings here */}
        </SettingsCard>
      </Space>
    </Container>
  );
};

export default SettingsPage; 
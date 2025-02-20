import React, { useEffect, useState } from 'react';
import { Space, Typography, Tooltip, Spin } from 'antd';
import { BookOutlined, AppstoreOutlined, SignalFilled, DatabaseOutlined } from '@ant-design/icons';
import { examService } from '../services/examService';
import type { Topic, SubTopic } from '../types/shared/exam';

const { Text } = Typography;

interface QuestionMetadataProps {
  metadata: {
    topicId: string;
    subtopicId?: string;
    type: string;
    difficulty: string;
    source: {
      type: 'exam' | 'book' | 'ezpass';
      examType?: string;
      year?: number;
      season?: string;
      moed?: string;
      bookName?: string;
      publisher?: string;
    } | string;
  };
}

interface TopicInfo {
  name: string;
  description: string;
  subTopic?: {
    name: string;
    description: string;
  };
}

const formatSource = (source: { 
  type: 'exam' | 'book' | 'ezpass';
  examType?: string; 
  year?: number; 
  season?: string; 
  moed?: string;
  bookName?: string;
  publisher?: string;
} | string): string => {
  if (typeof source === 'string') return source;
  
  switch (source.type) {
    case 'exam':
      const examParts = [
        source.examType || '',
        source.year?.toString() || '',
        source.season || '',
        source.moed ? `מועד ${source.moed}` : ''
      ].filter(Boolean);
      return examParts.length > 0 ? `מבחן ${examParts.join(' ')}` : 'מבחן';
    
    case 'book':
      const bookParts = [
        source.bookName || '',
        source.publisher || ''
      ].filter(Boolean);
      return bookParts.length > 0 ? `ספר ${bookParts.join(' - ')}` : 'ספר';
    
    case 'ezpass':
    default:
      return 'איזיפס';
  }
};

const getTypeDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    'רב-ברירה': 'שאלה עם מספר אפשרויות תשובה, מתוכן יש לבחור את התשובה הנכונה',
    'פתוח': 'שאלה הדורשת תשובה מילולית או פתרון מפורט'
  };
  return descriptions[type] || 'סוג שאלה לא מוגדר';
};

const getDifficultyDescription = (level: string): string => {
  const descriptions: Record<string, string> = {
    '1': 'רמה קלה - שאלות בסיסיות להבנת החומר',
    '2': 'רמה קלה-בינונית - שאלות המשלבות מספר מושגים בסיסיים',
    '3': 'רמה בינונית - שאלות הדורשות הבנה מעמיקה והתמודדות עם מורכבות מסוימת',
    '4': 'רמה בינונית-קשה - שאלות מאתגרות הדורשות שליטה טובה בחומר',
    '5': 'רמה קשה - שאלות מאתגרות במיוחד הדורשות חשיבה מעמיקה ויצירתית'
  };
  return descriptions[level] || 'רמת קושי לא מוגדרת';
};

const getSourceDescription = (source: string): string => {
  if (source.startsWith('מבחן')) {
    return 'שאלה מתוך מבחן רשמי קודם';
  } else if (source.startsWith('ספר')) {
    return 'שאלה מתוך ספר לימוד';
  } else if (source === 'איזיפס') {
    return 'שאלה מקורית שנכתבה על ידי צוות איזיפס';
  }
  return 'מקור השאלה';
};

const getTopicTooltip = (topicInfo: TopicInfo): React.ReactNode => {
  return (
    <div style={{ maxWidth: '300px', direction: 'rtl', color: 'white' }}>
      <div>
        <Text strong style={{ color: 'white' }}>נושא ראשי: {topicInfo.name}</Text>
        <br />
        <Text style={{ color: 'white' }}>{topicInfo.description}</Text>
      </div>
      {topicInfo.subTopic && (
        <>
          <div style={{ margin: '8px 0', height: '1px', background: '#4b5563' }} />
          <div>
            <Text strong style={{ color: 'white' }}>תת-נושא: {topicInfo.subTopic.name}</Text>
            <br />
            <Text style={{ color: 'white' }}>{topicInfo.subTopic.description}</Text>
          </div>
        </>
      )}
    </div>
  );
};

const QuestionMetadata: React.FC<QuestionMetadataProps> = ({ metadata }) => {
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTopicInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load main topic data
        const mainTopicData = await examService.getTopicData(metadata.topicId);
        
        // If we have a subtopic, load its data too
        let subTopicData = null;
        if (metadata.subtopicId) {
          const fullTopicData = await examService.getTopicData(metadata.topicId);
          subTopicData = fullTopicData.subTopics?.find((st: { id: string; name: string; description: string }) => 
            st.id === metadata.subtopicId
          );
        }

        setTopicInfo({
          name: mainTopicData.name,
          description: mainTopicData.description,
          subTopic: subTopicData ? {
            name: subTopicData.name,
            description: subTopicData.description
          } : undefined
        });
      } catch (err) {
        console.error('Error loading topic info:', err);
        setError(err instanceof Error ? err.message : 'Failed to load topic information');
      } finally {
        setLoading(false);
      }
    };

    loadTopicInfo();
  }, [metadata.topicId, metadata.subtopicId]);

  return (
    <div style={{ 
      display: 'flex', 
      gap: '16px',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      {/* Topic with Enhanced Tooltip */}
      <Tooltip 
        title={loading ? 'טוען מידע...' : error ? error : topicInfo ? getTopicTooltip(topicInfo) : 'מידע לא זמין'}
        overlayStyle={{ 
          maxWidth: '400px',
          opacity: 1
        }}
        overlayInnerStyle={{
          color: 'white'
        }}
        placement="top"
        color="#1f2937"
      >
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          border: '1px solid #f3f4f6',
          cursor: 'help'
        }}>
          <BookOutlined style={{ fontSize: '14px', color: '#9ca3af' }} />
          {loading ? (
            <Spin size="small" />
          ) : (
            <Text style={{ color: '#4b5563', fontSize: '14px' }}>
              {topicInfo ? (
                <>
                  {topicInfo.name}
                  {topicInfo.subTopic && ` / ${topicInfo.subTopic.name}`}
                </>
              ) : (
                metadata.topicId
              )}
            </Text>
          )}
        </div>
      </Tooltip>

      {/* Type */}
      <Tooltip 
        title={<Text style={{ color: 'white' }}>{getTypeDescription(metadata.type)}</Text>}
        placement="top"
        color="#1f2937"
      >
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          border: '1px solid #f3f4f6',
          cursor: 'help'
        }}>
          <AppstoreOutlined style={{ fontSize: '14px', color: '#9ca3af' }} />
          <Text style={{ color: '#4b5563', fontSize: '14px' }}>
            {metadata.type}
          </Text>
        </div>
      </Tooltip>

      {/* Difficulty */}
      <Tooltip 
        title={<Text style={{ color: 'white' }}>{getDifficultyDescription(metadata.difficulty)}</Text>}
        placement="top"
        color="#1f2937"
      >
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          border: '1px solid #f3f4f6',
          cursor: 'help'
        }}>
          <SignalFilled style={{ 
            fontSize: '14px', 
            color: '#9ca3af',
            transform: 'rotate(90deg)'
          }} />
          <Text style={{ color: '#4b5563', fontSize: '14px' }}>
            רמה {metadata.difficulty}
          </Text>
        </div>
      </Tooltip>

      {/* Source */}
      <Tooltip 
        title={<Text style={{ color: 'white' }}>{getSourceDescription(formatSource(metadata.source))}</Text>}
        placement="top"
        color="#1f2937"
      >
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          border: '1px solid #f3f4f6',
          cursor: 'help'
        }}>
          <DatabaseOutlined style={{ fontSize: '14px', color: '#9ca3af' }} />
          <Text style={{ color: '#4b5563', fontSize: '14px' }}>
            {formatSource(metadata.source)}
          </Text>
        </div>
      </Tooltip>
    </div>
  );
};

export default QuestionMetadata; 
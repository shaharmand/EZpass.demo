import React from 'react';
import { Space, Typography, Tooltip } from 'antd';
import { BookOutlined, AppstoreOutlined, SignalFilled, DatabaseOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface QuestionMetadataProps {
  metadata: {
    topic: {
      main: string;
      sub?: string;
    };
    type: string;
    difficulty: string;
    source?: string;
  };
}

interface TopicInfo {
  name: string;
  description: string;
}

const getTopicInfo = (id: string): TopicInfo => {
  const topicMap: Record<string, TopicInfo> = {
    // Safety Management Topics
    'safety_management': {
      name: 'ניהול בטיחות',
      description: 'ניהול מערך הבטיחות באתר בנייה, כולל תכנון, יישום ובקרה'
    },
    'safety_regulations': {
      name: 'תקנות בטיחות',
      description: 'חוקים ותקנות בטיחות בעבודה באתרי בנייה, דרישות רגולטוריות ותקנים מחייבים'
    },
    'risk_assessment': {
      name: 'הערכת סיכונים',
      description: 'זיהוי, ניתוח והערכת סיכונים באתר בנייה, קביעת אמצעי בקרה ומניעה'
    },
    'safety_planning': {
      name: 'תכנון בטיחות',
      description: 'תכנון מערך בטיחות, כולל נהלים, הדרכות ואמצעי בטיחות'
    },
    
    // Work at Height Topics
    'work_at_height': {
      name: 'עבודה בגובה',
      description: 'בטיחות בעבודה בגובה, כולל שימוש בציוד מגן אישי ואמצעי בטיחות'
    },
    'scaffolding': {
      name: 'פיגומים',
      description: 'הקמה, שימוש ותחזוקה של פיגומים, כולל בדיקות תקופתיות ואמצעי בטיחות'
    },
    'fall_protection': {
      name: 'הגנה מנפילה',
      description: 'אמצעים למניעת נפילה מגובה, כולל רתמות בטיחות, קווי חיים ומעקות'
    },
    
    // Construction Operations
    'construction_operations': {
      name: 'עבודות בנייה',
      description: 'בטיחות בביצוע עבודות בנייה שונות, כולל חפירות, יציקות והריסות'
    },
    'excavation': {
      name: 'חפירות',
      description: 'בטיחות בעבודות חפירה, כולל דיפון, תמיכה וניקוז'
    },
    'demolition': {
      name: 'הריסות',
      description: 'בטיחות בעבודות הריסה, כולל תכנון, ביצוע ופינוי'
    },
    
    // Equipment Safety
    'equipment_safety': {
      name: 'בטיחות בציוד',
      description: 'בטיחות בשימוש בציוד בנייה, כולל ציוד מכני הנדסי וכלי עבודה'
    },
    'heavy_equipment': {
      name: 'ציוד כבד',
      description: 'בטיחות בהפעלת ציוד מכני הנדסי, כולל מנופים, מחפרים וטרקטורים'
    },
    'power_tools': {
      name: 'כלי עבודה חשמליים',
      description: 'בטיחות בשימוש בכלי עבודה חשמליים, כולל בדיקות תקופתיות ותחזוקה'
    }
  };
  
  return topicMap[id] || { name: id, description: 'תיאור לא זמין' };
};

const getTopicDisplayName = (id: string): string => {
  return getTopicInfo(id).name;
};

const getTopicTooltip = (mainTopic: string, subTopic?: string): React.ReactNode => {
  const mainTopicInfo = getTopicInfo(mainTopic);
  const subTopicInfo = subTopic ? getTopicInfo(subTopic) : null;

  return (
    <div style={{ maxWidth: '300px', direction: 'rtl', color: 'white' }}>
      <div>
        <Text strong style={{ color: 'white' }}>נושא ראשי: {mainTopicInfo.name}</Text>
        <br />
        <Text style={{ color: 'white' }}>{mainTopicInfo.description}</Text>
      </div>
      {subTopicInfo && (
        <>
          <div style={{ margin: '8px 0', height: '1px', background: '#4b5563' }} />
          <div>
            <Text strong style={{ color: 'white' }}>תת-נושא: {subTopicInfo.name}</Text>
            <br />
            <Text style={{ color: 'white' }}>{subTopicInfo.description}</Text>
          </div>
        </>
      )}
    </div>
  );
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

const getTypeDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    'רב-ברירה': 'שאלה עם מספר אפשרויות תשובה, מתוכן יש לבחור את התשובה הנכונה',
    'פתוח': 'שאלה הדורשת תשובה מילולית או פתרון מפורט'
  };
  return descriptions[type] || 'סוג שאלה לא מוגדר';
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

const QuestionMetadata: React.FC<QuestionMetadataProps> = ({ metadata }) => {
  return (
    <div style={{ 
      padding: '8px 24px',
      backgroundColor: '#ffffff'
    }}>
      <div style={{ 
        display: 'flex', 
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Topic with Enhanced Tooltip */}
        <Tooltip 
          title={getTopicTooltip(metadata.topic.main, metadata.topic.sub)}
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
            <Text style={{ color: '#4b5563', fontSize: '14px' }}>
              {getTopicDisplayName(metadata.topic.main)}
              {metadata.topic.sub && ` / ${getTopicDisplayName(metadata.topic.sub)}`}
            </Text>
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
        {metadata.source && (
          <Tooltip 
            title={<Text style={{ color: 'white' }}>{getSourceDescription(metadata.source)}</Text>}
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
                {metadata.source}
              </Text>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default QuestionMetadata; 
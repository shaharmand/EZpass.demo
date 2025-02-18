import React from 'react';
import { 
  BookOutlined, 
  CalculatorOutlined, 
  BulbOutlined, 
  InfoCircleOutlined,
  CheckSquareOutlined,
  FormOutlined,
  SignalFilled,
  CaretRightOutlined
} from '@ant-design/icons';
import { Space, Tag } from 'antd';

interface QuestionMetadataProps {
  metadata: {
    topic: {
      main: string;
      sub?: string;
    };
    type: 'רב-ברירה' | 'פתוח' | 'חישובית';
    difficulty: string;
    source?: {
      examType: string;
      year?: number;
      season?: string;
      moed?: string;
    };
  };
}

const QuestionMetadata: React.FC<QuestionMetadataProps> = ({ metadata }) => {
  return (
    <div style={{ padding: '0 24px 16px' }}>
      <Space size={[0, 8]} wrap>
        {/* Topic */}
        <Tag 
          icon={<BookOutlined />}
          color="default"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px'
          }}
        >
          {metadata.topic.main}
          {metadata.topic.sub && (
            <>
              <CaretRightOutlined style={{ fontSize: '10px', color: '#9ca3af' }} />
              {metadata.topic.sub}
            </>
          )}
        </Tag>

        {/* Question Type */}
        <Tag
          icon={
            metadata.type === 'רב-ברירה' ? (
              <CheckSquareOutlined />
            ) : metadata.type === 'חישובית' ? (
              <CalculatorOutlined />
            ) : (
              <FormOutlined />
            )
          }
          color="blue"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px'
          }}
        >
          {metadata.type}
        </Tag>

        {/* Difficulty */}
        <Tag
          icon={<SignalFilled />}
          color="gold"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px'
          }}
        >
          רמה {metadata.difficulty}
        </Tag>

        {/* Source (if exists) */}
        {metadata.source && (
          <Tag
            icon={<BookOutlined />}
            color="purple"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px'
            }}
          >
            {metadata.source.examType}
            {metadata.source.year && ` ${metadata.source.year}`}
            {metadata.source.season && ` ${metadata.source.season}`}
            {metadata.source.moed && ` מועד ${metadata.source.moed}`}
          </Tag>
        )}
      </Space>
    </div>
  );
};

export default QuestionMetadata; 
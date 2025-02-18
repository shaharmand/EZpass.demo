import React from 'react';
import { 
  BookOutlined, 
  CalculatorOutlined, 
  BulbOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';

interface QuestionMetadataProps {
  metadata: {
    topic?: {
      main: string;
      sub?: string | null;
    };
    type?: string;
    difficulty?: string;
    source?: {
      examType?: string;
      year?: number;
      season?: string;
      moed?: string;
    };
  };
}

const QuestionMetadata: React.FC<QuestionMetadataProps> = ({ metadata }) => {
  return (
    <div style={{ 
      padding: '0 24px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      {/* Main topic/subtopic with larger emphasis */}
      <div style={{ flex: '1' }}>
        {metadata?.topic?.sub ? (
          <span>
            <span style={{ 
              color: '#1f2937', 
              fontWeight: '600',
              fontSize: '1.1rem' 
            }}>
              {metadata.topic.sub}
            </span>
            <span style={{ 
              color: '#64748b',
              fontSize: '0.9rem',
              marginRight: '4px'
            }}>
              {metadata.topic.main ? ` (${metadata.topic.main})` : ''}
            </span>
          </span>
        ) : (
          <span style={{ color: '#1f2937', fontWeight: '500' }}>
            {metadata?.topic?.main || ''}
          </span>
        )}
      </div>

      {/* Secondary metadata in a subtle pill layout */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#f8fafc',
        padding: '6px 12px',
        borderRadius: '20px',
        border: '1px solid #e2e8f0'
      }}>
        {metadata?.type && (
          <span style={{
            fontSize: '0.85rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {metadata.type === 'רב-ברירה' ? (
              <BookOutlined style={{ fontSize: '14px' }} />
            ) : metadata.type === 'חישובית' ? (
              <CalculatorOutlined style={{ fontSize: '14px' }} />
            ) : (
              <BookOutlined style={{ fontSize: '14px' }} />
            )}
            {metadata.type}
          </span>
        )}

        <span style={{ 
          width: '1px', 
          height: '12px', 
          backgroundColor: '#e2e8f0' 
        }} />

        {metadata?.difficulty && (
          <span style={{
            fontSize: '0.85rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <BulbOutlined style={{ fontSize: '14px' }} />
            {metadata.difficulty}
          </span>
        )}

        <span style={{ 
          width: '1px', 
          height: '12px', 
          backgroundColor: '#e2e8f0' 
        }} />

        {metadata?.source && (
          <span style={{
            fontSize: '0.85rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <InfoCircleOutlined style={{ fontSize: '14px' }} />
            {[
              metadata.source.examType,
              metadata.source.year,
              metadata.source.season,
              metadata.source.moed
            ].filter(Boolean).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
};

export default QuestionMetadata; 
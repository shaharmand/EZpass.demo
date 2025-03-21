import React from 'react';
import { Card, Space, Typography, List } from 'antd';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { CheckOutlined } from '@ant-design/icons';
import { AnswerContentGuidelines } from '../../types/question';

const { Text, Title } = Typography;

interface QuestionEvaluationProps {
  evaluation: AnswerContentGuidelines;
  className?: string;
  showCard?: boolean;
}

const listItemStyle = {
  backgroundColor: '#ffffff',
  padding: '12px 16px',
  borderRadius: '8px',
  marginBottom: '8px',
  fontSize: '16px',
  direction: 'rtl' as const,
  textAlign: 'right' as const
};

export const QuestionEvaluation: React.FC<QuestionEvaluationProps> = ({
  evaluation,
  className = '',
  showCard = true
}) => {
  const EvaluationContent = () => (
    <div className={`evaluation-content ${className}`} style={{ direction: 'rtl', textAlign: 'right' }}>
      {/* Required Criteria */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={5} style={{ marginBottom: '16px' }}>קריטריונים להערכה:</Title>
        {evaluation.requiredCriteria?.length ? (
          <List
            dataSource={evaluation.requiredCriteria}
            renderItem={(criterion, index) => (
              <List.Item style={listItemStyle}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space align="baseline">
                    <Text strong>{index + 1}.</Text>
                    <Text strong>{criterion.name}</Text>
                    <Text type="secondary">({criterion.weight}%)</Text>
                  </Space>
                  <div style={{ marginRight: '20px' }}>
                    <MarkdownRenderer content={criterion.description} />
                  </div>
                </Space>
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary" style={listItemStyle}>יש להגדיר קריטריונים להערכה</Text>
        )}
      </div>
    </div>
  );

  if (!showCard) {
    return <EvaluationContent />;
  }

  return (
    <Card
      title={
        <Space>
          <CheckOutlined />
          <span>מחוון הערכה</span>
        </Space>
      }
    >
      <EvaluationContent />
    </Card>
  );
}; 
import React from 'react';
import { Card, Progress, Typography, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface RubricFeedbackProps {
  rubricScores: {
    [criterionName: string]: {
      score: number;
      feedback: string;
    };
  };
  rubricAssessment: {
    criteria: Array<{
      name: string;
      description: string;
      weight: number;
    }>;
  };
}

// Hebrew translations for common criterion names
const criterionTranslations: { [key: string]: string } = {
  'Accuracy': 'דיוק',
  'Correctness': 'נכונות',
  'Methodology': 'מתודולוגיה',
  'Process': 'תהליך',
  'Clarity': 'בהירות',
  'Understanding': 'הבנה',
  'Functionality': 'פונקציונליות',
  'Efficiency': 'יעילות',
  'Style': 'סגנון',
  'Testing': 'בדיקות',
  'Validation': 'אימות',
  'Calculations': 'חישובים',
  'Completeness': 'שלמות',
  'Organization': 'ארגון',
  'Presentation': 'הצגה'
};

const getHebrewName = (englishName: string): string => {
  return criterionTranslations[englishName] || englishName;
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return '#52c41a';
  if (score >= 80) return '#1890ff';
  if (score >= 70) return '#faad14';
  if (score >= 60) return '#fa8c16';
  return '#f5222d';
};

export const RubricFeedback: React.FC<RubricFeedbackProps> = ({
  rubricScores,
  rubricAssessment
}) => {
  return (
    <div style={{
      marginTop: '16px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        {rubricAssessment.criteria.map((criterion) => {
          const score = rubricScores[criterion.name];
          return (
            <Card 
              key={criterion.name}
              style={{ height: '100%' }}
              size="small"
              title={
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}>
                  <span>{getHebrewName(criterion.name)}</span>
                  <Tooltip title={criterion.description}>
                    <InfoCircleOutlined style={{ 
                      color: '#8c8c8c',
                      cursor: 'help'
                    }} />
                  </Tooltip>
                  <Text type="secondary" style={{
                    marginRight: 'auto',
                    fontSize: '12px'
                  }}>
                    {criterion.weight}%
                  </Text>
                </div>
              }
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'center'
              }}>
                <Progress
                  type="circle"
                  percent={score?.score || 0}
                  width={50}
                  strokeColor={getScoreColor(score?.score || 0)}
                />
                <Text style={{
                  fontSize: '14px',
                  color: '#595959'
                }}>
                  {score?.feedback || 'לא נמצא משוב ספציפי'}
                </Text>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 
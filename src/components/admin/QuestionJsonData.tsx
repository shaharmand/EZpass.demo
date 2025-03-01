import React from 'react';
import { DatabaseQuestion } from '../../types/question';
import { JsonDataContainer, JsonDataHeader, JsonDataTitle, JsonDataContent } from '../../utils/translations';
import { Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

interface QuestionJsonDataProps {
  question: DatabaseQuestion;
}

const DB_FIELDS_TO_EXCLUDE = [
  'status',
  'validationStatus',
  'createdAt',
  'updatedAt'
];

const filterDbFields = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => filterDbFields(item));
  }
  
  if (obj && typeof obj === 'object') {
    const filtered: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!DB_FIELDS_TO_EXCLUDE.includes(key)) {
        filtered[key] = filterDbFields(value);
      }
    }
    return filtered;
  }
  
  return obj;
};

const formatJsonWithSyntaxHighlighting = (obj: any): string => {
  return JSON.stringify(obj, null, 2)
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/"([^"]+)"(?=[,\n\s])/g, '<span class="json-string">"$1"</span>')
    .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
    .replace(/\b(null)\b/g, '<span class="json-null">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="json-number">$1</span>');
};

export const QuestionJsonData: React.FC<QuestionJsonDataProps> = ({ question }) => {
  const filteredQuestion = filterDbFields(question);
  
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(filteredQuestion, null, 2));
  };

  return (
    <JsonDataContainer>
      <JsonDataHeader>
        <JsonDataTitle>נתוני השאלה (JSON)</JsonDataTitle>
        <Button 
          icon={<CopyOutlined />}
          onClick={handleCopyJson}
        >
          העתק JSON
        </Button>
      </JsonDataHeader>
      <JsonDataContent 
        dangerouslySetInnerHTML={{ 
          __html: formatJsonWithSyntaxHighlighting(filteredQuestion) 
        }} 
      />
    </JsonDataContainer>
  );
}; 
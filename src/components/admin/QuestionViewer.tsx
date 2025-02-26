import React from 'react';
import { Card, Tabs } from 'antd';
import { Question } from '../../types/question';
import QuestionMetadataViewer from './metadata/QuestionMetadataViewer';
import { AdminQuestionEditor } from './AdminQuestionEditor';
import { EyeOutlined, EditOutlined, CheckOutlined, FileTextOutlined } from '@ant-design/icons';

// Add QuestionWithTimestamps interface
interface QuestionWithTimestamps extends Question {
  createdAt?: string;
  updatedAt?: string;
}

interface AdminQuestionViewerProps {
  question: QuestionWithTimestamps;
  onSave?: (updatedQuestion: Question) => Promise<void>;
}

export const AdminQuestionViewer: React.FC<AdminQuestionViewerProps> = ({
  question,
  onSave
}) => {
  return (
    <div>
      <QuestionMetadataViewer 
        question={question}
        createdAt={question.createdAt}
        updatedAt={question.updatedAt}
      />
      <Card>
        <Tabs
          defaultActiveKey="preview"
          items={[
            {
              key: 'preview',
              label: (
                <span>
                  <EyeOutlined />
                  Preview
                </span>
              ),
              children: <div>Preview Content</div>
            },
            {
              key: 'evaluation',
              label: (
                <span>
                  <CheckOutlined />
                  Evaluation
                </span>
              ),
              children: <div>Evaluation Content</div>
            },
            {
              key: 'solution',
              label: (
                <span>
                  <FileTextOutlined />
                  Solution
                </span>
              ),
              children: <div>Solution Content</div>
            },
            {
              key: 'edit',
              label: (
                <span>
                  <EditOutlined />
                  Edit
                </span>
              ),
              children: (
                <AdminQuestionEditor 
                  question={question}
                  onSave={onSave}
                />
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}; 
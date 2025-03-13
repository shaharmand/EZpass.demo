import React from 'react';
import { Form, Select, Button, Space, Radio } from 'antd';
import styled from 'styled-components';
import { universalTopicsV2 } from '../../../../../../services/universalTopics';
import { QuestionType } from '../../../../../../types/question';

const SelectorContainer = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  direction: rtl;
`;

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
  gap: 24px;

  .form-row {
    display: flex;
    gap: 16px;
    align-items: flex-start;

    .ant-form-item {
      margin-bottom: 0;
      flex: 1;
    }
  }

  .ant-form-item-label {
    text-align: right;
    
    > label {
      font-size: 14px;
      color: #262626;
      height: 32px;
    }
  }

  .ant-select {
    width: 100%;
  }

  .question-type-selector {
    .ant-radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ant-radio-wrapper {
      display: flex;
      align-items: flex-start;
      margin-right: 0;

      .type-content {
        padding-right: 8px;

        .type-title {
          font-weight: 500;
          color: #262626;
        }

        .type-description {
          font-size: 13px;
          color: #595959;
          margin-top: 2px;
        }
      }
    }
  }
`;

const ActionContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
`;

const QUESTION_TYPE_INFO = {
  [QuestionType.MULTIPLE_CHOICE]: {
    title: 'שאלה אמריקאית',
    description: 'שאלה עם מספר אפשרויות תשובה, כאשר רק אחת מהן נכונה'
  },
  [QuestionType.OPEN]: {
    title: 'שאלה פתוחה',
    description: 'שאלה הדורשת תשובה מילולית חופשית'
  },
  [QuestionType.NUMERICAL]: {
    title: 'שאלה מספרית',
    description: 'שאלה הדורשת תשובה מספרית מדויקת'
  }
};

interface QuestionInitializerProps {
  onSubjectChange: (subject: string) => void;
  onDomainChange: (domain: string) => void;
  onTypeChange: (type: QuestionType) => void;
  onInitialSave?: () => Promise<void>;
  initialSubject?: string;
  initialDomain?: string;
  initialType?: QuestionType;
  disabled?: boolean;
  isNewQuestion?: boolean;
}

export const QuestionInitializer: React.FC<QuestionInitializerProps> = ({
  onSubjectChange,
  onDomainChange,
  onTypeChange,
  onInitialSave,
  initialSubject,
  initialDomain,
  initialType = QuestionType.MULTIPLE_CHOICE,
  disabled = false,
  isNewQuestion = false
}) => {
  const [selectedSubject, setSelectedSubject] = React.useState<string | undefined>(initialSubject);
  const [subjects, setSubjects] = React.useState<Array<{ id: string; name: string }>>([]);
  const [domains, setDomains] = React.useState<Array<{ id: string; name: string }>>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const loadSubjects = async () => {
      const availableSubjects: Array<{ id: string; name: string }> = [];
      for (let i = 1; i <= 100; i++) {
        const subject = await universalTopicsV2.getSubjectSafe(i.toString());
        if (!subject) break;
        availableSubjects.push({ id: i.toString(), name: subject.name });
      }
      setSubjects(availableSubjects);
    };
    loadSubjects();
  }, []);

  React.useEffect(() => {
    const loadDomains = async () => {
      if (selectedSubject) {
        const selectedSubjectData = subjects.find(s => s.name === selectedSubject);
        if (selectedSubjectData) {
          const availableDomains: Array<{ id: string; name: string }> = [];
          for (let i = 1; i <= 100; i++) {
            const domain = await universalTopicsV2.getDomainSafe(selectedSubjectData.id, i.toString());
            if (!domain) break;
            availableDomains.push({ id: i.toString(), name: domain.name });
          }
          setDomains(availableDomains);
        }
      } else {
        setDomains([]);
      }
    };
    loadDomains();
  }, [selectedSubject, subjects]);

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    onSubjectChange(value);
    onDomainChange(''); // Reset domain when subject changes
  };

  const handleSave = async () => {
    if (!selectedSubject || !initialDomain || !onInitialSave) return;
    
    setIsSaving(true);
    try {
      await onInitialSave();
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = selectedSubject && initialDomain && !disabled && isNewQuestion;

  return (
    <SelectorContainer>
      <StyledForm layout="vertical">
        <div className="form-row">
          <Form.Item label="תחום לימוד" required>
            <Select
              value={selectedSubject}
              onChange={handleSubjectChange}
              placeholder="בחר תחום לימוד"
              disabled={disabled}
            >
              {subjects.map(subject => (
                <Select.Option key={subject.id} value={subject.name}>
                  {subject.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="נושא" required>
            <Select
              value={initialDomain}
              onChange={onDomainChange}
              placeholder="בחר נושא"
              disabled={!selectedSubject || disabled}
            >
              {domains.map(domain => (
                <Select.Option key={domain.id} value={domain.name}>
                  {domain.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item 
          label="סוג השאלה" 
          required 
          className="question-type-selector"
          help="לא ניתן לשנות את סוג השאלה לאחר היצירה"
        >
          <Radio.Group 
            value={initialType} 
            onChange={e => onTypeChange(e.target.value)}
            disabled={disabled}
          >
            {Object.entries(QUESTION_TYPE_INFO).map(([type, info]) => (
              <Radio key={type} value={type}>
                <div className="type-content">
                  <div className="type-title">{info.title}</div>
                  <div className="type-description">{info.description}</div>
                </div>
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
      </StyledForm>
      
      {isNewQuestion && (
        <ActionContainer>
          <Button
            type="primary"
            onClick={handleSave}
            disabled={!canSave}
            loading={isSaving}
          >
            צור שאלה
          </Button>
        </ActionContainer>
      )}
    </SelectorContainer>
  );
}; 
import React, { useState } from 'react';
import { Card, Space, Button, Typography, Tag, Divider, Input, Select, Rate, Tooltip, Row, Col, Form, Tabs, message } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  QuestionCircleOutlined,
  StarFilled,
  StarOutlined,
  FileTextOutlined,
  BookOutlined,
  SolutionOutlined,
  EyeOutlined,
  TagOutlined
} from '@ant-design/icons';
import { Question, DifficultyLevel } from '../../types/question';
import { MarkdownEditor } from '../MarkdownEditor';
import { MarkdownRenderer } from '../MarkdownRenderer';
import QuestionMetadataEditor from './metadata/QuestionMetadataEditor';
import { universalTopics } from '../../services/universalTopics';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface AdminQuestionEditorProps {
  question: Question;
  onSave?: (updatedQuestion: Question) => Promise<void>;
}

export const AdminQuestionEditor: React.FC<AdminQuestionEditorProps> = ({
  question,
  onSave,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState('question');
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metadataChanges, setMetadataChanges] = useState<Question>(question);
  const [hasMetadataChanges, setHasMetadataChanges] = useState(false);

  const handleEdit = (field: string, content: string) => {
    setEditingField(field);
    setEditedContent(content);
  };

  const handleSaveContent = async (field: string) => {
    if (!onSave) return;

    const updatedQuestion = { ...question };
    switch (field) {
      case 'content':
        updatedQuestion.content.text = editedContent;
        break;
      case 'solution':
        updatedQuestion.solution.text = editedContent;
        break;
      case 'option':
        if (editingField?.startsWith('option-') && updatedQuestion.options) {
          const optionIndex = parseInt(editingField.split('-')[1]) - 1;
          updatedQuestion.options[optionIndex].text = editedContent;
        }
        break;
      case 'rubric':
        if (editingField?.startsWith('rubric-') && updatedQuestion.evaluation) {
          const criterionIndex = parseInt(editingField.split('-')[1]);
          updatedQuestion.evaluation.rubricAssessment.criteria[criterionIndex].description = editedContent;
        }
        break;
      case 'requirement':
        if (editingField?.startsWith('requirement-') && updatedQuestion.evaluation) {
          const reqIndex = parseInt(editingField.split('-')[1]);
          updatedQuestion.evaluation.answerRequirements.requiredElements[reqIndex] = editedContent;
        }
        break;
    }

    try {
      await onSave(updatedQuestion);
      message.success('Saved successfully');
      setEditingField(null);
    } catch (error) {
      message.error('Failed to save changes');
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditedContent('');
  };

  const handleMetadataChange = (updatedMetadata: Partial<Question>) => {
    setMetadataChanges({
      ...metadataChanges,
      ...updatedMetadata,
      // Ensure required fields are always present
      id: question.id,
      type: updatedMetadata.type || question.type,
      content: question.content,
      solution: question.solution
    });
    setHasMetadataChanges(true);
  };

  const validateMetadata = (metadata: Question['metadata']): boolean => {
    if (!metadata) return false;
    
    try {
      // Validate topic reference
      universalTopics.validateTopicReference(metadata.topicId, metadata.subtopicId);
      
      // Validate difficulty
      if (metadata.difficulty < 1 || metadata.difficulty > 5) {
        throw new Error('Invalid difficulty level');
      }

      // Validate estimated time if present
      if (metadata.estimatedTime && (metadata.estimatedTime < 1 || metadata.estimatedTime > 180)) {
        throw new Error('Estimated time must be between 1 and 180 minutes');
      }

      return true;
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Validation failed');
      return false;
    }
  };

  const handleSaveMetadata = async () => {
    if (!onSave || !hasMetadataChanges) return;

    // Validate metadata before saving
    if (!validateMetadata(metadataChanges.metadata)) {
      message.error('אנא תקן את השגיאות לפני השמירה');
      return;
    }

    try {
      message.loading({ content: 'שומר למסד הנתונים...', key: 'saveMetadata' });
      
      // Save to database using onSave prop
      await onSave(metadataChanges);
      
      // Update local state after successful save
      message.success({ 
        content: 'המטא-דאטה נשמר בהצלחה במסד הנתונים', 
        key: 'saveMetadata',
        duration: 2 
      });
      
      setIsEditingMetadata(false);
      setHasMetadataChanges(false);
      
      // Update the base question to reflect saved changes
      question = { ...metadataChanges };
    } catch (error) {
      message.error({ 
        content: 'שגיאה בשמירה למסד הנתונים: ' + (error instanceof Error ? error.message : 'שגיאה לא ידועה'),
        key: 'saveMetadata',
        duration: 3
      });
      console.error('Metadata save error:', error);
    }
  };

  const handleCancelMetadata = () => {
    setIsEditingMetadata(false);
    setMetadataChanges(question); // Reset to original question
    setHasMetadataChanges(false);
  };

  const renderDifficultyStars = (difficulty: DifficultyLevel) => (
    <Space>
      {[...Array(5)].map((_, index) => (
        index < difficulty ? 
          <StarFilled key={index} style={{ color: '#f59e0b' }} /> :
          <StarOutlined key={index} style={{ color: '#d1d5db' }} />
      ))}
    </Space>
  );

  const renderMetadata = () => (
    <Card 
      title={
        <Space>
          <TagOutlined />
          <Title level={4}>Metadata</Title>
        </Space>
      }
      extra={
        isEditingMetadata ? (
          <Space>
            <Button 
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveMetadata}
              disabled={!hasMetadataChanges}
            >
              Save Changes
            </Button>
            <Button 
              icon={<CloseOutlined />}
              onClick={handleCancelMetadata}
            >
              Cancel
            </Button>
          </Space>
        ) : (
          <Button 
            icon={<EditOutlined />}
            onClick={() => setIsEditingMetadata(true)}
          >
            Edit Metadata
          </Button>
        )
      }
    >
      {isEditingMetadata ? (
        <QuestionMetadataEditor 
          question={metadataChanges || question}
          onChange={handleMetadataChange}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text type="secondary">Topic:</Text>
              <div>
                <Text strong>{universalTopics.getTopicName(question.metadata.topicId)}</Text>
                {question.metadata.subtopicId && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {universalTopics.getMostSpecificTopicName(question.metadata.topicId, question.metadata.subtopicId)}
                  </Tag>
                )}
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary">Difficulty:</Text>
              <div>
                {renderDifficultyStars(question.metadata.difficulty)}
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary">Question Type:</Text>
              <div>
                <Tag color="green">{question.type}</Tag>
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary">Estimated Time:</Text>
              <div>
                <Text>{question.metadata.estimatedTime || 'Not set'} minutes</Text>
              </div>
            </Col>
            {question.metadata.source && (
              <Col span={24}>
                <Text type="secondary">Source:</Text>
                <div>
                  {question.metadata.source.examTemplateId && (
                    <Tag color="purple">Template: {question.metadata.source.examTemplateId}</Tag>
                  )}
                  {question.metadata.source.year && (
                    <Tag color="blue">Year: {question.metadata.source.year}</Tag>
                  )}
                  {question.metadata.source.season && (
                    <Tag color="cyan">Season: {question.metadata.source.season}</Tag>
                  )}
                  {question.metadata.source.moed && (
                    <Tag color="orange">Moed: {question.metadata.source.moed}</Tag>
                  )}
                </div>
              </Col>
            )}
          </Row>
        </Space>
      )}
    </Card>
  );

  const renderQuestionContent = () => (
    <Card title={
      <Space>
        <QuestionCircleOutlined />
        <Title level={4}>Question Content</Title>
      </Space>
    }>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Question Text */}
        <Card type="inner" title="Question Text">
          {editingField === 'content' ? (
            <MarkdownEditor
              value={editedContent}
              onChange={setEditedContent}
              onSave={() => handleSaveContent('content')}
              onCancel={handleCancel}
            />
          ) : (
            <div>
              <MarkdownRenderer content={question.content.text} />
              <Button 
                icon={<EditOutlined />}
                onClick={() => handleEdit('content', question.content.text)}
                style={{ marginTop: 16 }}
              >
                Edit Content
              </Button>
            </div>
          )}
        </Card>

        {/* Multiple Choice Options */}
        {question.type === 'multiple_choice' && question.options && (
          <Card type="inner" title="Options">
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.options.map((option, index) => (
                <Card 
                  key={index}
                  size="small"
                  title={`Option ${index + 1}`}
                  extra={
                    <Space>
                      {question.correctOption === index + 1 && (
                        <Tag color="success">Correct</Tag>
                      )}
                      <Button 
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(`option-${index + 1}`, option.text)}
                      />
                    </Space>
                  }
                >
                  {editingField === `option-${index + 1}` ? (
                    <MarkdownEditor
                      value={editedContent}
                      onChange={setEditedContent}
                      onSave={() => handleSaveContent('option')}
                      onCancel={handleCancel}
                    />
                  ) : (
                    <MarkdownRenderer content={option.text} />
                  )}
                </Card>
              ))}
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );

  const renderSolution = () => (
    <Card title={
      <Space>
        <SolutionOutlined />
        <Title level={4}>Solution</Title>
      </Space>
    }>
      {editingField === 'solution' ? (
        <MarkdownEditor
          value={editedContent}
          onChange={setEditedContent}
          onSave={() => handleSaveContent('solution')}
          onCancel={handleCancel}
        />
      ) : (
        <div>
          <MarkdownRenderer content={question.solution.text} />
          <Button 
            icon={<EditOutlined />}
            onClick={() => handleEdit('solution', question.solution.text)}
            style={{ marginTop: 16 }}
          >
            Edit Solution
          </Button>
        </div>
      )}
    </Card>
  );

  const renderEvaluation = () => (
    <Card title={
      <Space>
        <CheckCircleOutlined />
        <Title level={4}>Evaluation Criteria</Title>
      </Space>
    }>
      {/* Rubric Assessment */}
      <Card title="Rubric Assessment" type="inner" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {question.evaluation?.rubricAssessment.criteria.map((criterion, index) => (
            <Card 
              key={index}
              size="small"
              className="criterion-card"
              extra={
                <Button 
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEdit(`rubric-${index}`, criterion.description)}
                />
              }
            >
              {editingField === `rubric-${index}` ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <Space>
                    <Button type="primary" onClick={() => handleSaveContent('rubric')}>
                      Save
                    </Button>
                    <Button onClick={() => setEditingField(null)}>
                      Cancel
                    </Button>
                  </Space>
                </Space>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong>{criterion.name}</Text>
                    <Tag color="blue">{criterion.weight}%</Tag>
                  </Space>
                  <Text type="secondary">{criterion.description}</Text>
                </Space>
              )}
            </Card>
          ))}
        </Space>
      </Card>

      {/* Answer Requirements */}
      <Card title="Answer Requirements" type="inner">
        <Space direction="vertical" style={{ width: '100%' }}>
          {question.evaluation?.answerRequirements.requiredElements.map((element, index) => (
            <Card 
              key={index}
              size="small"
              extra={
                <Button 
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEdit(`requirement-${index}`, element)}
                />
              }
            >
              {editingField === `requirement-${index}` ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Input
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <Space>
                    <Button type="primary" onClick={() => handleSaveContent('requirement')}>
                      Save
                    </Button>
                    <Button onClick={() => setEditingField(null)}>
                      Cancel
                    </Button>
                  </Space>
                </Space>
              ) : (
                <Text>{element}</Text>
              )}
            </Card>
          ))}
        </Space>
      </Card>
    </Card>
  );

  const renderPreview = () => (
    <Card title={
      <Space>
        <EyeOutlined />
        <Title level={4}>Preview</Title>
      </Space>
    }>
      <div className="question-preview">
        {/* Question Content */}
        <div className="preview-section">
          <Title level={5}>Question</Title>
          <MarkdownRenderer content={question.content.text} />
        </div>

        {/* Multiple Choice Options */}
        {question.type === 'multiple_choice' && question.options && (
          <div className="preview-section">
            <Title level={5}>Options</Title>
            {question.options.map((option, index) => (
              <div key={index} className={`preview-option ${question.correctOption === index + 1 ? 'correct' : ''}`}>
                <Text>{index + 1}. </Text>
                <MarkdownRenderer content={option.text} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div style={{ padding: '24px' }}>
      {renderMetadata()}
      <Divider />
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'question',
            label: <Space><FileTextOutlined />Question</Space>,
            children: renderQuestionContent()
          },
          {
            key: 'solution',
            label: <Space><SolutionOutlined />Solution</Space>,
            children: renderSolution()
          },
          {
            key: 'evaluation',
            label: <Space><CheckCircleOutlined />Evaluation</Space>,
            children: renderEvaluation()
          },
          {
            key: 'preview',
            label: <Space><EyeOutlined />Preview</Space>,
            children: renderPreview()
          }
        ]}
      />
    </div>
  );
};
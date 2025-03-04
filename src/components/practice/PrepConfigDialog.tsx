import React, { useState, useEffect } from 'react';
import { Modal, Typography, Space, Form, Input, DatePicker, InputNumber, Tree, Button, Alert, Tooltip } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, QuestionCircleOutlined, AimOutlined } from '@ant-design/icons';
import moment from 'moment';
import type { StudentPrep } from '../../types/prepState';
import type { DataNode } from 'antd/es/tree';
import type { Key } from 'antd/es/table/interface';
import type { Topic, SubTopic } from '../../types/subject';
import { PrepStateManager } from '../../services/PrepStateManager';

const { Title, Text } = Typography;

const DEFAULT_TOTAL_HOURS = 50; // Default recommended hours

interface PrepConfigDialogProps {
  prep: StudentPrep;
  open: boolean;
  onClose: () => void;
}

export const PrepConfigDialog: React.FC<PrepConfigDialogProps> = ({
  prep,
  open,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPrep, setCurrentPrep] = useState<StudentPrep | null>(null);
  const [focusedTopic, setFocusedTopic] = useState<string | null>(null);

  // Generate default name based on exam name and date
  const getDefaultPrepName = (date: moment.Moment) => {
    // Hebrew month names
    const hebrewMonths: Record<string, string> = {
      'January': 'ינואר',
      'February': 'פברואר',
      'March': 'מרץ',
      'April': 'אפריל',
      'May': 'מאי',
      'June': 'יוני',
      'July': 'יולי',
      'August': 'אוגוסט',
      'September': 'ספטמבר',
      'October': 'אוקטובר',
      'November': 'נובמבר',
      'December': 'דצמבר'
    };
    const monthName = hebrewMonths[date.format('MMMM')] || date.format('MMMM');
    return `${currentPrep?.exam.names.medium} (${monthName})`;
  };

  // Calculate recommended questions based on selected subtopics
  const getRecommendedQuestions = (selectedKeys: string[]) => {
    if (!currentPrep) return 0;
    const selectedSubTopicsCount = selectedKeys.filter(key => 
      currentPrep.exam.topics.some(t => t.subTopics.some(st => st.id === key))
    ).length;
    return selectedSubTopicsCount * 50;
  };

  // Convert exam topics to Tree data structure
  const getTreeData = (): DataNode[] => {
    if (!currentPrep) return [];

    console.log('Building tree data:', {
      allTopics: currentPrep.exam.topics.length,
      allSubTopics: currentPrep.exam.topics.reduce((acc, topic) => acc + topic.subTopics.length, 0),
      selectedSubTopics: currentPrep.selection.subTopics.length,
      currentSelection: {
        subTopics: currentPrep.selection.subTopics
      }
    });

    return currentPrep.exam.topics.map(topic => ({
      title: (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            margin: '-4px -8px',
            borderRadius: '4px',
            background: focusedTopic === topic.id ? '#e0f2fe' : 'transparent',
            border: focusedTopic === topic.id ? '1px solid #7dd3fc' : '1px solid transparent',
          }}
        >
          <span>{topic.name}</span>
          <AimOutlined 
            style={{ 
              color: '#0ea5e9',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: focusedTopic === topic.id ? 1 : 0.5,
            }}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open TopicSelectionDialog
              console.log('Opening topic selection dialog for:', topic.id);
            }}
          />
        </div>
      ),
      key: topic.id,
      children: topic.subTopics.map(subTopic => ({
        title: subTopic.name,
        key: subTopic.id,
        isLeaf: true
      }))
    }));
  };

  // Update form when date changes
  const handleDateChange = (date: moment.Moment | null) => {
    if (date) {
      const currentName = form.getFieldValue('prepName');
      // Only update name if it's empty or matches previous default pattern
      if (!currentName || /^.*\([^)]+\)$/.test(currentName)) {
        form.setFieldsValue({ prepName: getDefaultPrepName(date) });
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const values = await form.validateFields();
      
      // Get current prep state
      const freshPrep = PrepStateManager.getPrep(prep.id);
      if (!freshPrep) {
        throw new Error('Prep not found');
      }

      // Update prep with new selection (only subtopics)
      const updatedPrep: StudentPrep = {
        ...freshPrep,
        goals: {
          examDate: values.examDate.valueOf()
        },
        selection: {
          subTopics: values.selectedNodes.filter((key: string) => 
            freshPrep.exam.topics.some(t => 
              t.subTopics.some(st => st.id === key)
            )
          )
        }
      };

      // Save updated prep
      PrepStateManager.updatePrep(updatedPrep);
      setCurrentPrep(updatedPrep);

      onClose();
    } catch (error) {
      console.error('Error updating prep config:', error);
      setError(error instanceof Error ? error.message : 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  // Set initial values when dialog opens
  useEffect(() => {
    if (open) {
      // Get latest prep state from storage
      const freshPrep = PrepStateManager.getPrep(prep.id);
      console.log('Dialog Opening - Current Prep State:', {
        prepId: prep.id,
        freshPrep,
        hasSelection: freshPrep?.selection != null,
        subTopics: freshPrep?.selection?.subTopics,
        subTopicsCount: freshPrep?.selection?.subTopics?.length
      });

      if (!freshPrep) return;

      // Set current prep
      setCurrentPrep(freshPrep);

      // Set form values
      const examDate = moment(freshPrep.goals.examDate);
      
      form.setFieldsValue({
        prepName: getDefaultPrepName(examDate),
        examDate,
        selectedNodes: freshPrep.selection.subTopics
      });
    }
  }, [open, prep.id]);

  return (
    <Modal
      title={
        <div style={{ 
          padding: '12px 0',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '24px'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
            הגדרות הכנה למבחן
          </Title>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={600}
      style={{ top: 20 }}
      bodyStyle={{ 
        padding: '0 24px 24px',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto'
      }}
      className="prep-config-dialog"
      footer={[
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          loading={loading}
          size="large"
          style={{
            minWidth: '120px',
            borderRadius: '8px',
            height: '40px'
          }}
        >
          שמור שינויים
        </Button>
      ]}
    >
      {error && (
        <Alert
          message="שגיאה"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        style={{ 
          gap: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}
        initialValues={{
          examDate: moment(prep.goals.examDate),
          selectedNodes: prep.selection.subTopics
        }}
      >
        <Form.Item
          name="prepName"
          label={<Text strong>המבחן הבא שלך</Text>}
          rules={[{ required: true, message: 'נא להזין שם לתרגול' }]}
        >
          <Input 
            placeholder="לדוגמה: תרגול לבגרות במתמטיקה"
            size="large"
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        <Form.Item
          name="examDate"
          label={
            <Space>
              <Text strong>תאריך המבחן</Text>
              <Tooltip title="מומלץ למלא תאריך נכון על-מנת שאיזיפס תוכל להכין אותך בצורה אופטימלית להצלחה במבחן">
                <QuestionCircleOutlined style={{ color: '#3b82f6' }} />
              </Tooltip>
            </Space>
          }
          rules={[{ required: true, message: 'נא לבחור תאריך' }]}
        >
          <DatePicker 
            style={{ width: '100%', borderRadius: '8px' }}
            size="large"
            format="DD/MM/YYYY"
            disabledDate={current => current && current < moment().startOf('day')}
            onChange={handleDateChange}
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <Form.Item
            name="hourlyGoal"
            label={<Text strong>יעד שעות תרגול</Text>}
            rules={[{ required: true, message: 'נא להזין יעד שעות' }]}
            help={
              <Text type="secondary">
                היעד המומלץ: <Text strong style={{ color: '#3b82f6' }}>{DEFAULT_TOTAL_HOURS}</Text> שעות
              </Text>
            }
            style={{ flex: 1 }}
          >
            <InputNumber 
              style={{ width: '100%', borderRadius: '8px' }}
              size="large"
              min={1}
              max={200}
              addonAfter={<Text>שעות</Text>}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <Form.Item
            name="questionGoal"
            label={<Text strong>יעד שאלות</Text>}
            rules={[{ required: true, message: 'נא להזין יעד שאלות' }]}
            help={
              <Text type="secondary">
                מומלץ: <Text strong style={{ color: '#3b82f6' }}>
                  {currentPrep ? getRecommendedQuestions(currentPrep.selection.subTopics) : 0}
                </Text> שאלות
              </Text>
            }
            style={{ flex: 1 }}
          >
            <InputNumber 
              style={{ width: '100%', borderRadius: '8px' }}
              size="large"
              min={1}
              addonAfter={<Text>שאלות</Text>}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="selectedNodes"
          label={
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Space>
                <Text strong>תכולת המבחן</Text>
                <Tooltip title="איזיפס תדאג לתרגל אותך רק בנושאי המבחן ולעקוב רק אחרי ההתקדמות שלך בהם">
                  <QuestionCircleOutlined style={{ color: '#3b82f6' }} />
                </Tooltip>
              </Space>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                סמן את כל הנושאים ותתי-הנושאים שברצונך לתרגל
              </Text>
            </Space>
          }
          rules={[{ required: true, message: 'נא לבחור לפחות נושא אחד' }]}
          style={{ marginTop: '8px' }}
        >
          <Tree
            checkable
            defaultExpandAll
            treeData={getTreeData()}
            checkedKeys={currentPrep?.selection.subTopics || []}
            onCheck={(checked, { node }) => {
              if (!currentPrep) return;
              
              const checkedKeys = Array.isArray(checked) ? checked : checked.checked;
              
              // Find if this is a topic or subtopic
              const clickedTopic = currentPrep.exam.topics.find(t => t.id === node.key);
              
              let newSubTopics: string[];
              if (clickedTopic) {
                // If clicking a topic, toggle all its subtopics
                const isTopicChecked = checkedKeys.includes(clickedTopic.id);
                
                if (isTopicChecked) {
                  // Add all subtopics that aren't already selected
                  const newSubTopicsArray = [
                    ...currentPrep.selection.subTopics,
                    ...clickedTopic.subTopics
                      .map(st => st.id)
                      .filter(id => !currentPrep.selection.subTopics.includes(id))
                  ];
                  newSubTopics = newSubTopicsArray;
                } else {
                  // Remove all subtopics of this topic
                  newSubTopics = currentPrep.selection.subTopics.filter(id => 
                    !clickedTopic.subTopics.some(st => st.id === id)
                  );
                }
              } else {
                // If clicking a subtopic, toggle just that one
                const isSubtopicChecked = checkedKeys.includes(String(node.key));
                
                if (isSubtopicChecked) {
                  newSubTopics = [...currentPrep.selection.subTopics, String(node.key)];
                } else {
                  newSubTopics = currentPrep.selection.subTopics.filter(id => id !== node.key);
                }
              }

              // Update form
              form.setFieldsValue({
                selectedNodes: newSubTopics,
                questionGoal: getRecommendedQuestions(newSubTopics)
              });

              // Update currentPrep to reflect changes immediately
              setCurrentPrep({
                ...currentPrep,
                selection: {
                  subTopics: newSubTopics
                }
              });

              console.log('Selection updated:', {
                checkedKeys,
                newSubTopics,
                subTopicsCount: newSubTopics.length,
                recommendedQuestions: getRecommendedQuestions(newSubTopics),
                isTopicClick: !!clickedTopic,
                clickedKey: node.key
              });
            }}
            style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              minHeight: '200px',
              maxHeight: 'calc(100vh - 500px)',
              overflowY: 'visible'
            }}
            className="topics-tree"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}; 
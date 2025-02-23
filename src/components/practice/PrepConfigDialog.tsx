import React, { useState, useEffect } from 'react';
import { Modal, Typography, Space, Form, Input, DatePicker, InputNumber, Tree, Button, Alert, Tooltip } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import type { StudentPrep } from '../../types/prepState';
import type { DataNode } from 'antd/es/tree';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import type { Key } from 'antd/es/table/interface';
import type { Topic, SubTopic } from '../../types/subject';

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
  const { setActivePrep } = useStudentPrep();
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>(getSelectedKeys());

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
    return `${prep.exam.names.medium} (${monthName})`;
  };

  // Calculate recommended questions based on selected subtopics
  const getRecommendedQuestions = (selectedKeys: string[]) => {
    const selectedSubTopicsCount = selectedKeys.filter(key => 
      prep.exam.topics.some(t => t.subTopics.some(st => st.id === key))
    ).length;
    return selectedSubTopicsCount * 50;
  };

  // Convert exam topics to Tree data structure
  const getTreeData = (): DataNode[] => {
    return prep.exam.topics.map(topic => ({
      title: topic.name,
      key: topic.id,
      children: topic.subTopics.map(subTopic => ({
        title: subTopic.name,
        key: subTopic.id,
        isLeaf: true
      }))
    }));
  };

  // Get initially selected keys from prep.selection
  function getSelectedKeys(): string[] {
    return [...(prep.selection.topics || []), ...(prep.selection.subTopics || [])];
  }

  // Handle tree selection changes
  const handleTreeSelect = (checked: { checked: Key[]; halfChecked: Key[]; } | Key[], info?: any) => {
    const newKeys = Array.isArray(checked) ? checked : checked.checked;
    setSelectedNodes(newKeys as string[]);
    form.setFieldsValue({
      selectedNodes: newKeys,
      questionGoal: getRecommendedQuestions(newKeys as string[])
    });
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
      
      // Update prep with new values
      const updatedPrep: StudentPrep = {
        ...prep,
        goals: {
          examDate: values.examDate.valueOf(),
          totalHours: values.hourlyGoal,
          weeklyHours: Math.ceil(values.hourlyGoal / 4),
          dailyHours: Math.ceil(values.hourlyGoal / 28),
          questionGoal: values.questionGoal
        },
        selection: {
          topics: values.selectedNodes.filter((key: string) => 
            prep.exam.topics.some(t => t.id === key)
          ),
          subTopics: values.selectedNodes.filter((key: string) => 
            prep.exam.topics.some(t => 
              t.subTopics.some(st => st.id === key)
            )
          )
        }
      };

      setActivePrep(updatedPrep);
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
      const examDate = moment(prep.goals.examDate);
      form.setFieldsValue({
        prepName: getDefaultPrepName(examDate),
        examDate,
        hourlyGoal: prep.goals.totalHours,
        questionGoal: getRecommendedQuestions(getSelectedKeys()),
        selectedNodes: getSelectedKeys()
      });
    }
  }, [open]);

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
                מומלץ: <Text strong style={{ color: '#3b82f6' }}>{getRecommendedQuestions(selectedNodes)}</Text> שאלות
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
            onCheck={handleTreeSelect}
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
            titleRender={(nodeData: DataNode) => (
              <span style={{ 
                fontSize: '15px',
                padding: '4px 0',
                display: 'block'
              }}>
                {nodeData.title as string}
              </span>
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}; 
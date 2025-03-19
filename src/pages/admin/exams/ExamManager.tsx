import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Table, Button, Space, Modal, Form, Input, Typography, Select, InputNumber, message, Tabs, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import styled from 'styled-components';
import { useAdminPage } from '../../../contexts/AdminPageContext';

const { Title } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

interface Exam {
  id: string;
  external_id: string;
  code: string;
  subject_id: string;
  domain_id: string;
  name_short: string;
  name_medium: string;
  name_full: string;
  exam_type: 'mahat_exam' | 'government_exam' | 'practice_exam' | 'custom_exam' | 'bagrut_exam';
  difficulty: number;
  max_difficulty: number;
  duration: number;
  total_questions: number;
  allowed_question_types: string[];
  programming_language?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// Define interfaces for the join results
interface TopicJoinResult {
  name: string;
}

interface SubtopicJoinResult {
  name: string;
}

interface ExamTopicWithJoin {
  id: string;
  exam_id: string;
  topic_id: string;
  weight: number;
  is_required: boolean;
  topics: TopicJoinResult;
}

interface ExamSubtopicWithJoin {
  id: string;
  exam_id: string;
  subtopic_id: string;
  weight: number;
  is_required: boolean;
  subtopics: SubtopicJoinResult;
}

interface ExamTopic {
  id: string;
  exam_id: string;
  topic_id: string;
  topic_name?: string;
  weight: number;
  is_required: boolean;
}

interface ExamSubtopic {
  id: string;
  exam_id: string;
  subtopic_id: string;
  subtopic_name?: string;
  weight: number;
  is_required: boolean;
}

interface Subject {
  id: string;
  name: string;
}

interface Domain {
  id: string;
  name: string;
  subject_id: string;
}

interface Topic {
  id: string;
  name: string;
  domain_id: string;
}

interface Subtopic {
  id: string;
  name: string;
  topic_id: string;
}

const PageContainer = styled.div`
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const TableContainer = styled.div`
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
`;

const ExamManager: React.FC = () => {
  const { setPageIdentity } = useAdminPage();

  // State variables
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [examTopics, setExamTopics] = useState<ExamTopic[]>([]);
  const [examSubtopics, setExamSubtopics] = useState<ExamSubtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalTab, setModalTab] = useState('basic');
  const [availableDomains, setAvailableDomains] = useState<Domain[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [availableSubtopics, setAvailableSubtopics] = useState<Subtopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<ExamTopic[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<ExamSubtopic[]>([]);
  const [form] = Form.useForm();

  // Set page title
  useEffect(() => {
    setPageIdentity({
      title: 'ניהול מבחנים',
    });
  }, [setPageIdentity]);

  // Fetch exams data
  const fetchExams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      message.error('אירעה שגיאה בטעינת המבחנים');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  // Fetch domains
  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('id, name, subject_id');

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  // Fetch topics
  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name, domain_id');

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  // Fetch subtopics
  const fetchSubtopics = async () => {
    try {
      const { data, error } = await supabase
        .from('subtopics')
        .select('id, name, topic_id');

      if (error) throw error;
      setSubtopics(data || []);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
    }
  };

  // Fetch exam topics
  const fetchExamTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_topics')
        .select(`
          id, 
          exam_id, 
          topic_id, 
          weight, 
          is_required,
          topics:topic_id(name)
        `);

      if (error) throw error;
      
      // Cast the data to the correct type
      const joinedData = data as unknown as ExamTopicWithJoin[];
      
      const formattedData = joinedData.map(item => ({
        ...item,
        topic_name: item.topics?.name
      })) || [];
      
      setExamTopics(formattedData);
    } catch (error) {
      console.error('Error fetching exam topics:', error);
    }
  };

  // Fetch exam subtopics
  const fetchExamSubtopics = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_subtopics')
        .select(`
          id, 
          exam_id, 
          subtopic_id, 
          weight, 
          is_required,
          subtopics:subtopic_id(name)
        `);

      if (error) throw error;
      
      // Cast the data to the correct type
      const joinedData = data as unknown as ExamSubtopicWithJoin[];
      
      const formattedData = joinedData.map(item => ({
        ...item,
        subtopic_name: item.subtopics?.name
      })) || [];
      
      setExamSubtopics(formattedData);
    } catch (error) {
      console.error('Error fetching exam subtopics:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchExams();
    fetchSubjects();
    fetchDomains();
    fetchTopics();
    fetchSubtopics();
    fetchExamTopics();
    fetchExamSubtopics();
  }, []);

  // Filter domains by subject
  useEffect(() => {
    if (form.getFieldValue('subject_id')) {
      const subjectId = form.getFieldValue('subject_id');
      const filteredDomains = domains.filter(domain => domain.subject_id === subjectId);
      setAvailableDomains(filteredDomains);
    } else {
      setAvailableDomains([]);
    }
  }, [form.getFieldValue('subject_id'), domains]);

  // Filter topics by domain
  useEffect(() => {
    if (form.getFieldValue('domain_id')) {
      const domainId = form.getFieldValue('domain_id');
      const filteredTopics = topics.filter(topic => topic.domain_id === domainId);
      setAvailableTopics(filteredTopics);
    } else {
      setAvailableTopics([]);
    }
  }, [form.getFieldValue('domain_id'), topics]);

  // Show create/edit modal
  const showModal = (exam: Exam | null = null) => {
    setSelectedExam(exam);
    setIsModalVisible(true);
    setModalTab('basic');

    if (exam) {
      // Edit mode - populate form
      form.setFieldsValue({
        ...exam,
        allowed_question_types: typeof exam.allowed_question_types === 'string' 
          ? JSON.parse(exam.allowed_question_types) 
          : exam.allowed_question_types
      });

      // Filter domains by subject
      const filteredDomains = domains.filter(domain => domain.subject_id === exam.subject_id);
      setAvailableDomains(filteredDomains);

      // Filter topics by domain
      const filteredTopics = topics.filter(topic => topic.domain_id === exam.domain_id);
      setAvailableTopics(filteredTopics);

      // Get exam topics
      const examTopicsList = examTopics.filter(et => et.exam_id === exam.id);
      setSelectedTopics(examTopicsList);

      // Get exam subtopics
      const examSubtopicsList = examSubtopics.filter(es => es.exam_id === exam.id);
      setSelectedSubtopics(examSubtopicsList);
    } else {
      // Create mode - reset form
      form.resetFields();
      setSelectedTopics([]);
      setSelectedSubtopics([]);
    }
  };

  // Handle subject change
  const handleSubjectChange = (subjectId: string) => {
    form.setFieldsValue({ domain_id: undefined });
    const filteredDomains = domains.filter(domain => domain.subject_id === subjectId);
    setAvailableDomains(filteredDomains);
  };

  // Handle domain change
  const handleDomainChange = (domainId: string) => {
    const filteredTopics = topics.filter(topic => topic.domain_id === domainId);
    setAvailableTopics(filteredTopics);
  };

  // Save exam
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Format values if needed
      const examData = {
        ...values,
        allowed_question_types: Array.isArray(values.allowed_question_types) 
          ? values.allowed_question_types 
          : JSON.parse(values.allowed_question_types),
      };

      if (selectedExam) {
        // Update existing exam
        const { error } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', selectedExam.id);

        if (error) throw error;
        message.success('המבחן עודכן בהצלחה');
      } else {
        // Create new exam
        const { data, error } = await supabase
          .from('exams')
          .insert({
            ...examData,
            external_id: examData.code + '_' + Date.now(), // Generate a unique external ID
          })
          .select();

        if (error) throw error;
        message.success('המבחן נוצר בהצלחה');
      }

      // Refresh data
      fetchExams();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error saving exam:', error);
      message.error('אירעה שגיאה בשמירת המבחן');
    }
  };

  // Delete exam
  const handleDelete = async (id: string) => {
    try {
      Modal.confirm({
        title: 'האם אתה בטוח שברצונך למחוק את המבחן?',
        content: 'פעולה זו אינה ניתנת לביטול.',
        okText: 'כן, מחק',
        okType: 'danger',
        cancelText: 'ביטול',
        onOk: async () => {
          const { error } = await supabase
            .from('exams')
            .delete()
            .eq('id', id);

          if (error) throw error;
          message.success('המבחן נמחק בהצלחה');
          fetchExams();
        },
      });
    } catch (error) {
      console.error('Error deleting exam:', error);
      message.error('אירעה שגיאה במחיקת המבחן');
    }
  };

  // Column definitions
  const columns: ColumnsType<Exam> = [
    {
      title: 'קוד מבחן',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'שם מבחן',
      dataIndex: 'name_medium',
      key: 'name_medium',
      render: (text, record) => (
        <Tooltip title={record.name_full}>
          <span>{text} <InfoCircleOutlined style={{ color: '#1890ff' }} /></span>
        </Tooltip>
      ),
    },
    {
      title: 'סוג מבחן',
      dataIndex: 'exam_type',
      key: 'exam_type',
      render: (text) => {
        let color = 'blue';
        let label = text;
        
        switch(text) {
          case 'mahat_exam':
            label = 'מה"ט';
            color = 'green';
            break;
          case 'bagrut_exam':
            label = 'בגרות';
            color = 'purple';
            break;
          case 'government_exam':
            label = 'ממשלתי';
            color = 'blue';
            break;
          case 'practice_exam':
            label = 'תרגול';
            color = 'orange';
            break;
          case 'custom_exam':
            label = 'מותאם אישית';
            color = 'cyan';
            break;
        }
        
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'רמת קושי',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (text, record) => `${text}/${record.max_difficulty}`,
    },
    {
      title: 'משך (דקות)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'מס׳ שאלות',
      dataIndex: 'total_questions',
      key: 'total_questions',
    },
    {
      title: 'נושאים',
      key: 'topics_count',
      render: (_, record) => {
        const examTopicsList = examTopics.filter(et => et.exam_id === record.id);
        return examTopicsList.length;
      },
    },
    {
      title: 'תת-נושאים',
      key: 'subtopics_count',
      render: (_, record) => {
        const examSubtopicsList = examSubtopics.filter(es => es.exam_id === record.id);
        return examSubtopicsList.length;
      },
    },
    {
      title: 'שפת תכנות',
      dataIndex: 'programming_language',
      key: 'programming_language',
      render: (text) => text || '-',
    },
    {
      title: 'פעולות',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
          />
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <HeaderContainer>
        <Title level={2}>ניהול מבחנים</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal()}
        >
          מבחן חדש
        </Button>
      </HeaderContainer>
      
      <TableContainer>
        <Table 
          columns={columns} 
          dataSource={exams} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </TableContainer>
      
      {/* Create/Edit Modal */}
      <Modal
        title={selectedExam ? 'עריכת מבחן' : 'יצירת מבחן חדש'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            ביטול
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            שמור
          </Button>,
        ]}
      >
        <Tabs 
          activeKey={modalTab} 
          onChange={setModalTab}
          style={{ direction: 'rtl' }}
        >
          <TabPane tab="פרטי מבחן בסיסיים" key="basic">
            <Form 
              form={form} 
              layout="vertical"
              style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px' }}
            >
              <Form.Item 
                name="code" 
                label="קוד מבחן"
                rules={[{ required: true, message: 'נא להזין קוד מבחן' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item 
                name="name_short" 
                label="שם קצר"
                rules={[{ required: true, message: 'נא להזין שם קצר למבחן' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item 
                name="name_medium" 
                label="שם בינוני"
                rules={[{ required: true, message: 'נא להזין שם בינוני למבחן' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item 
                name="name_full" 
                label="שם מלא"
                rules={[{ required: true, message: 'נא להזין שם מלא למבחן' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item 
                name="exam_type" 
                label="סוג מבחן"
                rules={[{ required: true, message: 'נא לבחור סוג מבחן' }]}
              >
                <Select>
                  <Option value="mahat_exam">מה"ט</Option>
                  <Option value="bagrut_exam">בגרות</Option>
                  <Option value="government_exam">ממשלתי</Option>
                  <Option value="practice_exam">תרגול</Option>
                  <Option value="custom_exam">מותאם אישית</Option>
                </Select>
              </Form.Item>

              <Form.Item 
                name="subject_id" 
                label="נושא"
                rules={[{ required: true, message: 'נא לבחור נושא' }]}
              >
                <Select onChange={handleSubjectChange}>
                  {subjects.map(subject => (
                    <Option key={subject.id} value={subject.id}>{subject.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                name="domain_id" 
                label="תחום"
                rules={[{ required: true, message: 'נא לבחור תחום' }]}
              >
                <Select 
                  onChange={handleDomainChange}
                  disabled={availableDomains.length === 0}
                >
                  {availableDomains.map(domain => (
                    <Option key={domain.id} value={domain.id}>{domain.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                name="difficulty" 
                label="רמת קושי"
                rules={[{ required: true, message: 'נא להזין רמת קושי' }]}
              >
                <InputNumber min={1} max={5} />
              </Form.Item>

              <Form.Item 
                name="max_difficulty" 
                label="רמת קושי מקסימלית"
                rules={[{ required: true, message: 'נא להזין רמת קושי מקסימלית' }]}
              >
                <InputNumber min={1} max={5} />
              </Form.Item>

              <Form.Item 
                name="duration" 
                label="משך (דקות)"
                rules={[{ required: true, message: 'נא להזין משך מבחן בדקות' }]}
              >
                <InputNumber min={1} />
              </Form.Item>

              <Form.Item 
                name="total_questions" 
                label="מספר שאלות"
                rules={[{ required: true, message: 'נא להזין מספר שאלות' }]}
              >
                <InputNumber min={1} />
              </Form.Item>

              <Form.Item 
                name="allowed_question_types" 
                label="סוגי שאלות מותרים"
                rules={[{ required: true, message: 'נא לבחור לפחות סוג שאלה אחד' }]}
              >
                <Select mode="multiple">
                  <Option value="multiple_choice">רב-ברירה</Option>
                  <Option value="open">פתוחה</Option>
                  <Option value="numerical">מספרית</Option>
                </Select>
              </Form.Item>

              <Form.Item 
                name="programming_language" 
                label="שפת תכנות"
              >
                <Select allowClear>
                  <Option value="java">Java</Option>
                  <Option value="python">Python</Option>
                  <Option value="c#">C#</Option>
                  <Option value="c++">C++</Option>
                  <Option value="javascript">JavaScript</Option>
                </Select>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane tab="נושאים ותת-נושאים" key="topics" disabled={!selectedExam}>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px' }}>
              <Title level={4}>נושאים למבחן</Title>
              {selectedTopics.length > 0 ? (
                <Table 
                  dataSource={selectedTopics}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'נושא',
                      dataIndex: 'topic_name',
                      key: 'topic_name',
                    },
                    {
                      title: 'משקל',
                      dataIndex: 'weight',
                      key: 'weight',
                    },
                    {
                      title: 'חובה',
                      dataIndex: 'is_required',
                      key: 'is_required',
                      render: (isRequired) => isRequired ? 'כן' : 'לא',
                    },
                  ]}
                />
              ) : (
                <p>אין נושאים למבחן זה</p>
              )}

              <Title level={4} style={{ marginTop: '20px' }}>תת-נושאים למבחן</Title>
              {selectedSubtopics.length > 0 ? (
                <Table 
                  dataSource={selectedSubtopics}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'תת-נושא',
                      dataIndex: 'subtopic_name',
                      key: 'subtopic_name',
                    },
                    {
                      title: 'משקל',
                      dataIndex: 'weight',
                      key: 'weight',
                    },
                    {
                      title: 'חובה',
                      dataIndex: 'is_required',
                      key: 'is_required',
                      render: (isRequired) => isRequired ? 'כן' : 'לא',
                    },
                  ]}
                />
              ) : (
                <p>אין תת-נושאים למבחן זה</p>
              )}
            </div>
          </TabPane>
        </Tabs>
      </Modal>
    </PageContainer>
  );
};

export default ExamManager; 
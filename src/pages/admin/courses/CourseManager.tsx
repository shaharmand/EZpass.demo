import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Table, Button, Space, Modal, Form, Input, Typography, Tree, message, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, FolderOutlined, FileOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import type { FormInstance } from 'antd/es/form';
import styled from 'styled-components';

const { Title } = Typography;
const { TextArea } = Input;

interface Course {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Topic {
  id: string;
  name: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  lesson_number: number;
  topic_id: string;
  created_at: string;
  updated_at: string;
  course: Course;
  topic?: Topic;
}

interface FormValues {
  type: 'course' | 'lesson';
  title: string;
  description: string;
  course_id?: string;
}

const PageContainer = styled.div`
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100vh - 64px);
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const ContentContainer = styled.div`
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  width: 100%;
`;

const TreeSection = styled.div`
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .ant-tree {
    flex: 1;
    overflow: auto;
    min-height: 0;
  }
`;

const TableContainer = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  overflow: hidden;
  width: 0;
  
  .ant-table-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  
  .ant-spin-nested-loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .ant-spin-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .ant-table {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .ant-table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-bottom: none;
    overflow: hidden;
  }

  .ant-table-header {
    flex-shrink: 0;
    overflow: hidden;
  }

  .ant-table-body {
    flex: 1;
    overflow: auto !important;
    min-height: 0;
    margin-bottom: 16px;
  }

  .ant-table-pagination {
    flex-shrink: 0;
    margin: 0 !important;
    padding: 16px 8px 0;
    background: #fff;
    border-top: 1px solid #f0f0f0;
  }
`;

export default function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Course | Lesson | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchLessons();
  }, []);

  useEffect(() => {
    updateTreeData();
  }, [courses, lessons]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      console.log('Fetched courses:', data);
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      message.error('Error fetching courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          course_id,
          title,
          description,
          lesson_number,
          topic_id,
          created_at,
          updated_at,
          course:courses (
            id,
            title,
            description,
            created_at,
            updated_at
          ),
          topic:topics!lessons_topic_id_fkey (
            id,
            name
          )
        `)
        .order('lesson_number', { ascending: true });

      if (error) throw error;
      console.log('Raw fetched lessons:', data);
      
      // Transform the data to match our Lesson type
      const transformedLessons = (data || []).map(lesson => {
        console.log('Processing lesson:', lesson.id, 'Topic data:', lesson.topic);
        const transformedLesson = {
          ...lesson,
          course: lesson.course?.[0], // Since course is returned as an array from the join
          topic: lesson.topic?.[0] || null // Since topic is returned as an array from the join
        };
        console.log('Transformed lesson:', transformedLesson.id, 'Topic:', transformedLesson.topic);
        return transformedLesson;
      }) as Lesson[];
      
      console.log('Final transformed lessons:', transformedLessons);
      setLessons(transformedLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      message.error('Error fetching lessons');
    }
  };

  const updateTreeData = () => {
    console.log('Updating tree data with:', { courses, lessons });
    const tree: DataNode[] = courses.map(course => ({
      key: `course-${course.id}`,
      title: course.title || 'Unnamed Course',
      icon: <FolderOutlined />,
      children: lessons
        .filter(lesson => lesson.course_id === course.id)
        .map(lesson => ({
          key: `lesson-${lesson.id}`,
          title: lesson.title || lesson.description || 'Unnamed Lesson',
          icon: <FileOutlined />,
        })),
    }));
    console.log('Generated tree data:', tree);
    setTreeData(tree);
  };

  const showModal = (item?: Course | Lesson) => {
    setSelectedItem(item || null);
    if (item) {
      const formValues: FormValues = {
        title: item.title,
        description: item.description,
        type: 'course_id' in item ? 'lesson' : 'course',
        course_id: 'course_id' in item ? item.course_id : undefined,
      };
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    form.resetFields();
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      if (selectedItem) {
        // Update existing item
        const table = 'title' in selectedItem ? 'courses' : 'lessons';
        const { error } = await supabase
          .from(table)
          .update({
            title: values.title,
            description: values.description,
            ...(table === 'lessons' ? { course_id: values.course_id } : {})
          })
          .eq('id', selectedItem.id);

        if (error) throw error;
        message.success(`${table === 'courses' ? 'Course' : 'Lesson'} updated successfully`);
      } else {
        // Create new item
        const table = form.getFieldValue('type') === 'course' ? 'courses' : 'lessons';
        const { error } = await supabase
          .from(table)
          .insert([{
            title: values.title,
            description: values.description,
            ...(table === 'lessons' ? { course_id: values.course_id } : {})
          }]);

        if (error) throw error;
        message.success(`${table === 'courses' ? 'Course' : 'Lesson'} created successfully`);
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchCourses();
      fetchLessons();
    } catch (error) {
      console.error('Error saving item:', error);
      message.error('Error saving item');
    }
  };

  const handleDelete = async (id: string, type: 'course' | 'lesson') => {
    Modal.confirm({
      title: `Are you sure you want to delete this ${type}?`,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from(type === 'course' ? 'courses' : 'lessons')
            .delete()
            .eq('id', id);

          if (error) throw error;
          message.success(`${type === 'course' ? 'Course' : 'Lesson'} deleted successfully`);
          fetchCourses();
          fetchLessons();
        } catch (error) {
          console.error(`Error deleting ${type}:`, error);
          message.error(`Error deleting ${type}`);
        }
      },
    });
  };

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const key = selectedKeys[0].toString();
      if (key.startsWith('course-')) {
        setSelectedCourse(key.replace('course-', ''));
      } else {
        setSelectedCourse(null);
      }
    } else {
      setSelectedCourse(null);
    }
  };

  const columns: ColumnsType<Lesson> = [
    {
      title: 'Number',
      dataIndex: 'lesson_number',
      key: 'lesson_number',
      width: 80,
      fixed: 'left',
      sorter: (a, b) => a.lesson_number - b.lesson_number,
    },
    {
      title: 'Name',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      fixed: 'left',
      render: (text: string, record: Lesson) => text || record.description || 'Unnamed Lesson',
    },
    {
      title: 'Course',
      dataIndex: ['course', 'title'],
      key: 'course',
      width: 200,
      render: (text: string, record: Lesson) => {
        if (record.course?.title) return record.course.title;
        const course = courses.find(c => c.id === record.course_id);
        return course?.title || 'Unnamed Course';
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      render: (text: string) => text || 'No description',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, 'lesson')}
          />
        </Space>
      ),
    },
  ];

  const filteredLessons = selectedCourse
    ? lessons.filter(lesson => lesson.course_id === selectedCourse)
    : lessons;

  return (
    <PageContainer>
      <HeaderContainer>
        <Title level={4}>Course Manager</Title>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Add New
          </Button>
        </Space>
      </HeaderContainer>

      <ContentContainer>
        <TreeSection>
          <Title level={5}>Course Structure</Title>
          <Tree
            treeData={treeData}
            defaultExpandAll
            onSelect={handleTreeSelect}
          />
        </TreeSection>

        <TableContainer>
          <Table
            columns={columns}
            dataSource={filteredLessons}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{ 
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} lessons`
            }}
          />
        </TableContainer>
      </ContentContainer>

      <Modal
        title={selectedItem ? 'Edit Item' : 'Add New Item'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select type' }]}
          >
            <Select>
              <Select.Option value="course">Course</Select.Option>
              <Select.Option value="lesson">Lesson</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }: { getFieldValue: (field: keyof FormValues) => any }) => {
              const type = getFieldValue('type');
              return type === 'lesson' ? (
                <Form.Item
                  name="course_id"
                  label="Course"
                  rules={[{ required: true, message: 'Please select course' }]}
                >
                  <Select>
                    {courses.map(course => (
                      <Select.Option key={course.id} value={course.id}>
                        {course.title}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedItem ? 'Update' : 'Create'}
              </Button>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
} 
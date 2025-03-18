import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Table, Button, Space, Modal, Form, Input, Typography, Tree, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, FolderOutlined, FileOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import styled from 'styled-components';

const { Title } = Typography;
const { TextArea } = Input;

interface Domain {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Topic {
  id: string;
  domain_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Subtopic {
  id: string;
  topic_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const PageContainer = styled.div`
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100vh - 120px);
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
  max-height: calc(100vh - 280px);
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
    max-height: calc(100vh - 380px);
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
  width: 0; /* This enables flex to properly distribute space */
  
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
    overflow: hidden !important;
  }

  .ant-table-body {
    flex: 1;
    overflow: auto !important;
    min-height: 0;
    max-height: calc(100vh - 380px) !important;
  }

  .ant-table-pagination {
    flex-shrink: 0;
    margin: 16px 0 0 !important;
    padding: 0 8px;
    background: #fff;
    border-radius: 0 0 8px 8px;
  }
  
  /* Ensure table takes full width of container */
  .ant-table table {
    width: 100% !important;
    table-layout: fixed;
  }
`;

export default function DomainManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Domain | Topic | Subtopic | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<DataNode[]>([]);

  useEffect(() => {
    fetchDomains();
    fetchTopics();
    fetchSubtopics();
  }, []);

  useEffect(() => {
    updateTreeData();
  }, [domains, topics, subtopics]);

  const fetchDomains = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      message.error('Error fetching domains');
      console.error('Error fetching domains:', error);
      return;
    }

    setDomains(data || []);
    setLoading(false);
  };

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      message.error('Error fetching topics');
      console.error('Error fetching topics:', error);
      return;
    }

    setTopics(data || []);
  };

  const fetchSubtopics = async () => {
    const { data, error } = await supabase
      .from('subtopics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      message.error('Error fetching subtopics');
      console.error('Error fetching subtopics:', error);
      return;
    }

    setSubtopics(data || []);
  };

  const updateTreeData = () => {
    const tree: DataNode[] = domains.map(domain => ({
      key: `domain-${domain.id}`,
      title: domain.name,
      icon: <FolderOutlined />,
      children: topics
        .filter(topic => topic.domain_id === domain.id)
        .map(topic => ({
          key: `topic-${topic.id}`,
          title: topic.name,
          icon: <FolderOutlined />,
          children: subtopics
            .filter(subtopic => subtopic.topic_id === topic.id)
            .map(subtopic => ({
              key: `subtopic-${subtopic.id}`,
              title: subtopic.name,
              icon: <FileOutlined />,
            })),
        })),
    }));
    setTreeData(tree);
  };

  const showModal = (item?: Domain | Topic | Subtopic) => {
    setSelectedItem(item || null);
    if (item) {
      form.setFieldsValue({
        name: item.name,
        description: item.description,
      });
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

  const handleSubmit = async (values: any) => {
    try {
      if (selectedItem) {
        // Update existing item
        const table = getTableName(selectedItem);
        const { error } = await supabase
          .from(table)
          .update(values)
          .eq('id', selectedItem.id);

        if (error) throw error;
        message.success(`${table} updated successfully`);
      } else {
        // Create new item
        const table = form.getFieldValue('type');
        const { error } = await supabase
          .from(table)
          .insert([values]);

        if (error) throw error;
        message.success(`${table} created successfully`);
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchDomains();
      fetchTopics();
      fetchSubtopics();
    } catch (error) {
      console.error('Error saving item:', error);
      message.error('Error saving item');
    }
  };

  const handleDelete = async (id: string, type: 'domains' | 'topics' | 'subtopics') => {
    Modal.confirm({
      title: `Are you sure you want to delete this ${type.slice(0, -1)}?`,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from(type)
            .delete()
            .eq('id', id);

          if (error) throw error;
          message.success(`${type.slice(0, -1)} deleted successfully`);
          if (type === 'domains') {
            fetchDomains();
          } else if (type === 'topics') {
            fetchTopics();
          } else {
            fetchSubtopics();
          }
        } catch (error) {
          console.error(`Error deleting ${type.slice(0, -1)}:`, error);
          message.error(`Error deleting ${type.slice(0, -1)}`);
        }
      },
    });
  };

  const getTableName = (item: Domain | Topic | Subtopic): 'domains' | 'topics' | 'subtopics' => {
    if ('domain_id' in item) {
      return 'topics';
    } else if ('topic_id' in item) {
      return 'subtopics';
    }
    return 'domains';
  };

  const columns: ColumnsType<Domain | Topic | Subtopic> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: true,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, getTableName(record))}
          />
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <HeaderContainer>
        <Title level={4}>Domain Manager</Title>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.setFieldValue('type', 'domains');
              showModal();
            }}
          >
            Add New Domain
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.setFieldValue('type', 'topics');
              showModal();
            }}
          >
            Add New Topic
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.setFieldValue('type', 'subtopics');
              showModal();
            }}
          >
            Add New Subtopic
          </Button>
        </Space>
      </HeaderContainer>

      <ContentContainer>
        <TreeSection>
          <Title level={5} className="tree-title">Domain Structure</Title>
          <div className="tree-content">
            <Tree
              treeData={treeData}
              defaultExpandAll
            />
          </div>
        </TreeSection>
        
        <TableContainer>
          <Table
            columns={columns}
            dataSource={topics}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 8,
              position: ['bottomCenter'],
              style: { margin: '16px 0' }
            }}
            scroll={{ x: 720, y: 'calc(100vh - 380px)' }}
            tableLayout="fixed"
            style={{ height: '100%' }}
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
          initialValues={{
            name: '',
            description: '',
            type: 'domains',
          }}
        >
          <Form.Item
            name="type"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input the name!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input the description!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {selectedItem ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
} 
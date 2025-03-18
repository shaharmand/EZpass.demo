import React, { useState } from 'react';
import { Table, Input, Select, Button, Space, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;

interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  difficulty: 'easy' | 'medium' | 'hard';
}

const PageContainer = styled.div`
  padding: 16px;
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
  margin-bottom: 8px;
  flex-shrink: 0;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
  align-items: center;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  flex-shrink: 0;
  max-height: 60px;
  overflow-y: auto;

  .ant-input-affix-wrapper {
    width: 160px;
  }

  .ant-select {
    width: 160px;
  }

  .ant-input-search {
    width: 160px;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  width: 100%;
`;

const QuestionsContainer = styled.div`
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
    position: sticky;
    bottom: 0;
    z-index: 1;
  }
`;

const QuestionLibrary: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const columns: ColumnsType<Question> = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      width: '40%',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: Question) => (
        <Space>
          <Button type="link">Edit</Button>
          <Button type="link" danger>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <HeaderContainer>
        <h2>Question Library</h2>
        <Button type="primary">Add Question</Button>
      </HeaderContainer>

      <SearchContainer>
        <Search
          placeholder="Search questions"
          allowClear
          style={{ width: 160 }}
        />
        <Select
          placeholder="Question Type"
          allowClear
          style={{ width: 160 }}
        >
          <Select.Option value="multiple_choice">Multiple Choice</Select.Option>
          <Select.Option value="true_false">True/False</Select.Option>
          <Select.Option value="short_answer">Short Answer</Select.Option>
        </Select>
        <Select
          placeholder="Difficulty"
          allowClear
          style={{ width: 160 }}
        >
          <Select.Option value="easy">Easy</Select.Option>
          <Select.Option value="medium">Medium</Select.Option>
          <Select.Option value="hard">Hard</Select.Option>
        </Select>
      </SearchContainer>

      <ContentContainer>
        <QuestionsContainer>
          <Table
            columns={columns}
            dataSource={questions}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1000, y: 'calc(100vh - 280px)' }}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} questions`,
              position: ['bottomCenter']
            }}
          />
        </QuestionsContainer>
      </ContentContainer>
    </PageContainer>
  );
};

export default QuestionLibrary; 
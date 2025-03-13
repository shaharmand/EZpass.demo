import React, { useState } from 'react';
import styled from 'styled-components';
import { Space, Typography, Collapse, Affix, Button, Tooltip, Badge } from 'antd';
import { DatabaseOutlined, BookOutlined, CheckOutlined, StarOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { DatabaseQuestion } from '../../../../types/question';
import { MetadataSection } from '../../../../pages/admin/components/questions/editor/content/MetadataSection';

const { Text } = Typography;
const { Panel } = Collapse;

const PanelContainer = styled.div<{ $isCollapsed?: boolean }>`
  width: ${props => props.$isCollapsed ? '48px' : '300px'};
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 88px;
  transition: all 0.3s ease;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
`;

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #374151;

  .anticon {
    font-size: 16px;
    color: #6b7280;
  }
`;

const CollapseButton = styled(Button)`
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  
  &:hover {
    color: #1677ff;
    border-color: #1677ff;
  }

  .anticon {
    font-size: 14px;
  }
`;

const NavigationTabs = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 2px;
  }
`;

const NavigationTab = styled.button<{ $active?: boolean }>`
  all: unset;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  background: ${props => props.$active ? '#e6f4ff' : 'transparent'};
  color: ${props => props.$active ? '#1677ff' : '#6b7280'};

  &:hover {
    background: ${props => props.$active ? '#e6f4ff' : '#f3f4f6'};
    color: ${props => props.$active ? '#1677ff' : '#374151'};
  }

  .anticon {
    font-size: 14px;
  }

  .badge {
    margin-left: 4px;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    background: ${props => props.$active ? '#1677ff' : '#f3f4f6'};
    color: ${props => props.$active ? '#fff' : '#6b7280'};
  }
`;

const PanelContent = styled.div`
  padding: 16px;
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  .anticon {
    font-size: 16px;
    color: #6b7280;
  }
`;

interface PropertiesPanelProps {
  question: DatabaseQuestion;
  onContentChange: (changes: Partial<DatabaseQuestion>) => void;
  onFieldBlur?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  question,
  onContentChange,
  onFieldBlur
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('metadata');

  const sections = [
    { 
      id: 'metadata', 
      title: 'מטא-דאטה', 
      icon: <DatabaseOutlined />,
      badge: '6'
    },
    { 
      id: 'classification', 
      title: 'סיווג', 
      icon: <BookOutlined />,
      badge: '2'
    },
    { 
      id: 'evaluation', 
      title: 'הערכה', 
      icon: <StarOutlined />,
      badge: '3'
    },
    { 
      id: 'validation', 
      title: 'תיקוף', 
      icon: <CheckOutlined />,
      badge: '4'
    }
  ];

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isCollapsed) {
    return (
      <PanelContainer $isCollapsed>
        <PanelHeader>
          <CollapseButton 
            icon={<MenuFoldOutlined />} 
            onClick={() => setIsCollapsed(false)}
          />
        </PanelHeader>
        <Space direction="vertical" style={{ padding: '8px' }}>
          {sections.map(section => (
            <Tooltip key={section.id} title={section.title} placement="right">
              <CollapseButton
                icon={section.icon}
                onClick={() => {
                  setIsCollapsed(false);
                  handleSectionChange(section.id);
                }}
              />
            </Tooltip>
          ))}
        </Space>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer>
      <PanelHeader>
        <PanelTitle>
          <DatabaseOutlined />
          פרטי השאלה
        </PanelTitle>
        <CollapseButton 
          icon={<MenuFoldOutlined />} 
          onClick={() => setIsCollapsed(true)}
        />
      </PanelHeader>

      <NavigationTabs>
        {sections.map(section => (
          <NavigationTab
            key={section.id}
            $active={activeSection === section.id}
            onClick={() => handleSectionChange(section.id)}
          >
            {section.icon}
            {section.title}
            <span className="badge">{section.badge}</span>
          </NavigationTab>
        ))}
      </NavigationTabs>

      <PanelContent>
        <Space direction="vertical" size={32} style={{ width: '100%' }}>
          <div id="metadata">
            <SectionTitle>
              <DatabaseOutlined />
              מטא-דאטה
            </SectionTitle>
            <MetadataSection
              question={question}
              onContentChange={onContentChange}
              onFieldBlur={onFieldBlur}
            />
          </div>

          <div id="classification">
            <SectionTitle>
              <BookOutlined />
              סיווג
            </SectionTitle>
            {/* Classification content */}
          </div>

          <div id="evaluation">
            <SectionTitle>
              <StarOutlined />
              הערכה
            </SectionTitle>
            {/* Evaluation content */}
          </div>

          <div id="validation">
            <SectionTitle>
              <CheckOutlined />
              תיקוף
            </SectionTitle>
            {/* Validation content */}
          </div>
        </Space>
      </PanelContent>
    </PanelContainer>
  );
}; 
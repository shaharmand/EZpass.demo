import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Rate, Popover } from 'antd';
import { QuestionType, SourceType, ExamPeriod, MoedType, Question } from '../../types/question';
import { FileTextOutlined, FilterOutlined, AimOutlined } from '@ant-design/icons';
import { translateQuestionType } from '../../utils/translations';
import { universalTopics } from '../../services/universalTopics';
import { enumMappings } from '../../utils/translations';
import { examService } from '../../services/examService';
import { TypeFilterContent } from './TypeFilter';
import { SubtopicPopoverContent } from './SubtopicPopover';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import { SkipReason } from '../../types/prepUI';
import { TopicSelectionDialog } from './TopicSelectionDialog';

const { Text, Title } = Typography;

const PropertiesContainer = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const MainTitle = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  
  h1.ant-typography {
    font-size: 15px;
    margin: 0;
    color: #374151;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;

    .anticon {
      color: #6b7280;
      font-size: 15px;
    }
  }
`;

const ContentSection = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PropertySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const SectionTitle = styled(Text)`
  font-size: 13px;
  color: #6b7280;
  font-weight: 400;
`;

const PropertyContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TopicName = styled(Text)`
  color: #4b5563;
  font-size: 14px;
`;

const SubtopicName = styled(Text)`
  font-size: 15px;
  color: #111827;
  font-weight: 600;
`;

const QuestionTypeValue = styled.span`
  font-weight: 500;
  color: #262626;
`;

const DifficultyDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .ant-rate {
    font-size: 13px;
    color: #faad14;
  }
`;

const DifficultyText = styled(Text)`
  font-size: 14px;
  color: #111827;
  font-weight: 600;
`;

const SourceDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SourceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const SourceMain = styled(Text)`
  font-size: 14px;
  color: #111827;
  font-weight: 500;
`;

const SourceDetails = styled(Text)`
  font-size: 14px;
  color: #6b7280;
`;

const PropertyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SourceText = styled(Text)`
  font-size: 14px;
  color: #111827;
  font-weight: 600;
`;

const InteractiveText = styled(Text)<{ $isClickable?: boolean; $isFocused?: boolean }>`
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${props => props.$isFocused && `
    color: #1890ff;
  `}

  .focus-icon {
    font-size: 14px;
    color: #1890ff;
    opacity: ${props => props.$isFocused ? 1 : 0};
    transition: opacity 0.2s;
  }

  &:hover .focus-icon {
    opacity: 1;
  }
`;

const PopoverContent = styled.div`
  padding: 8px;
  min-width: 200px;
`;

const TypeContainer = styled.div<{ $isFocused: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  background: ${props => props.$isFocused ? 'rgba(24, 144, 255, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.$isFocused ? '#1890ff' : '#e6e6e6'};
  
  &:hover {
    background: rgba(24, 144, 255, 0.05);
    border-color: #1890ff;
  }

  .focus-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #1890ff;
  }
`;

const FocusText = styled.span`
  font-size: 12px;
  color: #1890ff;
  margin-right: 4px;
`;

const SubtopicContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TopicContainer = styled.div<{ $isFocused: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  background: ${props => props.$isFocused ? 'rgba(24, 144, 255, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.$isFocused ? '#1890ff' : '#e6e6e6'};
  
  &:hover {
    background: rgba(24, 144, 255, 0.05);
    border-color: #1890ff;
  }
`;

const getDifficultyLabel = (difficulty: number): string => {
  switch (difficulty) {
    case 1:
      return 'קל מאוד';
    case 2:
      return 'קל';
    case 3:
      return 'בינוני';
    case 4:
      return 'קשה';
    case 5:
      return 'קשה מאוד';
    default:
      return 'לא מוגדר';
  }
};

const getExamSourceDisplay = async (source: {
  examTemplateId: string;
  year: number;
  period?: ExamPeriod;
  moed?: MoedType;
  order?: number;
}): Promise<string> => {
  let templateName;
  try {
    const template = await examService.getExamById(source.examTemplateId);
    templateName = template?.names.medium || source.examTemplateId;
  } catch (error) {
    console.warn(`Failed to get exam template name for ${source.examTemplateId}:`, error);
    templateName = source.examTemplateId;
  }

  const period = source.period ? enumMappings.period[source.period] || source.period : '';
  const moed = source.moed ? enumMappings.moed[source.moed] || source.moed : '';
  
  const parts = [templateName, source.year.toString()];
  if (period) parts.push(period);
  if (moed) parts.push(moed);
  
  return parts.join(' • ');
};

interface QuestionPropertiesProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onSkip: (reason: SkipReason) => Promise<void>;
}

export const QuestionProperties: React.FC<QuestionPropertiesProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onSkip
}) => {
  const [sourceDisplay, setSourceDisplay] = useState<string | null>(null);
  const [isTypePopoverOpen, setIsTypePopoverOpen] = useState(false);
  const [isTopicPopoverOpen, setIsTopicPopoverOpen] = useState(false);
  const topicData = question.metadata.topicId ? universalTopics.getTopic(question.metadata.topicId) : null;
  const subtopicData = question.metadata.subtopicId && topicData ? 
    topicData.subTopics.find(st => st.id === question.metadata.subtopicId) : null;
  const { prep, setFocusedType, setFocusedSubTopic } = useStudentPrep();

  const isTypeFocused = prep?.focusedType === question.metadata.type;
  const isSubtopicFocused = question.metadata.subtopicId ? prep?.focusedSubTopic === question.metadata.subtopicId : false;

  useEffect(() => {
    const loadSourceDisplay = async () => {
      const source = question.metadata.source;
      if (source?.type === 'exam' && source.examTemplateId) {
        const display = await getExamSourceDisplay({
          examTemplateId: source.examTemplateId,
          year: source.year || 0,
          period: source.period,
          moed: source.moed,
          order: source.order
        });
        setSourceDisplay(display);
      } else if (source?.type === 'ezpass') {
        setSourceDisplay('מאגר EZPass');
      }
    };

    loadSourceDisplay();
  }, [question.metadata.source]);

  return (
    <PropertiesContainer>
      <MainTitle>
        <Title level={1}>
          <FileTextOutlined />
          פרטי שאלה
        </Title>
      </MainTitle>
      
      <ContentSection>
        <PropertySection>
          <PropertyRow>
            <SectionTitle>סוג שאלה:</SectionTitle>
            <Popover 
              content={
                <TypeFilterContent 
                  question={question}
                  onSkip={onSkip}
                  onClose={() => setIsTypePopoverOpen(false)}
                />
              }
              trigger={['click']}
              placement="top"
              open={isTypePopoverOpen}
              onOpenChange={setIsTypePopoverOpen}
              destroyTooltipOnHide={true}
              overlayStyle={{
                minWidth: '280px'
              }}
            >
              <TypeContainer $isFocused={isTypeFocused}>
                <QuestionTypeValue>{translateQuestionType(question.metadata.type)}</QuestionTypeValue>
                <div className="focus-indicator">
                  <AimOutlined style={{ fontSize: '14px' }} />
                  <FocusText>{isTypeFocused ? 'ממוקד' : 'התמקד'}</FocusText>
                </div>
              </TypeContainer>
            </Popover>
          </PropertyRow>
        </PropertySection>

        <PropertySection>
          <SectionTitle>סיווג נושאי</SectionTitle>
          <Popover
            content={
              <SubtopicPopoverContent
                question={question}
                onSkip={onSkip}
                onClose={() => setIsTopicPopoverOpen(false)}
              />
            }
            trigger={['click']}
            placement="top"
            open={isTopicPopoverOpen}
            onOpenChange={setIsTopicPopoverOpen}
            destroyTooltipOnHide={true}
            overlayStyle={{
              minWidth: '280px'
            }}
          >
            <TopicContainer $isFocused={isSubtopicFocused}>
              {subtopicData && (
                <SubtopicContainer>
                  <SubtopicName>{subtopicData.name}</SubtopicName>
                  <div className="focus-indicator">
                    <AimOutlined style={{ fontSize: '14px' }} />
                    <FocusText>{isSubtopicFocused ? 'ממוקד' : 'התמקד'}</FocusText>
                  </div>
                </SubtopicContainer>
              )}
              {topicData && (
                <TopicName>{topicData.name}</TopicName>
              )}
            </TopicContainer>
          </Popover>
        </PropertySection>

        <PropertySection>
          <SectionTitle>רמת קושי</SectionTitle>
          <PropertyContent>
            <DifficultyDisplay>
              <Rate disabled defaultValue={question.metadata.difficulty} />
              <DifficultyText>{getDifficultyLabel(question.metadata.difficulty)}</DifficultyText>
            </DifficultyDisplay>
          </PropertyContent>
        </PropertySection>

        {question.metadata.source && (
          <PropertySection>
            <SectionTitle>מקור השאלה</SectionTitle>
            <PropertyContent>
              {sourceDisplay && (
                <SourceRow>
                  <SourceText>{sourceDisplay}</SourceText>
                </SourceRow>
              )}
            </PropertyContent>
          </PropertySection>
        )}
      </ContentSection>
    </PropertiesContainer>
  );
};

export default QuestionProperties; 
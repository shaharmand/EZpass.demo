import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Row, Col, Card, Timeline, Spin, Empty, Tag, Button, Tabs, Segmented, message, List, Collapse, Divider, Table, Badge, Select, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, DownOutlined, RightOutlined, QuestionCircleOutlined, InfoCircleOutlined, StarOutlined, FilterOutlined, UpOutlined, EditOutlined } from '@ant-design/icons';
import { submissionStorage } from '../../services/submission';
import { getCurrentUserIdSync } from '../../utils/authHelpers';
import { QuestionSubmission } from '../../types/submissionTypes';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { PrepStateManager } from '../../services/PrepStateManager';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import { Question, QuestionType } from '../../types/question';
import { UserHeader } from '../../components/layout/UserHeader';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { questionStorage } from '../../services/admin/questionStorage';
import { getUserPreparations } from '../../services/preparationService';
import { PreparationSummary } from '../../types/preparation';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

// Extract URL parameters at script level
const urlParams = new URLSearchParams(window.location.search);
const questionIdFromUrl = urlParams.get('questionId');
const prepIdFromUrl = urlParams.get('prepId');

// Log the parameters
console.log('SubmissionHistoryPage - URL Parameters:', {
  questionIdFromUrl,
  prepIdFromUrl,
  fullUrl: window.location.href,
  pathName: window.location.pathname,
  search: window.location.search
});

// Helper function to format date
const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'לא זמין';
  
  // Format date using Intl.DateTimeFormat for proper Hebrew formatting
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('he-IL', { 
    year: 'numeric', 
    month: 'long',
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit'
  }).format(date);
};

// Helper function to get time spent in minutes
const getTimeSpentMinutes = (ms: number) => {
  return Math.round((ms / 60000) * 10) / 10;
};

// Helper function to get status tag
const getStatusTag = (submission: QuestionSubmission) => {
  if (!submission.feedback || !submission.feedback.data) {
    return <Tag icon={<QuestionCircleOutlined />} color="default">אין הערכה</Tag>;
  }

  // For partially correct answers (assuming score between 30-70 is partially correct)
  if (submission.feedback.data.score !== undefined && 
      submission.feedback.data.score > 30 && 
      submission.feedback.data.score < 70) {
    return <Tag icon={<InfoCircleOutlined />} color="warning">נכון חלקית</Tag>;
  }

  // For correct/incorrect
  return submission.feedback.data.isCorrect ? 
    <Tag icon={<CheckCircleOutlined />} color="success">נכון</Tag> : 
    <Tag icon={<CloseCircleOutlined />} color="error">לא נכון</Tag>;
};

// Hook to get window size
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount
  
  return windowSize;
};

interface QuestionDetails extends QuestionSubmission {
  questionContent?: {
    text: string;
    options?: Array<{
      text: string;
      format: string;
    }>;
  };
  questionType?: QuestionType;
  questionTitle?: string;
  schoolAnswer?: {
    finalAnswer?: {
      type: string;
      value: number;
      tolerance?: number;
      unit?: string;
    };
    solution?: {
      text: string;
      format: string;
    };
  };
}

const SubmissionHistoryPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<QuestionSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<QuestionSubmission[]>([]);
  const [questionsWithDetails, setQuestionsWithDetails] = useState<Record<string, QuestionDetails>>({});
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [highlightedSubmissionId, setHighlightedSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingQuestionDetails, setLoadingQuestionDetails] = useState<Record<string, boolean>>({});
  const [availablePreparations, setAvailablePreparations] = useState<PreparationSummary[]>([]);
  const [loadingPreparations, setLoadingPreparations] = useState(false);
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 576;
  
  // Get URL parameters using React Router hooks
  const location = useLocation();
  const params = useParams();
  
  // Get filter parameters from URL
  const questionIdFilter = new URLSearchParams(location.search).get('questionId');
  const prepIdFromUrl = new URLSearchParams(location.search).get('prepId');

  // Validate prep ID - if it's a Promise or invalid, just ignore it
  const prepIdFilter = prepIdFromUrl && typeof prepIdFromUrl === 'string' && !String(prepIdFromUrl).includes('[object') 
    ? prepIdFromUrl 
    : null;

  if (prepIdFromUrl && !prepIdFilter) {
    // Log the error but don't throw - we'll just show unfiltered submissions
    console.warn('Invalid prep ID in URL - ignoring filter:', prepIdFromUrl);
  }

  const submissionIdHighlight = new URLSearchParams(location.search).get('submissionId');
  
  // Show filter info in page title if filtering
  const isFiltering = !!questionIdFilter || !!prepIdFilter;
  const filterDescription = questionIdFilter 
    ? `Question: ${questionIdFilter}` 
    : prepIdFilter 
      ? `Prep: ${prepIdFilter}` 
      : '';
  
  // Log parameters from React Router
  console.log('SubmissionHistoryPage Component - URL Parameters:', {
    location,
    params,
    queryParams: new URLSearchParams(location.search),
    questionIdFilter,
    prepIdFilter,
    isFiltering
  });

  // Helper to get preparation name for display
  const getPrepName = (prepId: string) => {
    const prep = availablePreparations.find(p => p.id === prepId);
    return prep ? `מבחן ${prep.name}` : `מבחן ${prepId}`;
  };

  // Get information about what we're filtering on for the header
  const pageTitle = isFiltering 
    ? questionIdFilter 
      ? `שאלה ${questionIdFilter}` 
      : prepIdFilter 
        ? getPrepName(prepIdFilter)
        : "כל התשובות" 
    : "כל התשובות";

  // Effect to scroll to highlighted submission when it's available
  useEffect(() => {
    if (submissionIdHighlight && filteredSubmissions.length > 0) {
      setHighlightedSubmissionId(submissionIdHighlight);
      
      // Allow a moment for the DOM to render
      setTimeout(() => {
        const element = document.getElementById(`submission-${submissionIdHighlight}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a flash highlight effect
          element.classList.add('highlight-flash');
          setTimeout(() => {
            element.classList.remove('highlight-flash');
          }, 2000);
        }
      }, 500);
    }
  }, [submissionIdHighlight, filteredSubmissions]);

  // Load available preparations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = getCurrentUserIdSync();
        
        // Load available preparations regardless of user ID (will be empty for guest users)
        try {
          setLoadingPreparations(true);
          const preps = await getUserPreparations();
          // Filter only active or paused preparations
          const activeOrPausedPreps = preps.filter(
            prep => prep.status === 'active' || prep.status === 'paused'
          );
          setAvailablePreparations(activeOrPausedPreps);
          
          // If we have preparations but no filters applied, and there's a prepId in the URL
          // then automatically navigate to that preparation's submissions
          if (activeOrPausedPreps.length > 0 && !isFiltering && prepIdFromUrl) {
            const validPrep = activeOrPausedPreps.find(prep => prep.id === prepIdFromUrl);
            if (validPrep) {
              console.log('Auto-selecting preparation from URL:', validPrep.name);
              navigate(`/user/submissions?prepId=${prepIdFromUrl}`, { replace: true });
              return; // Exit early as we're redirecting
            }
          }
        } catch (error) {
          console.error('Error fetching preparations:', error);
        } finally {
          setLoadingPreparations(false);
        }
        
        if (!userId) {
          setLoading(false);
          return;
        }

        // Fetch submissions based on filter parameters
        let recentSubmissions: QuestionSubmission[];
        
        if (questionIdFilter) {
          // If filtering by question ID, fetch only submissions for that question
          recentSubmissions = await submissionStorage.getSubmissionsForQuestion(questionIdFilter, userId);
          console.log(`Fetched ${recentSubmissions.length} submissions for question ${questionIdFilter}`);
        } else if (prepIdFilter) {
          // If filtering by prep ID, fetch only submissions for that prep
          try {
            recentSubmissions = await submissionStorage.getSubmissionsForPrep(prepIdFilter, userId);
            console.log(`Fetched ${recentSubmissions.length} submissions for prep ${prepIdFilter}`);
          } catch (error) {
            console.warn('Failed to filter by prepId - method may not exist', error);
            recentSubmissions = await submissionStorage.getRecentSubmissions(userId, 50);
          }
        } else {
          // Otherwise, fetch recent submissions - increased from 10 to 50 to support pagination
          recentSubmissions = await submissionStorage.getRecentSubmissions(userId, 50);
        }
        
        setSubmissions(recentSubmissions);
        setFilteredSubmissions(recentSubmissions);
        
        // Log the first few submissions for debugging
        console.log('First 3 submissions:', recentSubmissions.slice(0, 3));
      } catch (error) {
        console.error('Error fetching submission history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [questionIdFilter, prepIdFilter, isFiltering, navigate]);

  // Apply filters whenever submissions or filter parameters change
  useEffect(() => {
    if (!submissions.length) return;
    
    let filtered = [...submissions];
    
    // Apply question ID filter if present
    if (questionIdFilter) {
      filtered = filtered.filter(sub => sub.questionId === questionIdFilter);
      console.log(`Filtered to ${filtered.length} submissions for question ${questionIdFilter}`);
    }
    
    // Apply prep ID filter if present
    if (prepIdFilter) {
      filtered = filtered.filter(sub => sub.prepId === prepIdFilter);
      console.log(`Filtered to ${filtered.length} submissions for prep ${prepIdFilter}`);
    }
    
    setFilteredSubmissions(filtered);
  }, [submissions, questionIdFilter, prepIdFilter]);

  // Group submissions by date for timeline view - use filtered submissions
  const groupedSubmissions = filteredSubmissions.reduce((groups, submission) => {
    const date = new Date(submission.metadata?.submittedAt || 0);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(submission);
    return groups;
  }, {} as Record<string, QuestionSubmission[]>);

  // Update handleEditQuestion function to use the correct URL format
  const handleEditQuestion = (questionId: string) => {
    // Navigate to the correct edit page URL
    navigate(`/admin/questions/${questionId}`);
  };

  // Load question details
  const loadQuestionDetails = async (questionId: string) => {
    // Skip if we already have this question's details
    if (questionsWithDetails[questionId]) return;
    
    try {
      setLoadingQuestionDetails(prev => ({ ...prev, [questionId]: true }));
      
      // Fetch question details
      const dbQuestion = await questionStorage.getQuestion(questionId);
      
      if (dbQuestion && dbQuestion.data) {
        const submissionData = filteredSubmissions.find(s => s.questionId === questionId);
        if (submissionData) {
          // Use name field from question root
          const questionTitle = dbQuestion.data.name || '';
          
          setQuestionsWithDetails(prev => ({ 
            ...prev, 
            [questionId]: {
              ...submissionData,
              questionContent: {
                text: dbQuestion.data.content.text,
                options: dbQuestion.data.content.options
              },
              questionType: dbQuestion.data.metadata.type,
              questionTitle,
              schoolAnswer: dbQuestion.data.schoolAnswer
            } 
          }));
        }
      }
    } catch (error) {
      console.error(`Error loading details for question ${questionId}:`, error);
    } finally {
      setLoadingQuestionDetails(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleRowExpand = (expanded: boolean, record: QuestionSubmission) => {
    // Generate key consistent with the rowKey function
    const keyIndex = filteredSubmissions.findIndex(sub => 
      (sub.id === record.id && sub.questionId === record.questionId) || 
      (sub.questionId === record.questionId && sub.metadata?.submittedAt === record.metadata?.submittedAt)
    );
    
    // Use the same key format as in the rowKey function
    let key: string;
    if (record.id) {
      key = `${record.id}-idx-${keyIndex}`;
    } else if (record.metadata?.submittedAt) {
      key = `${record.questionId}-${record.metadata.submittedAt}-idx-${keyIndex}`;
    } else {
      key = `${record.questionId}-idx-${keyIndex}`;
    }
    
    console.log('Row expand toggle:', { expanded, key, record });
    
    if (expanded) {
      setExpandedRowKeys(prev => [...prev, key]);
      loadQuestionDetails(record.questionId);
    } else {
      setExpandedRowKeys(prev => prev.filter(k => k !== key));
    }
  };

  // Fix the fetchAllQuestionDetails function to use the correct name field
  const fetchAllQuestionDetails = useCallback(async (submissions: QuestionSubmission[]) => {
    const questionIds = submissions.map(s => s.questionId);
    const uniqueIds = Array.from(new Set(questionIds));
    
    for (const questionId of uniqueIds) {
      if (!questionsWithDetails[questionId]) {
        try {
          // Fetch question details
          const dbQuestion = await questionStorage.getQuestion(questionId);
          
          if (dbQuestion && dbQuestion.data) {
            const submissionData = submissions.find(s => s.questionId === questionId);
            if (submissionData) {
              // Use name field from question root (not from metadata)
              const questionTitle = dbQuestion.data.name || ''; 
              
              setQuestionsWithDetails(prev => ({ 
                ...prev, 
                [questionId]: {
                  ...submissionData,
                  questionContent: {
                    text: dbQuestion.data.content.text,
                    options: dbQuestion.data.content.options
                  },
                  questionType: dbQuestion.data.metadata.type,
                  questionTitle,
                  schoolAnswer: dbQuestion.data.schoolAnswer
                } 
              }));
            }
          }
        } catch (error) {
          console.error(`Error loading details for question ${questionId}:`, error);
        }
      }
    }
  }, [questionsWithDetails]);

  // Add effect to fetch details for visible questions when filteredSubmissions changes
  useEffect(() => {
    if (filteredSubmissions.length > 0) {
      // Get first visible page of submissions
      const visibleSubmissions = filteredSubmissions.slice(0, 10);
      fetchAllQuestionDetails(visibleSubmissions);
    }
  }, [filteredSubmissions, fetchAllQuestionDetails]);

  const renderListView = () => {
    const columns = [
      {
        title: 'מזהה',
        dataIndex: 'questionId',
        key: 'questionId',
        render: (text: string) => (
          <span style={{ direction: 'ltr', display: 'inline-block' }}>{text}</span>
        ),
        width: 120,
      },
      {
        title: 'שם שאלה',
        key: 'title',
        render: (_: unknown, record: QuestionSubmission) => {
          const details = questionsWithDetails[record.questionId];
          return details?.questionTitle || 'ללא שם';
        },
        ellipsis: true,
      },
      {
        title: 'סטטוס',
        key: 'status',
        render: (_: unknown, record: QuestionSubmission) => getStatusTag(record),
        width: 100,
      },
      {
        title: 'ציון',
        key: 'score',
        render: (_: unknown, record: QuestionSubmission) => 
          record.feedback?.data?.score !== undefined ? `${record.feedback.data.score}%` : '-',
        width: 80,
      },
      {
        title: 'זמן',
        key: 'time',
        render: (_: unknown, record: QuestionSubmission) => 
          `${getTimeSpentMinutes(record.metadata?.timeSpentMs || 0)} דקות`,
        width: 100,
      },
      {
        title: 'תאריך',
        key: 'date',
        render: (_: unknown, record: QuestionSubmission) => formatDate(record.metadata?.submittedAt),
        width: 150,
      },
      {
        title: 'פעולות',
        key: 'actions',
        render: (_: unknown, record: QuestionSubmission) => (
          <Button 
            type="primary" 
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click event
              handleEditQuestion(record.questionId);
            }}
          >
            ערוך
          </Button>
        ),
        width: 80,
      },
    ];

    return (
      <div className="table-container">
        <Table 
          dataSource={filteredSubmissions}
          columns={columns}
          rowKey={(record, index) => `row-${record.questionId}-${index}`}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: (expandedRows) => {
              console.log('Expanded rows changed:', expandedRows);
              setExpandedRowKeys(expandedRows as string[]);
            },
            expandedRowRender: (record) => {
              const questionId = record.questionId;
              
              // Load question details if not already loaded - no useEffect here
              if (!questionsWithDetails[questionId] && !loadingQuestionDetails[questionId]) {
                loadQuestionDetails(questionId);
              }
              
              const details = questionsWithDetails[questionId];
              const isLoading = loadingQuestionDetails[questionId];
              
              if (isLoading) {
                return (
                  <div className="submission-expanded-row" style={{ padding: '24px', textAlign: 'center' }}>
                    <Spin tip="טוען פרטי שאלה..." />
                  </div>
                );
              }
              
              if (!details || !details.questionContent) {
                return (
                  <div className="submission-expanded-row" style={{ padding: '24px', textAlign: 'center' }}>
                    <Text type="secondary">לא ניתן לטעון את פרטי השאלה</Text>
                  </div>
                );
              }
              
              const { questionContent, questionType, questionTitle } = details;
              const isCorrect = record.feedback?.data?.isCorrect;
              
              return (
                <div className="submission-expanded-row" style={{ padding: '8px', fontSize: '12px' }}>
                  <div style={{ 
                    marginBottom: '8px', 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div className={`answer-status-header ${isCorrect ? 'answer-correct' : 'answer-incorrect'}`} style={{ flex: 1, padding: '4px 8px' }}>
                      <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>
                        {questionTitle ? (
                          <span>שאלה: {questionTitle}</span>
                        ) : (
                          <span>שאלה מספר {questionId}</span>
                        )}
                      </Text>
                      <div>
                        {isCorrect ? (
                          <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: '11px', padding: '0 4px' }}>תשובה נכונה</Tag>
                        ) : (
                          <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: '11px', padding: '0 4px' }}>תשובה שגויה</Tag>
                        )}
                        {record.feedback?.data?.score !== undefined && (
                          <Tag color="blue" style={{ fontSize: '11px', padding: '0 4px' }}>{record.feedback.data.score}%</Tag>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact content display */}
                  <div className="submission-content-container" style={{ backgroundColor: 'white', borderRadius: '6px', padding: '8px', fontSize: '12px' }}>
                    {/* Question Content */}
                    <div className="markdown-content" style={{ fontSize: '12px' }}>
                      <MarkdownRenderer content={questionContent.text} />
                    </div>
                    
                    {/* Multiple Choice Options */}
                    {questionType === QuestionType.MULTIPLE_CHOICE && questionContent.options && (
                      <div style={{ marginTop: '8px' }}>
                        <Divider style={{ margin: '6px 0', fontSize: '12px' }}>אפשרויות</Divider>
                        <ol style={{ paddingRight: '16px', margin: '0', fontSize: '12px' }}>
                          {questionContent.options.map((option, index) => {
                            const isUserAnswer = index + 1 === record.answer.finalAnswer?.value;
                            const isCorrectAnswer = index + 1 === details.schoolAnswer?.finalAnswer?.value;
                            const showCorrectIndicator = !isCorrect && isCorrectAnswer;
                            
                            return (
                              <li key={index} style={{ 
                                margin: '2px 0', 
                                padding: '4px 6px', 
                                borderRadius: '4px', 
                                backgroundColor: isUserAnswer 
                                  ? isCorrect ? '#f6ffed' : '#fff2f0'
                                  : isCorrectAnswer ? '#f6ffed' : 'transparent',
                                border: isUserAnswer 
                                  ? `1px solid ${isCorrect ? '#b7eb8f' : '#ffa39e'}`
                                  : isCorrectAnswer ? '1px solid #b7eb8f' : 'none',
                                fontSize: '12px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ flex: 1, fontSize: '12px' }}>
                                    <MarkdownRenderer content={option.text} />
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginRight: '4px' }}>
                                    {isUserAnswer && (
                                      <Tag color={isCorrect ? "success" : "error"} style={{ margin: 0, fontSize: '11px', padding: '0 2px' }}>
                                        {isCorrect ? "תשובתך נכונה" : "תשובתך שגויה"}
                                      </Tag>
                                    )}
                                    {showCorrectIndicator && (
                                      <Tag color="success" style={{ margin: 0, fontSize: '11px', padding: '0 2px' }}>
                                        התשובה הנכונה
                                      </Tag>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                    
                    {/* For numerical questions, show the correct answer if student was wrong */}
                    {questionType === QuestionType.NUMERICAL && (
                      <div style={{ marginTop: '8px' }}>
                        <Divider style={{ margin: '6px 0', fontSize: '12px' }}>התשובה שלך</Divider>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Badge 
                            count={record.answer.finalAnswer?.value || 'N/A'} 
                            style={{ backgroundColor: isCorrect ? '#52c41a' : '#ff4d4f', marginRight: '4px', fontSize: '11px' }}
                          />
                          {/* Only show unit for numerical answers */}
                          {record.answer.finalAnswer?.type === 'numerical' && (
                            <Text style={{ fontSize: '12px' }}>{record.answer.finalAnswer.unit || ''}</Text>
                          )}
                        </div>
                        
                        {!isCorrect && details.schoolAnswer?.finalAnswer?.type === 'numerical' && (
                          <div style={{ marginTop: '6px', padding: '4px 6px', backgroundColor: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f', fontSize: '12px' }}>
                            <Text strong style={{ fontSize: '12px' }}>התשובה הנכונה: </Text> 
                            <span>{details.schoolAnswer.finalAnswer.value} {details.schoolAnswer.finalAnswer.unit || ''}</span>
                            {details.schoolAnswer.finalAnswer.tolerance && details.schoolAnswer.finalAnswer.tolerance > 0 && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                (טווח קבלה: ±{details.schoolAnswer.finalAnswer.tolerance})
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* For open questions, show user's answer and sample solution if wrong */}
                    {questionType === QuestionType.OPEN && (
                      <div style={{ marginTop: '8px' }}>
                        <Divider style={{ margin: '6px 0', fontSize: '12px' }}>התשובה שלך</Divider>
                        {record.answer.solution?.text ? (
                          <div className="markdown-content" style={{ fontSize: '12px' }}>
                            <MarkdownRenderer content={record.answer.solution.text} />
                          </div>
                        ) : (
                          <Text type="secondary" style={{ fontSize: '12px' }}>לא הוגשה תשובה מלאה</Text>
                        )}
                        
                        {!isCorrect && details.schoolAnswer?.solution?.text && (
                          <div style={{ marginTop: '6px' }}>
                            <Divider style={{ margin: '6px 0', fontSize: '12px' }}>תשובה לדוגמה</Divider>
                            <div style={{ padding: '4px 6px', backgroundColor: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f', fontSize: '12px' }}>
                              <MarkdownRenderer content={details.schoolAnswer.solution.text} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Metadata without confidence and edit button */}
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px' }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        <ClockCircleOutlined style={{ marginLeft: '2px' }} />
                        זמן: {getTimeSpentMinutes(record.metadata?.timeSpentMs || 0)} דקות
                      </Text>
                    </div>
                    
                    {/* Feedback message if available */}
                    {record.feedback?.data?.message && (
                      <div style={{ marginTop: '8px' }}>
                        <Divider style={{ margin: '6px 0', fontSize: '12px' }}>משוב</Divider>
                        <div className="markdown-content" style={{ backgroundColor: '#f9f9f9', padding: '4px 6px', borderRadius: '4px', fontSize: '12px' }}>
                          <MarkdownRenderer content={record.feedback.data.message} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          }}
          onRow={(record, index) => ({
            onClick: () => {
              const key = `row-${record.questionId}-${index}`;
              const isExpanded = expandedRowKeys.includes(key);
              
              // Toggle expanded state
              if (isExpanded) {
                setExpandedRowKeys(expandedRowKeys.filter(k => k !== key));
              } else {
                setExpandedRowKeys([...expandedRowKeys, key]);
              }
            },
            style: { cursor: 'pointer' }
          })}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} מתוך ${total} תשובות`,
            position: ['bottomCenter'],
            responsive: true
          }}
          rowClassName={record => {
            const key = record.id || record.questionId;
            return highlightedSubmissionId === key ? 'highlighted-submission' : '';
          }}
          style={{ direction: 'rtl' }}
          scroll={{ x: 'max-content', y: isMobile ? undefined : 500 }}
        />
      </div>
    );
  };

  // Update the renderPrepSelector function to better handle default cases
  const renderPrepSelector = () => {
    // If we have a prepId filter, use it, otherwise default to 'all'
    const currentPrepId = prepIdFilter || 'all';
    
    return (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          direction: 'rtl'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FilterOutlined />
            <Text strong>סנן לפי מבחן:</Text>
            <Select
              loading={loadingPreparations}
              style={{ width: 250, textAlign: 'right' }}
              value={currentPrepId}
              onChange={(value) => {
                if (value === 'all') {
                  navigate('/user/submissions');
                } else {
                  navigate(`/user/submissions?prepId=${value}`);
                }
              }}
              placeholder="בחר מבחן"
              disabled={loadingPreparations}
            >
              <Select.Option value="all" key="all">כל המבחנים</Select.Option>
              {availablePreparations.map(prep => (
                <Select.Option value={prep.id} key={prep.id}>
                  {prep.name} {prep.status === 'paused' ? '(מושהה)' : '(פעיל)'} - {prep.progress}%
                </Select.Option>
              ))}
            </Select>
          </div>
          
          <div>
            {prepIdFilter && (
              <Button 
                type="default" 
                onClick={() => navigate('/user/submissions')}
                style={{ marginRight: 8 }}
              >
                נקה סינון
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // Simplify the renderFilterOptions function to only show a clear filter button when filtering
  const renderFilterOptions = () => {
    if (!isFiltering) return null;
    
    return (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          alignItems: 'center',
          direction: 'rtl'
        }}>
          <Button 
            type="default" 
            onClick={() => navigate('/user/submissions')}
          >
            הצג את כל התשובות
          </Button>
        </div>
      </Card>
    );
  };

  // Add CSS for highlight flash animation and scrollable content
  useEffect(() => {
    // Add CSS for highlight flash animation
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes highlightFlash {
        0% { box-shadow: 0 0 8px 2px rgba(24, 144, 255, 0.8); }
        50% { box-shadow: 0 0 16px 8px rgba(24, 144, 255, 0.6); }
        100% { box-shadow: 0 0 8px 2px rgba(24, 144, 255, 0.8); }
      }
      
      .highlight-flash {
        animation: highlightFlash 1s ease 3;
      }
      
      .highlighted-submission {
        background-color: rgba(24, 144, 255, 0.1) !important;
      }
      
      .ant-table-row.highlighted-submission td {
        background-color: rgba(24, 144, 255, 0.1) !important;
      }
      
      /* Improved expanded row styling with clearer connection to parent */
      .submission-expanded-row {
        border-radius: 8px;
        position: relative;
        margin: 0 24px;
        border-left: 4px solid #1890ff;
        box-shadow: 0 3px 10px rgba(0,0,0,0.12);
        background-color: #fafafa;
        transition: all 0.3s ease;
      }
      
      /* Make sure expanded content is visible */
      .ant-table-expanded-row-fixed {
        margin: 0 !important;
        padding: 16px 0 !important;
        position: static !important;
        box-shadow: none !important;
        overflow: visible !important;
      }
      
      .ant-table-expanded-row > td {
        padding: 16px 0 !important;
      }
      
      /* Ensure expanded rows don't cause horizontal scroll issues */
      .ant-table-expanded-row .ant-table-cell {
        padding: 0 !important;
        background-color: transparent !important;
        overflow: visible !important;
      }
      
      /* Ensure markdown content in expanded rows is properly displayed */
      .submission-expanded-row .markdown-content {
        max-width: 100%;
        overflow-wrap: break-word;
        padding: 16px;
        background-color: white;
        border-radius: 4px;
      }
      
      /* Status indicator for the answer */
      .answer-status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        border-radius: 4px;
        margin-bottom: 16px;
      }
      
      .answer-correct {
        background-color: #f6ffed;
        border: 1px solid #b7eb8f;
      }
      
      .answer-incorrect {
        background-color: #fff2f0;
        border: 1px solid #ffccc7;
      }

      /* Media queries for mobile responsiveness */
      @media (max-width: 576px) {
        .submissions-page-content {
          padding: 12px 8px;
        }
        
        .submission-expanded-row {
          padding: 8px 4px !important;
          margin: 0 8px;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <UserHeader 
          pageType="היסטוריה" 
          pageContent={pageTitle}
        />
        <div style={{ textAlign: 'center', padding: 50, flex: 1 }}>
          <Spin size="large" />
          <p>טוען היסטוריית תשובות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submissions-page-root">
      <UserHeader 
        pageType="היסטוריה" 
        pageContent={pageTitle}
      />
      
      <div className="submissions-page-content" style={{ padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Always show the preparation selector if we have preparations available */}
        {availablePreparations.length > 0 && renderPrepSelector()}
        
        {/* Only show the filter options if explicitly filtering by something other than a preparation */}
        {isFiltering && !prepIdFilter && renderFilterOptions()}
        
        {submissions.length === 0 && !loading ? (
          <Empty 
            description={
              <span>
                {isFiltering 
                  ? `לא נמצאו תשובות עבור ${filterDescription}`
                  : "עדיין לא הגשת שום תשובות"}
                <br />
                {isFiltering 
                  ? "נסה להסיר את הסינון או חזור לכל התשובות" 
                  : "התחל לתרגל כדי לראות את ההיסטוריה שלך!"}
              </span>
            }
          >
            {isFiltering ? (
              <Button type="primary" onClick={() => navigate('/user/submissions')}>
                הצג את כל התשובות
              </Button>
            ) : (
              <Button type="primary" onClick={() => navigate('/practice')}>
                התחל לתרגל
              </Button>
            )}
          </Empty>
        ) : (
          renderListView()
        )}
      </div>
    </div>
  );
};

export default SubmissionHistoryPage; 
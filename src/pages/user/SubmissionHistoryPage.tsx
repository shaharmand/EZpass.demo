import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Timeline, Spin, Empty, Tag, Statistic, Button, Tabs, Segmented, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { submissionStorage } from '../../services/submission';
import { getCurrentUserIdSync } from '../../utils/authHelpers';
import { QuestionSubmission } from '../../types/submissionTypes';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { PrepStateManager } from '../../services/PrepStateManager';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import { Question } from '../../types/question';
import { UserHeader } from '../../components/layout/UserHeader';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

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

const SubmissionHistoryPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<QuestionSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<QuestionSubmission[]>([]);
  const [highlightedSubmissionId, setHighlightedSubmissionId] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalSubmissions: number;
    correctSubmissions: number;
    totalQuestions: number;
    averageScore: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'cards'>('timeline');
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 576;
  
  // Get URL parameters using React Router hooks
  const location = useLocation();
  const params = useParams();
  
  // Get filter parameters from URL
  const questionIdFilter = new URLSearchParams(location.search).get('questionId');
  const prepIdFilter = new URLSearchParams(location.search).get('prepId');
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

  // Get information about what we're filtering on for the header
  const pageTitle = isFiltering 
    ? questionIdFilter 
      ? `שאלה ${questionIdFilter}` 
      : prepIdFilter 
        ? `מבחן ${prepIdFilter}` 
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = getCurrentUserIdSync();
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
          // Note: You might need to add this method to submissionStorage
          try {
            recentSubmissions = await submissionStorage.getSubmissionsForPrep(prepIdFilter, userId);
            console.log(`Fetched ${recentSubmissions.length} submissions for prep ${prepIdFilter}`);
          } catch (error) {
            console.warn('Failed to filter by prepId - method may not exist', error);
            recentSubmissions = await submissionStorage.getRecentSubmissions(userId, 50);
          }
        } else {
          // Otherwise, fetch recent submissions
          recentSubmissions = await submissionStorage.getRecentSubmissions(userId, 50);
        }
        
        setSubmissions(recentSubmissions);
        setFilteredSubmissions(recentSubmissions);

        // Fetch statistics (could be filtered based on the current filter)
        const userStats = await submissionStorage.getUserStatistics(userId);
        setStats(userStats);
        
        // Log the first few submissions for debugging
        console.log('First 3 submissions:', recentSubmissions.slice(0, 3));
      } catch (error) {
        console.error('Error fetching submission history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [questionIdFilter, prepIdFilter]);

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

  // Handle click on review button to navigate to question
  const handleReviewQuestion = (questionId: string) => {
    // When reviewing a question, ensure that the submission data is loaded into the state
    PrepStateManager.loadSubmissionsFromDatabase(questionId)
      .then(() => {
        navigate(`/practice/question/${questionId}`);
      })
      .catch(error => {
        console.error('Error loading submissions before review:', error);
        // Still navigate even if there's an error
        navigate(`/practice/question/${questionId}`);
      });
  };

  const renderTimelineView = () => {
    const timelineItems = Object.entries(groupedSubmissions)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([date, dailySubmissions]) => {
        const formattedDate = new Date(date).toLocaleDateString('he-IL');
        
        return (
          <Timeline.Item 
            key={date} 
            color="blue"
            label={<strong>{formattedDate}</strong>}
          >
            <Card title={`${dailySubmissions.length} תשובות ב-${formattedDate}`} size="small">
              {dailySubmissions.map((submission, index) => {
                const submissionId = submission.id || `${submission.questionId}-${index}`;
                const isHighlighted = submissionId === highlightedSubmissionId;
                
                return (
                  <div 
                    id={`submission-${submissionId}`}
                    key={`${submission.questionId}-${index}`} 
                    style={{ 
                      marginBottom: 16, 
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: submission.feedback?.data?.isCorrect ? '#f6ffed' : '#fff1f0',
                      border: `1px solid ${submission.feedback?.data?.isCorrect ? '#b7eb8f' : '#ffa39e'}`,
                      boxShadow: isHighlighted ? '0 0 8px 2px rgba(24, 144, 255, 0.8)' : 'none',
                      transition: 'box-shadow 0.3s ease'
                    }}
                    className={isHighlighted ? 'highlighted-submission' : ''}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: isMobile ? 'flex-start' : 'center',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '8px' : '0',
                      direction: 'rtl'
                    }}>
                      <div>
                        <Text strong style={{ direction: 'ltr', display: 'inline-block' }}>{submission.questionId}</Text>
                        <div style={{ marginTop: 4 }}>
                          {submission.feedback?.data?.isCorrect ? (
                            <Tag icon={<CheckCircleOutlined />} color="success">נכון</Tag>
                          ) : (
                            <Tag icon={<CloseCircleOutlined />} color="error">לא נכון</Tag>
                          )}
                          <Tag icon={<ClockCircleOutlined />} color="default">
                            {getTimeSpentMinutes(submission.metadata?.timeSpentMs || 0)} דקות
                          </Tag>
                          {submission.feedback?.data?.score !== undefined && (
                            <Tag color="blue">{submission.feedback.data.score}%</Tag>
                          )}
                          <Button 
                            type="text" 
                            size="small"
                            onClick={() => {
                              const url = `${window.location.origin}/user/submissions?submissionId=${submissionId}`;
                              navigator.clipboard.writeText(url);
                              message.success('הלינק הועתק ללוח!');
                            }}
                            title="העתק קישור ישיר לתשובה זו"
                          >
                            🔗
                          </Button>
                        </div>
                      </div>
                      <Button 
                        type="link" 
                        onClick={() => handleReviewQuestion(submission.questionId)}
                        style={{ padding: isMobile ? '4px 0' : undefined }}
                      >
                        בדוק
                      </Button>
                    </div>
                  </div>
                );
              })}
            </Card>
          </Timeline.Item>
        );
      });

    return (
      <Timeline 
        mode={isMobile ? 'right' : 'left'} 
        style={{ 
          marginTop: 24,
          paddingRight: isMobile ? 16 : 0,
          paddingLeft: isMobile ? 0 : 16,
          direction: 'rtl'
        }}
      >
        {timelineItems}
      </Timeline>
    );
  };

  const renderCardView = () => {
    return (
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {filteredSubmissions.map((submission, index) => {
          const submissionId = submission.id || `${submission.questionId}-${index}`;
          const isHighlighted = submissionId === highlightedSubmissionId;
          
          return (
            <Col 
              xs={24} 
              sm={12} 
              lg={8} 
              key={`${submission.questionId}-${index}`}
              id={`submission-${submissionId}`}
            >
              <Card 
                hoverable
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl' }}>
                    <span>שאלה <span style={{ direction: 'ltr', display: 'inline-block' }}>{submission.questionId}</span></span>
                    <Button 
                      type="text" 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/user/submissions?submissionId=${submissionId}`;
                        navigator.clipboard.writeText(url);
                        message.success('הלינק הועתק ללוח!');
                      }}
                      title="העתק קישור ישיר לתשובה זו"
                      style={{ padding: 4, marginLeft: 8 }}
                    >
                      🔗
                    </Button>
                  </div>
                }
                extra={!isMobile && (
                  <Button 
                    type="link" 
                    onClick={() => handleReviewQuestion(submission.questionId)}
                  >
                    בדוק
                  </Button>
                )}
                style={{ 
                  borderRight: `5px solid ${submission.feedback?.data?.isCorrect ? '#52c41a' : '#ff4d4f'}`,
                  height: '100%',
                  boxShadow: isHighlighted ? '0 0 8px 2px rgba(24, 144, 255, 0.8)' : 'none',
                  transition: 'box-shadow 0.3s ease',
                  direction: 'rtl'
                }}
                className={isHighlighted ? 'highlighted-submission' : ''}
              >
                <div>
                  <Paragraph>
                    <Text strong>הוגש:</Text> {formatDate(submission.metadata?.submittedAt)}
                  </Paragraph>
                  <Paragraph>
                    <Text strong>זמן שהושקע:</Text> {getTimeSpentMinutes(submission.metadata?.timeSpentMs || 0)} דקות
                  </Paragraph>
                  <Paragraph>
                    <Text strong>ביטחון:</Text> {
                      submission.metadata?.confidence === 'high' ? 'גבוה' :
                      submission.metadata?.confidence === 'medium' ? 'בינוני' :
                      submission.metadata?.confidence === 'low' ? 'נמוך' : 'לא צוין'
                    }
                  </Paragraph>
                  <Paragraph>
                    <Text strong>תוצאה:</Text> {' '}
                    {submission.feedback?.data?.isCorrect ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">נכון</Tag>
                    ) : (
                      <Tag icon={<CloseCircleOutlined />} color="error">לא נכון</Tag>
                    )}
                  </Paragraph>
                  {submission.feedback?.data?.score !== undefined && (
                    <Paragraph>
                      <Text strong>ציון:</Text> {submission.feedback.data.score}%
                    </Paragraph>
                  )}
                  
                  {isMobile && (
                    <div style={{ marginTop: 16, textAlign: 'left' }}>
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleReviewQuestion(submission.questionId)}
                      >
                        בדוק
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  const renderStatsCards = () => {
    if (!stats) return null;
    
    // Calculate filtered stats if filtering
    const filteredStats = isFiltering ? {
      totalSubmissions: filteredSubmissions.length,
      correctSubmissions: filteredSubmissions.filter(sub => sub.feedback?.data?.isCorrect).length,
      totalQuestions: new Set(filteredSubmissions.map(sub => sub.questionId)).size,
      averageScore: filteredSubmissions.reduce((sum, sub) => sum + (sub.feedback?.data?.score || 0), 0) / 
                    (filteredSubmissions.length || 1)
    } : stats;
    
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="סך הכל תשובות" 
              value={filteredStats.totalSubmissions} 
              suffix={`/ ${filteredStats.totalQuestions} שאלות`}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="אחוז הצלחה" 
              value={(filteredStats.correctSubmissions / filteredStats.totalSubmissions * 100) || 0} 
              precision={1}
              suffix="%" 
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="ציון ממוצע" 
              value={filteredStats.averageScore} 
              precision={1}
              suffix="%" 
              valueStyle={{ color: filteredStats.averageScore > 70 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="שאלות ייחודיות" 
              value={filteredStats.totalQuestions} 
            />
          </Card>
        </Col>
      </Row>
    );
  };

  // After the renderStatsCards function, add a new function to render filter options
  const renderFilterOptions = () => {
    return (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: '16px',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          direction: 'rtl'
        }}>
          <div>
            <Text strong style={{ marginLeft: 8 }}>סינון:</Text>
            <Button.Group style={{ marginLeft: 16 }}>
              <Button 
                type={!isFiltering ? 'primary' : 'default'} 
                onClick={() => navigate('/user/submissions')}
              >
                הכל
              </Button>
              <Button 
                type={isFiltering && questionIdFilter ? 'primary' : 'default'} 
                disabled={!filteredSubmissions.length}
                onClick={() => {
                  // No action if already filtered by question
                  if (questionIdFilter) return;
                  
                  // If there are submissions, take the first one's question ID
                  if (filteredSubmissions.length) {
                    const firstQuestionId = filteredSubmissions[0].questionId;
                    navigate(`/user/submissions?questionId=${firstQuestionId}`);
                  }
                }}
              >
                לפי שאלה
              </Button>
            </Button.Group>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', direction: 'rtl' }}>
            <Text strong>מיון:</Text>
            <Segmented
              options={[
                { value: 'timeline', label: 'ציר זמן' },
                { value: 'cards', label: 'כרטיסים' }
              ]}
              value={viewMode}
              onChange={(value) => setViewMode(value as 'timeline' | 'cards')}
            />
          </div>
        </div>
      </Card>
    );
  };

  // Add CSS for highlight flash animation
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
        position: relative;
      }
      
      .highlighted-submission::before {
        content: '';
        position: absolute;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        border-radius: 12px;
        border: 2px solid rgba(24, 144, 255, 0.8);
        pointer-events: none;
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <UserHeader 
        pageType="היסטוריה" 
        pageContent={pageTitle}
      />
      
      <div style={{ padding: '16px 24px', maxWidth: 1200, margin: '0 auto', flex: 1 }}>
        {submissions.length === 0 ? (
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
          <>
            {renderStatsCards()}
            {renderFilterOptions()}
            {viewMode === 'timeline' ? renderTimelineView() : renderCardView()}
          </>
        )}
      </div>
    </div>
  );
};

export default SubmissionHistoryPage; 
// TODO: This will be the construction safety courses section
// Features to implement:
// - List of available safety courses
// - Course details and requirements
// - Registration process
// - Course materials
// - Progress tracking
// - Certification process

import React, { useState } from 'react';
import { Typography, Card, Space, Button, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  SafetyCertificateOutlined,
  ToolOutlined,
  TeamOutlined,
  BuildOutlined,
  ArrowLeftOutlined,
  ExperimentFilled
} from '@ant-design/icons';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import type { FormalExam } from '../types/shared/exam';

const { Title, Text, Paragraph } = Typography;

// Consistent color scheme
const colors = {
  icon: {
    left: '#ff9800',
    right: '#3b82f6'
  },
  text: {
    brand: '#3b82f6',
    primary: '#1e293b',
    secondary: '#64748b'
  },
  button: {
    primary: {
      background: '#3b82f6',
      hover: '#2563eb',
      text: '#ffffff'
    },
    secondary: {
      background: '#f8fafc',
      hover: '#f1f5f9',
      text: '#1e293b',
      border: '#e2e8f0'
    }
  }
};

const SafetyCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { startPrep } = useStudentPrep();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartPractice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the construction safety exam
      const exam: FormalExam = {
        id: 'mahat_construction_safety',
        title: 'בטיחות בבנייה',
        description: 'SAFETY-101 - Construction Safety Exam',
        names: {
          short: 'בטיחות בבנייה',
          medium: 'מבחן בטיחות בבנייה',
          full: 'מבחן בטיחות בבנייה מה״ט'
        },
        examType: 'mahat' as const,
        duration: 180,
        totalQuestions: 50,
        status: 'not_started' as const,
        topics: [] // Topics will be loaded from the actual exam data
      };

      // Start the prep and get ID
      const prepId = await startPrep(exam);
      
      // Navigate to practice page
      navigate(`/practice/${prepId}`, { replace: true });
    } catch (error) {
      console.error('Error starting practice:', error);
      setError(error instanceof Error ? error.message : 'Failed to start practice');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Platform Branding */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <div style={{
          position: 'relative',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '4px'
        }}>
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <ExperimentFilled style={{ 
              fontSize: '42px',
              color: colors.icon.left,
              position: 'absolute',
              left: 0,
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              lineHeight: 1
            }} />
            <ExperimentFilled style={{ 
              fontSize: '42px',
              color: colors.icon.right,
              position: 'absolute',
              right: 0,
              clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
              lineHeight: 1
            }} />
          </motion.div>
        </div>
        <div style={{ 
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Title style={{ 
            margin: 0, 
            fontSize: '42px',
            color: colors.text.brand,
            lineHeight: 1,
            height: '42px',
            display: 'flex',
            alignItems: 'center'
          }}>
            איזיפס
          </Title>
          <Text style={{ 
            fontSize: '18px',
            color: colors.icon.left,
            display: 'block',
            marginTop: '4px',
            fontWeight: 500
          }}>
            פשוט להצליח
          </Text>
        </div>
      </motion.div>

      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
        padding: '48px 24px',
        textAlign: 'center',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={1} style={{ 
            fontSize: '48px',
            marginBottom: '24px',
            color: colors.text.primary
          }}>
            קורסי בטיחות בבניה
          </Title>
          <Paragraph style={{ 
            fontSize: '20px',
            color: colors.text.secondary,
            maxWidth: '800px',
            margin: '0 auto',
            marginBottom: '48px'
          }}>
            קורסי הכנה ממוקדים למעבר הבחינה עם תרגול מעשי, משוב מיידי והכנה מקיפה למבחן
          </Paragraph>
        </div>
      </div>

      {/* Courses Grid */}
      <div style={{ 
        padding: '48px 24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {error && (
          <Alert
            message="שגיאה"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {[
            {
              icon: <BuildOutlined />,
              title: 'בטיחות בבניה מה"ט',
              description: 'הכנה למבחן בטיחות בבניה של מה"ט, כולל מאגר שאלות מקיף',
              features: ['תרגול שאלות אמריקאיות', 'הסברים מפורטים', 'מעקב התקדמות']
            },
            {
              icon: <TeamOutlined />,
              title: 'מנהל עבודה',
              description: 'הכנה ממתואמת אישית למעבר וועדת קבלה של משרד העבודה',
              features: [
                'מאגר שאלות וועדה',
                'סימולציה למבחן הוועדה',
                'הרצאות מלאות ב 25 נושאים'
              ]
            },
            {
              icon: <ToolOutlined />,
              title: 'קבלן שיפוצים 131',
              description: 'הכנה ממוקדת ויעילה למבחן ההסמכה',
              features: [
                'תרגול שאלות סגורות עם הסברים מפורטים',
                'הרצאות בכל נושא',
                'סימולציה של המבחן'
              ]
            }
          ].map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '32px',
                      color: colors.icon.right,
                      background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
                      border: '1px solid rgba(59, 130, 246, 0.1)'
                    }}>
                      {course.icon}
                    </div>
                    <Title level={3} style={{ 
                      fontSize: '26px',
                      marginBottom: '16px',
                      color: colors.text.primary,
                      background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {course.title}
                    </Title>
                    <Text style={{ 
                      fontSize: '16px',
                      color: colors.text.secondary,
                      display: 'block',
                      marginBottom: '24px',
                      lineHeight: 1.6
                    }}>
                      {course.description}
                    </Text>
                  </div>

                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {course.features.map((feature, fIndex) => (
                      <div key={fIndex} style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <SafetyCertificateOutlined style={{ 
                          color: colors.icon.right,
                          fontSize: '18px'
                        }} />
                        <Text style={{
                          fontSize: '15px',
                          color: colors.text.primary
                        }}>{feature}</Text>
                      </div>
                    ))}
                  </Space>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={handleStartPractice}
                      loading={loading}
                      style={{
                        height: 'auto',
                        padding: '16px',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: colors.button.primary.background,
                        borderColor: colors.button.primary.background,
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                        borderRadius: '12px'
                      }}
                    >
                      התחל תרגול
                      <ArrowLeftOutlined />
                    </Button>
                  </motion.div>
                </Space>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SafetyCoursesPage; 
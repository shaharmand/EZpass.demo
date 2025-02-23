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
import type { ExamTemplate } from '../types/examTemplate';
import { ExamType } from '../types/examTemplate';
import { examService } from '../services/examService';
import './SafetyCoursesPage.css';

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

const gridStyles = {
  display: 'grid',
  gap: '24px',
  gridTemplateColumns: 'repeat(4, 1fr)',
  '@media (max-width: 1200px)': {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },
  '@media (max-width: 640px)': {
    gridTemplateColumns: '1fr'
  }
};

const SafetyCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { startPrep } = useStudentPrep();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartPractice = async (examId: string) => {
    try {
      setLoading(examId);
      setError(null);
      
      // Load exam template from exam service
      const exam = await examService.getExamById(examId);
      if (!exam) {
        throw new Error('Failed to load exam template');
      }

      // Start the prep and get ID
      const prepId = await startPrep(exam);
      
      // Navigate to practice page
      navigate(`/practice/${prepId}`, { replace: true });
    } catch (error) {
      console.error('Error starting practice:', error);
      setError(error instanceof Error ? error.message : 'Failed to start practice');
      setLoading(null);
    }
  };

  const courses = [
    {
      icon: <BuildOutlined />,
      title: 'בטיחות בבניה מה"ט',
      description: 'הכנה למבחן בטיחות בבניה של מה"ט, כולל מאגר שאלות מקיף',
      examId: 'mahat_civil_safety',
      features: ['תרגול שאלות אמריקאיות', 'הסברים מפורטים', 'מעקב התקדמות']
    },
    {
      icon: <TeamOutlined />,
      title: 'מנהל עבודה',
      description: 'הכנה ממתואמת אישית למעבר וועדת קבלה של משרד העבודה',
      examId: 'construction_manager_certification',
      features: [
        'מאגר שאלות וועדה',
        'סימולציה למבחן הוועדה',
        'הרצאות מלאות ב 25 נושאים'
      ]
    },
    {
      icon: <SafetyCertificateOutlined />,
      title: 'מנהל עבודה - מסלול מלא',
      description: 'הכנה מקיפה למבחן ההסמכה במסגרת קורס מנהל עבודה',
      examId: 'construction_manager_safety_full',
      features: [
        'מאגר שאלות אמריקאיות',
        'סימולציות מבחן מלאות',
        'חומרי לימוד מותאמים'
      ]
    },
    {
      icon: <ToolOutlined />,
      title: 'קבלן שיפוצים 131',
      description: 'הכנה ממוקדת ויעילה למבחן ההסמכה - כולל סימולציה ושאלות ממאגר מנהל עבודה',
      examId: 'renovation_contractor_131',
      features: [
        'תרגול שאלות סגורות עם הסברים מפורטים',
        'הרצאות בכל נושא',
        'סימולציה של המבחן'
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
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
          padding: '32px',
          textAlign: 'center',
          background: '#F7F9FC',
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0'
        }}>
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '12px',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: 'rgba(255, 255, 255, 0.8)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
          >
            <motion.img
              src="/EZpass_A6_cut.png"
              alt="איזיפס - פשוט להצליח"
              style={{
                height: '64px',
                width: 'auto',
                objectFit: 'contain'
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{
                height: '32px',
                borderRight: '2px solid #e5e7eb',
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Text style={{ 
                fontSize: '18px',
                color: '#ff9800',
                fontWeight: 500,
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                marginRight: '8px'
              }}>
                פשוט להצליח
              </Text>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
        padding: '40px 24px',
        textAlign: 'center',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto' 
        }}>
          <Title level={1} style={{ 
            fontSize: '40px',
            marginBottom: '16px',
            color: colors.text.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}>
            הדרך להצלחה בבטיחות בבניה
            <BuildOutlined style={{ 
              fontSize: '32px',
              color: '#3b82f6'
            }} />
          </Title>
          <Paragraph style={{ 
            fontSize: '18px',
            color: colors.text.secondary,
            margin: '0 auto',
            marginBottom: '32px',
            maxWidth: '500px'
          }}>
            תרגול מעשי, משוב מיידי והכנה מקיפה למבחן - כל מה שצריך כדי להצליח
          </Paragraph>
        </div>
      </div>

      {/* Courses Grid */}
      <div style={{ 
        padding: '48px 32px',
        maxWidth: '1400px',
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

        <div className="courses-grid">
          {courses.map((course, index) => (
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
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
                      border: '1px solid rgba(59, 130, 246, 0.1)'
                    }}>
                      {course.icon}
                    </div>
                    <Title level={3} style={{ 
                      fontSize: '20px',
                      marginBottom: '12px',
                      color: colors.text.primary,
                      background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {course.title}
                    </Title>
                    <Text style={{ 
                      fontSize: '14px',
                      color: colors.text.secondary,
                      display: 'block',
                      marginBottom: '16px',
                      lineHeight: 1.5
                    }}>
                      {course.description}
                    </Text>
                  </div>

                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {course.features.map((feature, fIndex) => (
                      <div key={fIndex} style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <SafetyCertificateOutlined style={{ 
                          color: colors.icon.right,
                          fontSize: '14px'
                        }} />
                        <Text style={{
                          fontSize: '13px',
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
                      onClick={() => handleStartPractice(course.examId)}
                      loading={loading === course.examId}
                      style={{
                        height: 'auto',
                        padding: '12px',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: colors.button.primary.background,
                        borderColor: colors.button.primary.background,
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                        borderRadius: '10px'
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
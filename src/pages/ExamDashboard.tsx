// Main dashboard for exam selection and practice
// Contains exam cards and development tools in development mode

import React from 'react';
import { Typography, Space, Spin, Card } from 'antd';
import { useExam } from '../contexts/ExamContext';
import { ExamCard } from '../components/ExamCard/ExamCard';
import { motion } from 'framer-motion';
import { 
  BookOutlined, 
  ExperimentFilled,
  RocketOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Enhanced color scheme
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
  gradients: {
    blue: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
    orange: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
    mixed: 'linear-gradient(135deg, #f0f7ff 0%, #fff7ed 100%)'
  }
};

const ExamDashboard: React.FC = () => {
  const { bagrutExams, mahatExams, loading } = useExam();

  if (loading) {
    return (
      <div style={{ 
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)'
      }}>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Spin size="large" />
        </motion.div>
        <Text style={{ color: colors.text.brand, fontSize: '18px', fontWeight: 500 }}>
          טוען את המבחנים שלך...
        </Text>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      transition={{ duration: 0.5 }}
      style={{ 
        padding: '48px 24px',
        maxWidth: '1200px', 
        margin: '0 auto',
        background: '#ffffff'
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
          marginBottom: '48px',
          gap: '16px'
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

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          marginBottom: '48px',
          textAlign: 'center',
          background: colors.gradients.mixed,
          padding: '40px',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(148, 163, 184, 0.05)'
        }}
      >
        <Title level={2} style={{ 
          color: colors.text.primary,
          fontSize: '2.2rem',
          marginBottom: '16px',
          fontWeight: 600
        }}>
          <RocketOutlined style={{ 
            marginLeft: '12px', 
            color: colors.icon.right,
            fontSize: '2rem'
          }} />
          בחר מבחן והתחל לתרגל
        </Title>
        <Text style={{ 
          fontSize: '1.2rem',
          color: colors.text.secondary,
          maxWidth: '700px',
          display: 'block',
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          בחר את המבחן שברצונך לתרגל ונתאים עבורך תכנית אימון אישית
        </Text>
      </motion.div>

      {/* Exam Sections */}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Bagrut Section */}
        {bagrutExams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              background: colors.gradients.blue,
              padding: '20px 24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(148, 163, 184, 0.05)'
            }}>
              <div style={{
                background: '#ffffff',
                padding: '12px',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(148, 163, 184, 0.1)'
              }}>
                <BookOutlined style={{ 
                  fontSize: '24px',
                  color: colors.icon.right
                }} />
              </div>
              <Title level={2} style={{ 
                margin: 0,
                color: colors.text.primary,
                fontSize: '1.5rem',
                fontWeight: 600
              }}>
                בחינות בגרות
              </Title>
            </div>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {bagrutExams.map((exam, index) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <ExamCard exam={exam} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mahat Section */}
        {mahatExams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              background: colors.gradients.orange,
              padding: '20px 24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(148, 163, 184, 0.05)'
            }}>
              <div style={{
                background: '#ffffff',
                padding: '12px',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(148, 163, 184, 0.1)'
              }}>
                <BookOutlined style={{ 
                  fontSize: '24px',
                  color: colors.icon.left
                }} />
              </div>
              <Title level={2} style={{ 
                margin: 0,
                color: colors.text.primary,
                fontSize: '1.5rem',
                fontWeight: 600
              }}>
                בחינות מה״ט
              </Title>
            </div>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {mahatExams.map((exam, index) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <ExamCard exam={exam} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </Space>
    </motion.div>
  );
};

export default ExamDashboard; 
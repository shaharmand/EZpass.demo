// TODO: This will be the main marketing/SEO-optimized landing page
// Features to implement:
// - Value proposition for exam preparation
// - Benefits of using the system
// - User testimonials
// - Call to action for registration
// - SEO optimization
// - Lightweight implementation

import React from 'react';
import { Button, Typography, Space, Card, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  ExperimentFilled,
  SafetyCertificateOutlined,
  RocketOutlined,
  TeamOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  StarOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;

// Consistent color scheme from PracticeHeader
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

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
        padding: '80px 24px',
        textAlign: 'center',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Logo */}
          <motion.div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '32px',
              gap: '8px'
            }}
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div style={{
              position: 'relative',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '8px'
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
                  fontSize: '48px',
                  color: colors.icon.left,
                  position: 'absolute',
                  left: 0,
                  clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
                }} />
                <ExperimentFilled style={{ 
                  fontSize: '48px',
                  color: colors.icon.right,
                  position: 'absolute',
                  right: 0,
                  clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
                }} />
              </motion.div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Title style={{ 
                margin: 0, 
                fontSize: '52px',
                color: colors.text.brand,
                lineHeight: 1
              }}>
                איזיפס
              </Title>
              <Text style={{ 
                fontSize: '20px',
                color: colors.icon.left,
                display: 'block',
                marginTop: '8px',
                fontWeight: 500
              }}>
                פשוט להצליח
              </Text>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Title level={1} style={{ 
              fontSize: '56px',
              marginBottom: '24px',
              color: colors.text.primary,
              fontWeight: 700
            }}>
              הדרך הפשוטה להצלחה במבחנים
            </Title>
            <Paragraph style={{ 
              fontSize: '22px',
              color: colors.text.secondary,
              maxWidth: '800px',
              margin: '0 auto 48px',
              lineHeight: 1.6
            }}>
              מערכת מתקדמת להכנה למבחנים, המשלבת טכנולוגיה חדשנית עם שיטות למידה מוכחות.
              התאמה אישית, משוב מיידי, וליווי מקצועי לאורך כל הדרך.
            </Paragraph>

            <Space size="large">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  type="primary"
                  size="large"
                  onClick={() => navigate('/dashboard')}
                  style={{
                    height: 'auto',
                    padding: '16px 40px',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: colors.button.primary.background,
                    borderColor: colors.button.primary.background,
                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <RocketOutlined />
                  להתחיל לתרגל
                  <ArrowLeftOutlined />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="large"
                  onClick={() => navigate('/safety-courses')}
                  style={{
                    height: 'auto',
                    padding: '16px 40px',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: colors.button.secondary.background,
                    borderColor: colors.button.secondary.border,
                    color: colors.button.secondary.text
                  }}
                >
                  <SafetyCertificateOutlined />
                  קורסי בטיחות
                </Button>
              </motion.div>
            </Space>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ 
        padding: '80px 24px',
        background: '#ffffff'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Title level={2} style={{ 
              textAlign: 'center',
              marginBottom: '48px',
              color: colors.text.primary,
              fontSize: '36px'
            }}>
              למה איזיפס?
            </Title>
          </motion.div>

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {[
              {
                icon: <CheckCircleOutlined />,
                title: 'תרגול יעיל',
                value: 'מאגר שאלות מקיף',
                description: 'מאגר שאלות מעודכן, עם הסברים מפורטים ופתרונות מלאים'
              },
              {
                icon: <TeamOutlined />,
                title: 'משוב והנחיה אישיים',
                value: 'ליווי מקצועי',
                description: 'ליווי צמוד ומשוב מפורט מצוות מקצועי ומערכת AI חכמה'
              },
              {
                icon: <TrophyOutlined />,
                title: 'מסלול למידה מותאם',
                value: 'התקדמות מובטחת',
                description: 'התאמה דינמית של תכנית הלימוד האופטימלית עבורך'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card 
                  hoverable
                  style={{
                    background: colors.button.secondary.background,
                    borderRadius: '16px',
                    border: `1px solid ${colors.button.secondary.border}`,
                    boxShadow: '0 4px 6px -1px rgba(148, 163, 184, 0.05)',
                    height: '100%'
                  }}
                >
                  <Space direction="vertical" size="middle" align="center" style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '32px', 
                      color: colors.icon.right,
                      background: '#f0f7ff',
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}>
                      {feature.icon}
                    </div>
                    <Title level={4} style={{ 
                      fontSize: '20px',
                      margin: '0 0 4px 0',
                      color: colors.text.primary
                    }}>
                      {feature.title}
                    </Title>
                    <Text style={{ 
                      fontSize: '24px',
                      color: colors.text.brand,
                      fontWeight: 600,
                      marginBottom: '8px'
                    }}>
                      {feature.value}
                    </Text>
                    <Text style={{ 
                      fontSize: '16px',
                      color: colors.text.secondary,
                      lineHeight: 1.6
                    }}>
                      {feature.description}
                    </Text>
                  </Space>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LandingPage; 
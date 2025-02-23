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
import Footer from '../components/Footer/Footer';

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
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Content Wrapper */}
      <div style={{ flex: '1 0 auto' }}>
        {/* Hero Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
          padding: '48px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '40px'
              }}
            >
              <motion.img
                src="/EZpass_A6_cut.png"
                alt="איזיפס - פשוט להצליח"
                style={{
                  height: '120px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>

            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ textAlign: 'center' }}
            >
              <Title level={1} style={{ 
                fontSize: '64px',
                marginBottom: '32px',
                color: colors.text.primary,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                הדרך להצלחה בבטיחות בבניה
              </Title>
              <Paragraph style={{ 
                fontSize: '24px',
                color: colors.text.secondary,
                maxWidth: '800px',
                margin: '0 auto 40px',
                lineHeight: 1.6
              }}>
                טכנולוגיה חדשנית ושיטות למידה מוכחות לצד ליווי מקצועי לאורך כל הדרך
              </Paragraph>

              <Space size="large" style={{ 
                display: 'flex',
                justifyContent: 'center',
                gap: '24px'
              }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '240px' }}
                >
                  <Button 
                    type="primary"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    style={{
                      width: '100%',
                      height: 'auto',
                      padding: '20px',
                      fontSize: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      borderColor: '#2563eb',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                      borderRadius: '12px',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    className="practice-button"
                  >
                    <ThunderboltOutlined style={{ fontSize: '22px' }} />
                    להתחיל עכשיו
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '240px' }}
                >
                  <Button 
                    size="large"
                    onClick={() => navigate('/safety-courses')}
                    style={{
                      width: '100%',
                      height: 'auto',
                      padding: '20px',
                      fontSize: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      background: '#ffffff',
                      borderColor: '#e5e7eb',
                      color: '#1e293b',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                      borderRadius: '12px',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    className="safety-button"
                  >
                    <SafetyCertificateOutlined style={{ fontSize: '22px' }} />
                    קורסי בטיחות
                  </Button>
                </motion.div>
              </Space>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ 
          padding: '48px 24px',
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
                marginBottom: '40px',
                color: colors.text.primary,
                fontSize: '48px',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                למה איזיפס?
              </Title>
            </motion.div>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px',
              padding: '0 24px'
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
                      background: '#F7F9FC',
                      borderRadius: '16px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(148, 163, 184, 0.05)',
                      height: '100%',
                      transition: 'all 0.3s ease'
                    }}
                    className="feature-card"
                  >
                    <Space direction="vertical" size="large" align="center" style={{ width: '100%', textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '40px', 
                        color: colors.icon.right,
                        background: '#f0f7ff',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
                      }}>
                        {feature.icon}
                      </div>
                      <Title level={4} style={{ 
                        fontSize: '24px',
                        margin: '0 0 8px 0',
                        color: colors.text.primary
                      }}>
                        {feature.title}
                      </Title>
                      <Text style={{ 
                        fontSize: '28px',
                        color: colors.text.brand,
                        fontWeight: 600,
                        marginBottom: '16px'
                      }}>
                        {feature.value}
                      </Text>
                      <Text style={{ 
                        fontSize: '18px',
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
      </div>

      {/* Footer */}
      <Footer />

      <style>{`
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.1);
          border-color: #bfdbfe;
        }
        
        .practice-button {
          position: relative;
          overflow: hidden;
        }
        
        .practice-button::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transform: translateX(-100%);
          transition: none;
          z-index: 2;
        }

        .practice-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(37, 99, 235, 0.25);
          animation: buttonGlow 2s infinite;
        }

        .practice-button:hover::before {
          animation: shine 1.5s infinite;
        }

        .safety-button:hover {
          border-color: #bfdbfe;
          color: #1e40af;
          background: #f8fafc;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) skewX(-15deg);
          }
          50%, 100% {
            transform: translateX(100%) skewX(-15deg);
          }
        }

        @keyframes buttonGlow {
          0% {
            box-shadow: 0 6px 15px rgba(37, 99, 235, 0.25);
          }
          50% {
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4),
                      0 0 0 2px rgba(59, 130, 246, 0.1);
          }
          100% {
            box-shadow: 0 6px 15px rgba(37, 99, 235, 0.25);
          }
        }
      `}</style>
    </motion.div>
  );
};

export default LandingPage; 
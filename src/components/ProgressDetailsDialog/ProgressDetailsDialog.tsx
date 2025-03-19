import React from 'react';
import { Modal, Typography, Space, Divider } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { QuestionType } from '../../types/question';
import { motion } from 'framer-motion';
import { colors } from '../../utils/feedbackStyles';

const { Text, Title } = Typography;

interface ProgressDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: {
    overallProgress: number;
    successRate: number;
    remainingHours: number;
    remainingQuestions: number;
    hoursPracticed: number;
    questionsAnswered: number;
    typeSpecificMetrics: Array<{
      type: QuestionType;
      progress: number;
      successRate: number;
      remainingHours: number;
      remainingQuestions: number;
      questionsAnswered: number;
    }>;
    weeklyNeededHours: number;
    dailyNeededHours: number;
    examDate: number;
  };
}

const ProgressDetailsDialog: React.FC<ProgressDetailsDialogProps> = ({
  isOpen,
  onClose,
  metrics
}) => {
  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    return `${hStr}:${mStr}`;
  };

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  const cardHoverVariants = {
    initial: { 
      scale: 1,
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    },
    hover: { 
      scale: 1.02,
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
    }
  };

  const iconVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.1,
      transition: { 
        duration: 0.2,
        repeat: Infinity,
        repeatType: "mirror" as const
      }
    }
  };

  const springTransition = {
    type: "spring",
    stiffness: 500,
    damping: 25
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return colors.success;
    if (rate >= 55) return colors.warning;
    return colors.error;
  };

  const getSuccessRateBackgroundColor = (rate: number) => {
    if (rate >= 80) return colors.successLight;
    if (rate >= 55) return colors.warningLight;
    return colors.errorLight;
  };

  return (
    <Modal
      title={
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ 
            padding: '16px 0',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Title level={4} style={{ 
            margin: 0, 
            textAlign: 'center', 
            color: '#1e293b',
            fontSize: '24px',
            fontWeight: 600
          }}>
            מצב מוכנות לבחינה
          </Title>
        </motion.div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ direction: 'rtl', background: '#f8fafc' }}
      bodyStyle={{ background: '#f8fafc', padding: '16px' }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* Main Metrics Section */}
        <motion.div 
          variants={itemVariants}
          style={{ 
            background: '#ffffff', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}
        >
          {/* Split explanatory text into two columns */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <Text style={{ 
              fontSize: '14px', 
              color: '#64748b', 
              display: 'block',
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              lineHeight: '1.4'
            }}>
              איזיפס עוקבת אחרי ההתקדמות שלך בכל נושא וסוג שאלה. המדד מבטא את הערכת הציון הצפוי לך במבחן בהתבסס על ההתקדמות שלך עד כה
            </Text>

            <Text style={{ 
              fontSize: '14px', 
              color: '#64748b', 
              display: 'block',
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              lineHeight: '1.4'
            }}>
              הציון שלך מחושב על בסיס הביצועים שלך בכל סוגי השאלות. שמור על ציון גבוה כדי להבטיח הצלחה במבחן
            </Text>
          </div>

          {/* Global Metrics */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          }}>
            {/* Progress */}
            <div style={{ 
              background: '#f0f9ff', 
              borderRadius: '8px', 
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}>
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                transition={springTransition}
              >
                <TrophyOutlined style={{ fontSize: '32px', color: '#3b82f6' }} />
              </motion.div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <Title level={2} style={{ margin: 0, color: '#1e293b' }}>
                  {Math.round(metrics.overallProgress)}/100
                </Title>
                <Text style={{ fontSize: '15px', color: '#0369a1' }}>התקדמות</Text>
              </div>
            </div>

            {/* Score */}
            <div style={{ 
              background: getSuccessRateBackgroundColor(metrics.successRate),
              borderRadius: '8px', 
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}>
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                transition={springTransition}
              >
                <CheckCircleOutlined style={{ 
                  fontSize: '32px', 
                  color: getSuccessRateColor(metrics.successRate)
                }} />
              </motion.div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <Title level={2} style={{ margin: 0, color: getSuccessRateColor(metrics.successRate) }}>
                  {Math.round(metrics.successRate)}
                </Title>
                <Text style={{ fontSize: '15px', color: '#0369a1' }}>ציון</Text>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Time Section */}
        <motion.div 
          variants={itemVariants}
          style={{ 
            background: '#ffffff', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}
        >
          <Text style={{ 
            fontSize: '14px', 
            color: '#64748b', 
            marginBottom: '16px', 
            display: 'block',
            background: '#f8fafc',
            padding: '12px',
            borderRadius: '8px',
            lineHeight: '1.4'
          }}>
            איזיפס משמשת בכל המידע של התירגול שלך עד כה כדי להעריך כמה זמן ידרש לך כדי להיות מוכן למבחן ולהגיע ל 100% התקדמות.
            {' '}ככל שתתקדם יותר ותגיע לשליטה ביותר נושאים, הזמן המוערך ירד, אבל גם הפוך.
            {' '}נצל את המידע הזה כדי לתכנן את הזמן הנדרש להשקיע עד לבחינה הקרבה!
          </Text>

          <div style={{ 
            background: '#f0f9ff', 
            borderRadius: '8px', 
            padding: '32px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            transition: 'all 0.2s ease'
          }}>
            <motion.div
              variants={iconVariants}
              initial="initial"
              whileHover="hover"
              transition={springTransition}
            >
              <ClockCircleOutlined style={{ fontSize: '32px', color: '#3b82f6' }} />
            </motion.div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '800px',
              padding: '0 32px'
            }}>
              {/* Days until exam */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Title level={2} style={{ margin: 0, color: '#1e293b', fontSize: '32px' }}>
                  {Math.ceil((metrics.examDate - Date.now()) / (1000 * 60 * 60 * 24))}
                </Title>
                <Text style={{ fontSize: '15px', color: '#64748b' }}>ימים לבחינה</Text>
              </div>

              {/* Weekly required hours */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Title level={2} style={{ margin: 0, color: '#1e293b', fontSize: '32px' }}>
                  {formatTime(metrics.weeklyNeededHours)}
                </Title>
                <Text style={{ fontSize: '15px', color: '#64748b' }}>שעות לשבוע</Text>
              </div>

              {/* Daily required hours */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Title level={2} style={{ margin: 0, color: '#1e293b', fontSize: '32px' }}>
                  {formatTime(metrics.dailyNeededHours)}
                </Title>
                <Text style={{ fontSize: '15px', color: '#64748b' }}>שעות ליום</Text>
              </div>

              {/* Total remaining hours */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Title level={2} style={{ margin: 0, color: '#1e293b', fontSize: '32px' }}>
                  {formatTime(metrics.remainingHours)}
                </Title>
                <Text style={{ fontSize: '15px', color: '#64748b' }}>סה״כ שעות</Text>
              </div>
            </div>
            
            <Text style={{ fontSize: '16px', color: '#0369a1', marginTop: '8px' }}>זמן תרגול למוכנות למבחן</Text>
          </div>
        </motion.div>

        {/* Question Types Section */}
        <motion.div 
          variants={itemVariants}
          style={{ 
            background: '#ffffff', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}
        >
          {/* Question Types Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            {metrics.typeSpecificMetrics.map((typeMetric, index) => (
              <motion.div 
                key={typeMetric.type}
                variants={cardHoverVariants}
                initial="initial"
                whileHover="hover"
                transition={{ duration: 0.2 }}
                style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <Text strong style={{ fontSize: '16px', color: '#1e293b' }}>
                    {typeMetric.type === QuestionType.MULTIPLE_CHOICE ? 'שאלות סגורות' :
                     typeMetric.type === QuestionType.OPEN ? 'שאלות פתוחות' : 'שאלות חישוביות'}
                  </Text>
                  <QuestionCircleOutlined 
                    style={{ fontSize: '16px', color: '#64748b', cursor: 'pointer' }}
                    title={
                      typeMetric.type === QuestionType.MULTIPLE_CHOICE ? 
                        'שאלות עם 4 אפשרויות בחירה, עליך לבחור את התשובה הנכונה' :
                      typeMetric.type === QuestionType.OPEN ? 
                        'שאלות פתוחות דורשות ממך להסביר ולנמק את התשובה שלך' :
                        'שאלות הדורשות חישובים מתמטיים ופתרון מספרי'
                    }
                  />
                </div>

                {/* Progress */}
                <div style={{ 
                  background: '#f1f5f9',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}>
                  <Text style={{ color: '#64748b', fontSize: '14px' }}>התקדמות</Text>
                  <Text strong style={{ color: typeMetric.questionsAnswered === 0 ? '#64748b' : '#0284c7', fontSize: '16px' }}>
                    {typeMetric.questionsAnswered === 0 ? 'לא התחלת' : `${Math.round(typeMetric.progress)}/100`}
                  </Text>
                </div>

                {/* Success Rate */}
                <div style={{ 
                  background: '#f1f5f9',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}>
                  <Text style={{ color: '#64748b', fontSize: '14px' }}>ציון</Text>
                  <Text strong style={{ 
                    color: typeMetric.questionsAnswered === 0 ? '#64748b' : getSuccessRateColor(typeMetric.successRate),
                    fontSize: '16px'
                  }}>
                    {typeMetric.questionsAnswered === 0 ? 'לא התחלת' : Math.round(typeMetric.successRate)}
                  </Text>
                </div>

                {/* Time Stats */}
                <div style={{ 
                  background: '#f1f5f9',
                  padding: '12px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}>
                  <Text style={{ color: '#64748b', fontSize: '14px' }}>זמן נותר</Text>
                  <Text strong style={{ color: '#1e293b', fontSize: '14px' }}>
                    {formatTime(typeMetric.remainingHours)}
                  </Text>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Space>
    </Modal>
  );
};

export default ProgressDetailsDialog; 
// Main dashboard for exam selection and practice
// Contains exam cards and development tools in development mode

import React, { useState, useEffect } from 'react';
import { Typography, Card, Spin, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HardHat,
  GraduationCap,
  Books,
  ArrowLeft
} from "@phosphor-icons/react";
import Footer from '../components/Footer/Footer';
import { ExamType, type ExamTemplate } from '../types/examTemplate';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { examService } from '../services/examService';
import { MinimalHeader } from '../components/layout/MinimalHeader';

const { Title, Text } = Typography;

type ExamTypeKey = 'safety' | 'mahat' | 'bagrut';

const ExamDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { startPrep } = useStudentPrep();
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [examsByType, setExamsByType] = useState<Record<ExamTypeKey, ExamTemplate[]>>({
    safety: [],
    mahat: [],
    bagrut: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ExamDashboard mounted');
    const loadExams = async () => {
      try {
        console.log('Starting to load exams...');
        setLoading(true);
        const [safetyExams, mahatExams, bagrutExams] = await Promise.all([
          examService.getExamsByType(ExamType.GOVERNMENT_EXAM),
          examService.getExamsByType(ExamType.MAHAT_EXAM),
          examService.getExamsByType(ExamType.BAGRUT_EXAM)
        ]);

        console.log('Loaded exams:', {
          safety: safetyExams.length,
          mahat: mahatExams.length,
          bagrut: bagrutExams.length
        });

        // Manually add safety-related exams to safety section
        const safetyRelatedIds = ['mahat_civil_safety', 'construction_manager_certification', 'construction_manager_safety_full', 'renovation_contractor_131'];
        const allSafetyExams = [...safetyExams];
        
        // Add any matching exams from mahat section
        mahatExams.forEach((exam: ExamTemplate) => {
          if (safetyRelatedIds.includes(exam.id)) {
            allSafetyExams.push(exam);
          }
        });

        setExamsByType({
          safety: allSafetyExams,
          mahat: mahatExams,
          bagrut: bagrutExams
        });
      } catch (error) {
        console.error('Error loading exams:', error);
        setError(error instanceof Error ? error.message : 'Failed to load exams');
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  // Add loading and error UI
  if (loading) {
    return (
      <>
        <MinimalHeader />
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          paddingTop: '64px' // Account for header height
        }}>
          <Spin size="large" />
          <Text>טוען בחינות...</Text>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <MinimalHeader />
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingTop: '64px' // Account for header height
        }}>
          <Alert
            message="שגיאה בטעינת הבחינות"
            description={error}
            type="error"
            showIcon
          />
        </div>
      </>
    );
  }

  const examTypes = [
    {
      id: 'safety' as const,
      title: 'בטיחות',
      icon: <HardHat weight="duotone" />,
      color: '#3b82f6',
      description: 'מנהל עבודה, ממונה בטיחות, קבלן שיפוצים'
    },
    {
      id: 'mahat' as const,
      title: 'מה״ט',
      icon: <GraduationCap weight="duotone" />,
      color: '#10b981',
      description: 'הנדסת תוכנה, הנדסה אזרחית'
    },
    {
      id: 'bagrut' as const,
      title: 'בגרות',
      icon: <Books weight="duotone" />,
      color: '#6366f1',
      description: 'מתמטיקה, פיזיקה, מחשבים'
    }
  ] as const;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MinimalHeader />
      {/* Header */}
      <div style={{ padding: '40px 24px', background: '#ffffff', borderBottom: '1px solid #e5e7eb', marginTop: '64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <img
              src="/EZpass_A6_cut.png"
              alt="איזיפס"
              style={{ height: '64px' }}
            />
            <div style={{
              width: '2px',
              height: '40px',
              background: '#e5e7eb'
            }} />
            <Text style={{ 
              fontSize: '28px', 
              color: '#ff9800',
              fontWeight: 400,
              margin: 0
            }}>
              פשוט להצליח
            </Text>
          </div>
          <Title level={2} style={{ fontSize: '48px', margin: 0 }}>
            בחר בחינה והתחל לתרגל עכשיו.
          </Title>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        padding: '48px 24px', 
        background: 'linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)',
        position: 'relative',
        minHeight: 'calc(100vh - 400px)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 350px)',
          justifyContent: 'center',
          gap: '32px',
          padding: '24px',
          position: 'relative',
          minHeight: '600px'
        }}>
          <AnimatePresence>
            {examTypes.map((type, index) => (
              <motion.div 
                key={type.id}
                layout
                style={{
                  perspective: '2000px',
                  width: '350px',
                  position: 'relative',
                  gridColumn: flippedCard === type.id ? '1 / -1' : 'auto',
                  gridRow: flippedCard === type.id ? '1' : 'auto',
                  justifySelf: flippedCard === type.id ? 'center' : 'auto',
                  alignSelf: flippedCard === type.id ? 'start' : 'auto'
                }}
                animate={{ 
                  opacity: flippedCard ? (flippedCard === type.id ? 1 : 0) : 1,
                  y: flippedCard ? (
                    flippedCard === type.id ? 0 : 100
                  ) : 0,
                  scale: 1,
                  zIndex: flippedCard === type.id ? 10 : 1
                }}
                transition={{ 
                  layout: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
                  opacity: { duration: 0.3 },
                  y: { 
                    duration: 0.5,
                    ease: [0.4, 0, 0.2, 1],
                    delay: flippedCard === type.id ? 0 : index * 0.1
                  }
                }}
              >
                <motion.div
                  initial={false}
                  animate={{ 
                    rotateY: flippedCard === type.id ? 180 : 0,
                    height: flippedCard === type.id ? 'auto' : 500
                  }}
                  transition={{ 
                    rotateY: {
                      duration: 0.8,
                      type: "spring",
                      stiffness: 60,
                      damping: 15,
                      delay: flippedCard === type.id ? 0.3 : 0
                    },
                    height: {
                      duration: 0.5,
                      ease: [0.4, 0, 0.2, 1],
                      delay: 1.1
                    }
                  }}
                  style={{
                    width: '350px',
                    minHeight: '500px',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    cursor: 'pointer'
                  }}
                >
                  {/* Front of Card */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      width: '350px',
                      height: flippedCard === type.id ? '100%' : '500px',
                      backfaceVisibility: 'hidden',
                      backgroundColor: '#ffffff',
                      borderRadius: '24px',
                      border: '1px solid #e5e7eb',
                      padding: '48px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '32px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      WebkitBackfaceVisibility: 'hidden',
                      transformOrigin: 'center',
                      transformStyle: 'preserve-3d'
                    }}
                    onClick={() => setFlippedCard(type.id)}
                    whileHover={!flippedCard ? { y: -8 } : {}}
                  >
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '28px',
                      background: `${type.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '72px',
                      color: type.color
                    }}>
                      {type.icon}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={2} style={{ 
                        margin: 0,
                        marginBottom: '12px',
                        fontSize: '32px',
                        color: type.color,
                        fontWeight: 600
                      }}>
                        {type.title}
                      </Title>
                      <Text style={{ 
                        fontSize: '16px',
                        color: '#64748b',
                        display: 'block',
                        lineHeight: '1.5',
                        maxWidth: '280px',
                        margin: '0 auto'
                      }}>
                        {type.description}
                      </Text>
                    </div>
                  </motion.div>

                  {/* Back of Card */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      width: '350px',
                      height: flippedCard === type.id ? '100%' : '500px',
                      backfaceVisibility: 'hidden',
                      backgroundColor: '#ffffff',
                      borderRadius: '24px',
                      border: '1px solid #e5e7eb',
                      padding: '24px 20px',
                      transform: 'rotateY(180deg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      WebkitBackfaceVisibility: 'hidden',
                      transformOrigin: 'center',
                      transformStyle: 'preserve-3d',
                      overflow: 'auto'
                    }}
                  >
                    <motion.div
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlippedCard(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        width: 'fit-content',
                        marginBottom: '8px'
                      }}
                      whileHover={{ x: -5 }}
                    >
                      <ArrowLeft weight="bold" size={20} />
                      <Text style={{ fontSize: '14px' }}>חזרה</Text>
                    </motion.div>

                    {examsByType[type.id]?.map((exam: ExamTemplate, index: number) => (
                      <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            setError(null);
                            // Create new prep first
                            const prepId = await startPrep(exam);
                            // Then navigate to practice page
                            navigate(`/practice/${prepId}`, { replace: true });
                          } catch (error) {
                            console.error('Failed to navigate to practice:', error);
                            setError(error instanceof Error ? error.message : 'Failed to navigate to practice');
                          }
                        }}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                        whileHover={{
                          backgroundColor: '#f8fafc',
                          scale: 1.02,
                          borderColor: type.color,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <Text strong style={{ 
                          fontSize: '16px', 
                          color: type.color,
                          flex: 1,
                          minWidth: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {exam.names.short}
                        </Text>
                        <ArrowLeft weight="bold" style={{ 
                          color: type.color,
                          flexShrink: 0,
                          fontSize: '16px'
                        }} />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Footer />

      {error && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          zIndex: 1000
        }}>
          <Alert message={error} type="error" showIcon />
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default ExamDashboard; 
import React from 'react';
import { Typography } from 'antd';
import { motion } from 'framer-motion';
import './QuestionSetProgress.css';

const { Text } = Typography;

interface QuestionSetProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  dailyQuestions?: {
    completed: number;
    goal: number;
  };
  dailyTime?: {
    completed: number;
    goal: number;
  };
}

const QuestionSetProgress: React.FC<QuestionSetProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  dailyQuestions,
  dailyTime
}) => {
  // Adjust for 0-based index
  const displayIndex = currentQuestionIndex;
  
  return (
    <div className="question-set-progress">
      <div className="progress-header">
        <Text className="progress-text">שאלה {displayIndex} מתוך {totalQuestions}</Text>
        
        {/* Daily Progress Bars */}
        {(dailyQuestions || dailyTime) && (
          <div className="daily-progress">
            {dailyQuestions && (
              <div className="daily-metric">
                <div className="daily-metric-header">
                  <Text className="daily-label">שאלות היום</Text>
                  <Text className="daily-value">{dailyQuestions.completed}/{dailyQuestions.goal}</Text>
                </div>
                <div className="daily-bar-container">
                  <motion.div 
                    className="daily-bar questions"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.min((dailyQuestions.completed / dailyQuestions.goal) * 100, 100)}%`
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {dailyTime && (
              <div className="daily-metric">
                <div className="daily-metric-header">
                  <Text className="daily-label">דקות היום</Text>
                  <Text className="daily-value">{dailyTime.completed}/{dailyTime.goal}</Text>
                </div>
                <div className="daily-bar-container">
                  <motion.div 
                    className="daily-bar time"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.min((dailyTime.completed / dailyTime.goal) * 100, 100)}%`
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="progress-bar-container">
        <div className="progress-segments">
          {Array.from({ length: totalQuestions }).map((_, index) => (
            <motion.div
              key={index}
              className={`progress-segment ${index < displayIndex - 1 ? 'completed' : ''} ${index === displayIndex - 1 ? 'current' : ''}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export { QuestionSetProgress }; 
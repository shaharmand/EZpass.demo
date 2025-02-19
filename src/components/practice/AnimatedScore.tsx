import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface AnimatedScoreProps {
  score: number;
  style?: React.CSSProperties;
}

const AnimatedScore: React.FC<AnimatedScoreProps> = ({ score, style }) => {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 20;
    const increment = score / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [score]);

  return (
    <Text style={{ 
      fontSize: '24px',
      fontWeight: 700,
      transition: 'color 0.3s ease',
      ...style
    }}>
      {displayScore}
    </Text>
  );
};

export default AnimatedScore; 
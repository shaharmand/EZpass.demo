import React from 'react';
import { Tag } from 'antd';
import styled from 'styled-components';
import { colors } from '../../utils/feedbackStyles';

export const StyledTag = styled(Tag)<{ $type: 'subscription' | 'role'; color?: string }>`
  border-radius: 12px;
  padding: 2px 12px;
  font-size: 12px;
  font-weight: 500;
  margin: 0;
  height: 24px;
  line-height: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  direction: rtl;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  ${props => props.$type === 'subscription' && `
    background: ${props.color === 'gold' ? 'linear-gradient(135deg, #fef9c3 0%, #fde047 100%)' : 
                props.color === 'purple' ? 'linear-gradient(135deg, #f3e8ff 0%, #d8b4fe 100%)' : 
                'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%)'};
    border: none;
    color: ${props.color === 'gold' ? '#854d0e' : 
            props.color === 'purple' ? '#6b21a8' : 
            '#0369a1'};
    font-weight: 600;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `}

  ${props => props.$type === 'role' && `
    background: #f0f7ff;
    border-color: #93c5fd;
    color: #1e40af;
  `}
`; 
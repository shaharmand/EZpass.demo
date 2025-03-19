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
    background: ${
      props.color === 'orange' 
        ? 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)' : 
      props.color === 'blue' 
        ? 'linear-gradient(135deg, #3182f6 0%, #2563eb 100%)' : 
      props.color === 'gray'
        ? 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)'
        : 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 100%)'
    };
    border: none;
    color: ${
      props.color === 'orange' 
        ? '#ffffff' : 
      props.color === 'blue' 
        ? '#ffffff' : 
      props.color === 'gray'
        ? '#475569'
        : '#0369a1'
    };
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
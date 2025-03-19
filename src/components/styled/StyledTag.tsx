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
        ? '#f1f5f9' : 
      props.color === 'gray'
        ? '#f1f5f9'
        : '#f1f5f9'
    };
    border: ${
      props.color === 'orange'
        ? 'none'
        : '1px solid #e2e8f0'
    };
    color: ${
      props.color === 'orange' 
        ? '#ffffff' : 
      props.color === 'blue' 
        ? '#64748b' : 
      props.color === 'gray'
        ? '#64748b'
        : '#64748b'
    };
    font-weight: ${
      props.color === 'orange'
        ? '600'
        : '500'
    };
    
    &:hover {
      transform: ${
        props.color === 'orange'
          ? 'translateY(-1px)'
          : 'none'
      };
      box-shadow: ${
        props.color === 'orange'
          ? '0 2px 4px rgba(0, 0, 0, 0.1)'
          : '0 1px 2px rgba(0, 0, 0, 0.05)'
      };
    }
  `}

  ${props => props.$type === 'role' && `
    background: #f0f7ff;
    border-color: #93c5fd;
    color: #1e40af;
  `}
`; 
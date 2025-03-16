import styled from 'styled-components';

// Shared SectionTitle component that can be used across the application
const SectionTitle = styled.h3<{ noLine?: boolean }>`
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  text-align: right;
  padding: 0;
  border-right: none;
  line-height: 1.4;
`;

export default SectionTitle; 
import styled from 'styled-components';
import { Card, Progress, Modal } from 'antd';

export const CourseContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  position: relative;
`;

export const CourseHeader = styled.div`
  margin-bottom: 32px;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

export const CourseTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 16px 0;
`;

export const CourseMeta = styled.div`
  display: flex;
  gap: 24px;
  color: #8c8c8c;
  font-size: 15px;

  span {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

export const TopicsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
  margin-bottom: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const TopicCard = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const TopicHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
`;

export const TopicIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #e6f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1890ff;
  font-size: 24px;
`;

export const TopicContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TopicTitleWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
`;

export const TopicTitle = styled.h2`
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  line-height: 1.4;
  flex: 1;
  white-space: normal;
  word-wrap: break-word;
`;

export const TopicStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #8c8c8c;
  font-size: 14px;
  align-items: flex-end;

  span {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
`;

export const LessonList = styled.div`
  padding: 16px;
`;

export const LessonItem = styled.div`
  padding: 20px;
  border-radius: 12px;
  background: white;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &:hover {
    background: white;
    border-color: #1890ff;
    transform: translateX(4px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

export const LessonCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const LessonProgress = styled(Progress)`
  &.ant-progress {
    line-height: 1;
    
    .ant-progress-bg {
      height: 6px !important;
    }
  }
`;

export const Badge = styled.span<{ color?: string }>`
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  background-color: ${props => props.color || '#e6f7ff'};
  color: ${props => props.color ? 'white' : '#1890ff'};
`;

export const LessonHeader = styled.div<{ hasDescription?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.hasDescription ? '12px' : '0'};
`;

export const LessonInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
  min-width: 0;
`;

export const LessonNumber = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
`;

export const LessonTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
  flex: 1;
  line-height: 1.5;
  padding-right: 16px;
  white-space: normal;
  word-wrap: break-word;
`;

export const LessonMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  color: #8c8c8c;
  font-size: 14px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;

  span {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

export const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
`;

export const VideoCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const ThumbnailContainer = styled.div`
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: #f0f0f0;
  overflow: hidden;
`;

export const Thumbnail = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const PlayOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;

  svg {
    font-size: 48px;
    color: white;
  }

  ${VideoCard}:hover & {
    opacity: 1;
  }
`;

export const VideoInfo = styled.div`
  padding: 16px;
`;

export const VideoTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 500;
  color: #262626;
`;

export const VideoMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #8c8c8c;
  font-size: 13px;
`;

export const FloatingProgress = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
`;

export const BackToTop = styled.div`
  position: fixed;
  bottom: 24px;
  left: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  z-index: 1000;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`;

export const NavigationBreadcrumb = styled.div`
  margin-bottom: 24px;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;

  a {
    color: #1890ff;
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: #40a9ff;
    }
  }

  span {
    color: #8c8c8c;
  }
`;

export const TopicSection = styled.div`
  margin-bottom: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const LessonsContainer = styled.div<{ $isExpanded: boolean }>`
  padding: ${props => props.$isExpanded ? '20px' : '0'};
  max-height: ${props => props.$isExpanded ? 'none' : '0'};
  overflow: ${props => props.$isExpanded ? 'visible' : 'hidden'};
  transition: all 0.3s ease-in-out;
  background: #fafafa;
  border-radius: 0 0 16px 16px;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 4px;
    
    &:hover {
      background: #bfbfbf;
    }
  }
`;

export const VideoSegmentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  max-height: 300px;
  overflow-y: auto;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 4px;
    
    &:hover {
      background: #bfbfbf;
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const VideoSegmentCard = styled.div`
  background: white;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  min-height: 40px;

  &:hover {
    transform: translateX(4px);
    border-color: #1890ff;
    background: #f0f7ff;
  }
`;

export const SegmentNumber = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e6f7ff;
  color: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
`;

export const SegmentInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  gap: 8px;
`;

export const SegmentTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.3;
  white-space: normal;
  flex: 1;
`;

export const VideoPreviewThumbnail = styled.div`
  width: 120px;
  height: 68px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background: #f0f0f0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const VideoPreviewInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const VideoPreviewTitle = styled.h5`
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

export const VideoPreviewMeta = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const VideoPreviewModal = styled(Modal)`
  .ant-modal-content {
    background: #000;
  }
  
  .ant-modal-close {
    color: #fff;
  }
`;

export const VideoPreviewOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const VideoActions = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  
  .anticon {
    font-size: 16px;
    cursor: pointer;
    color: #666;
    padding: 4px;
    border-radius: 4px;
    background: #f5f5f5;
    transition: all 0.2s ease;
    
    &:hover {
      color: #1890ff;
      background: #e6f7ff;
    }
  }
`; 
import React, { useState } from 'react';
import styled from 'styled-components';
import { Tabs, List, Typography, Collapse } from 'antd';
import { VideoPlayer } from '../layout/MinimalHeader';

const { TabPane } = Tabs;
const { Title } = Typography;
const { Panel } = Collapse;

const ViewContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const VideoContainer = styled.div`
  margin-bottom: 24px;
`;

const LessonTitle = styled(Title)`
  margin-bottom: 8px !important;
`;

interface Video {
  id: string;
  title: string;
  youtubeId: string;
  courseNumber: string; // e.g., "1.2" where 1 is lesson and 2 is segment
  subTopicId: string;
}

interface VideoListProps {
  videos: Video[];
  subTopicTitles: Record<string, string>;
}

export const VideoList: React.FC<VideoListProps> = ({ videos, subTopicTitles }) => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Group videos by lesson number
  const videosByLesson = videos.reduce((acc, video) => {
    const lessonNumber = video.courseNumber.split('.')[0];
    if (!acc[lessonNumber]) {
      acc[lessonNumber] = [];
    }
    acc[lessonNumber].push(video);
    return acc;
  }, {} as Record<string, Video[]>);

  // Group videos by SubTopic
  const videosBySubTopic = videos.reduce((acc, video) => {
    if (!acc[video.subTopicId]) {
      acc[video.subTopicId] = [];
    }
    acc[video.subTopicId].push(video);
    return acc;
  }, {} as Record<string, Video[]>);

  // Sort videos by their segment number within a lesson
  const sortVideoSegments = (videos: Video[]) => {
    return [...videos].sort((a, b) => {
      const aSegment = Number(a.courseNumber.split('.')[1]);
      const bSegment = Number(b.courseNumber.split('.')[1]);
      return aSegment - bSegment;
    });
  };

  return (
    <ViewContainer>
      {selectedVideo && (
        <VideoContainer>
          <VideoPlayer youtubeId={selectedVideo.youtubeId} title={selectedVideo.title} />
        </VideoContainer>
      )}

      <Tabs defaultActiveKey="course">
        <TabPane tab="קורס מלא" key="course">
          <Title level={3}>שיעורי הקורס</Title>
          <Collapse>
            {Object.entries(videosByLesson)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([lessonNumber, lessonVideos]) => (
                <Panel 
                  key={lessonNumber}
                  header={`שיעור ${lessonNumber}`}
                >
                  <List
                    dataSource={sortVideoSegments(lessonVideos)}
                    renderItem={(video) => (
                      <List.Item 
                        onClick={() => setSelectedVideo(video)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Typography.Text>
                          {video.courseNumber} - {video.title}
                        </Typography.Text>
                      </List.Item>
                    )}
                  />
                </Panel>
              ))}
          </Collapse>
        </TabPane>

        <TabPane tab="לפי נושא" key="topics">
          <Collapse>
            {Object.entries(videosBySubTopic).map(([subTopicId, topicVideos]) => (
              <Panel 
                key={subTopicId}
                header={subTopicTitles[subTopicId]}
              >
                <List
                  dataSource={sortVideoSegments(topicVideos)}
                  renderItem={(video) => (
                    <List.Item 
                      onClick={() => setSelectedVideo(video)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Typography.Text>
                        שיעור {video.courseNumber} - {video.title}
                      </Typography.Text>
                    </List.Item>
                  )}
                />
              </Panel>
            ))}
          </Collapse>
        </TabPane>
      </Tabs>
    </ViewContainer>
  );
}; 
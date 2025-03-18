import React from 'react';
import { RouteObject, Outlet, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { message } from 'antd';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../pages/admin/Dashboard';
import { QuestionLibraryPage } from '../pages/admin/questions/QuestionLibraryPage';
import { QuestionEditPage } from '../pages/admin/questions/QuestionEditPage';
import { QuestionImport } from '../pages/admin/questions/import';
import { QuestionGenerator } from '../pages/admin/questions/generate';
import { QuestionCreatePage } from '../pages/admin/questions/QuestionCreatePage';
import { DatabaseQuestion } from '../types/question';
import { questionStorage } from '../services/admin/questionStorage';
import { questionLibrary } from '../services/questionLibrary';
import { useSearchResults } from '../contexts/SearchResultsContext';
import { VideoLibraryPage } from '../pages/admin/videos/VideoLibraryPage';
import { VideoCreatePage } from '../pages/admin/videos/VideoCreatePage';
import { VideoEditPage } from '../pages/admin/videos/VideoEditPage';
import VideoPage from '../components/courses/VideoPage';
import { VideoData, LessonInfo } from '../components/courses/types';
import { AdminRoute } from '../components/Auth/AdminRoute';

// Wrapper component to handle loading question data and state management
const QuestionEditPageWrapper: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<DatabaseQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const { setSearchResults, searchResults } = useSearchResults();

  console.log('[QuestionEditPageWrapper] Component mounted, id:', id);

  // Load the question list only once when component mounts
  useEffect(() => {
    const loadQuestionList = async () => {
      if (searchResults) {
        console.log('[QuestionEditPageWrapper] Using existing question list:', searchResults.length);
        return;
      }
      
      try {
        console.log('[QuestionEditPageWrapper] Loading initial question list...');
        setLoadingLibrary(true);
        
        // First ensure we have a current list in questionLibrary
        await questionLibrary.updateCurrentList({});
        
        // Get the full list of questions for navigation
        const questions = await questionStorage.getFilteredQuestions({});
        setSearchResults(questions);
        
        console.log('[QuestionEditPageWrapper] Library list loaded, total questions:', questions.length);
      } catch (error) {
        console.error('[QuestionEditPageWrapper] Failed to load question list:', error);
        message.error('Failed to load question list');
      } finally {
        setLoadingLibrary(false);
      }
    };

    loadQuestionList();
  }, [setSearchResults, searchResults]);

  // Load specific question when ID changes
  useEffect(() => {
    const loadQuestion = async () => {
      if (!id) return;
      
      try {
        console.log('[QuestionEditPageWrapper] Loading question:', id);
        setLoading(true);
        
        const questionData = await questionStorage.getQuestion(id);
        console.log('[QuestionEditPageWrapper] Question loaded:', questionData?.id);
        
        if (questionData) {
          setQuestion(questionData);
        } else {
          console.log('[QuestionEditPageWrapper] Question not found');
          message.error('Question not found');
          navigate('/admin/questions');
        }
      } catch (error) {
        console.error('[QuestionEditPageWrapper] Failed to load question:', error);
        message.error('Failed to load question');
        navigate('/admin/questions');
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [id, navigate]);

  const handleCancel = () => {
    navigate('/admin/questions');
  };

  if (loading || !question) {
    console.log('[QuestionEditPageWrapper] Still loading:', { loading, hasQuestion: !!question });
    return <div>Loading question...</div>;
  }

  console.log('[QuestionEditPageWrapper] Rendering QuestionEditPage');
  return (
    <>
      {loadingLibrary && (
        <div style={{ 
          position: 'fixed', 
          top: '16px', 
          right: '16px', 
          padding: '8px 16px',
          background: '#1677ff',
          color: 'white',
          borderRadius: '4px',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          Loading question list...
        </div>
      )}
      <QuestionEditPage
        question={question}
        onCancel={handleCancel}
      />
    </>
  );
};

const VideoPageWrapper: React.FC = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [lesson, setLesson] = useState<LessonInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideoData = async () => {
      if (!videoId) return;
      
      try {
        setLoading(true);
        
        // Load video data from the JSON file
        const response = await fetch('/data/course/CIV-SAF/content/video_data.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch video data: ${response.statusText}`);
        }
        
        const data = await response.json();
        const videos: VideoData[] = Array.isArray(data) ? data : data.videos || [];
        
        const foundVideo = videos.find(v => v.vimeoId === videoId);
        
        if (!foundVideo) {
          message.error('Video not found');
          navigate('/admin/videos');
          return;
        }
        
        setVideo(foundVideo);
        
        // Load lesson info
        const lessonResponse = await fetch('/data/course/CIV-SAF/content/lesson_info.json');
        if (!lessonResponse.ok) {
          throw new Error(`Failed to fetch lesson info: ${lessonResponse.statusText}`);
        }
        
        const lessonData = await lessonResponse.json();
        const lessonInfo: LessonInfo[] = Array.isArray(lessonData) ? lessonData : lessonData.lessons || [];
        
        const foundLesson = lessonInfo.find(l => l.id === foundVideo.lessonNumber);
        
        if (!foundLesson) {
          message.error('Lesson information not found');
          navigate('/admin/videos');
          return;
        }
        
        setLesson(foundLesson);
      } catch (error) {
        console.error('Failed to load video data:', error);
        message.error('Failed to load video data');
        navigate('/admin/videos');
      } finally {
        setLoading(false);
      }
    };

    loadVideoData();
  }, [videoId, navigate]);

  if (loading || !video || !lesson) {
    return <div>Loading video...</div>;
  }

  // Navigate to the video page with state
  navigate(`/admin/videos/${videoId}`, {
    state: {
      video,
      lesson,
      topicTitle: "קורס בטיחות בעבודה",
      returnPath: '/admin/videos'
    },
    replace: true
  });

  return null;
};

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: (
    <AdminRoute>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminRoute>
  ),
  children: [
    {
      index: true,
      element: <AdminDashboard />,
    },
    {
      path: 'questions',
      children: [
        {
          index: true,
          element: <QuestionLibraryPage />,
        },
        {
          path: 'new',
          element: <QuestionCreatePage />,
        },
        {
          path: ':id',
          element: <QuestionEditPageWrapper />,
        },
        {
          path: 'import',
          element: <QuestionImport />,
        },
        {
          path: 'generate',
          element: <QuestionGenerator />,
        }
      ],
    },
    {
      path: 'videos',
      children: [
        {
          index: true,
          element: <VideoLibraryPage />,
        },
        {
          path: 'new',
          element: <VideoCreatePage />,
        },
        {
          path: ':videoId',
          element: <VideoPageWrapper />,
        },
        {
          path: ':videoId/edit',
          element: <VideoEditPage />,
        }
      ],
    },
    {
      path: 'courses',
      children: [
        {
          path: 'safety',
          children: [
            {
              path: 'video/:videoId',
              element: <VideoPageWrapper />,
            }
          ]
        }
      ]
    }
  ],
}; 
import type { BagrutExams, MahatExams } from '../types/exam';

const BASE_PATH = '/data';

export const examService = {
  async getBagrutExams(): Promise<BagrutExams> {
    const response = await fetch(`${BASE_PATH}/exams/bagrut_cs.json`);
    if (!response.ok) {
      throw new Error('Failed to load Bagrut exams');
    }
    return response.json();
  },

  async getMahatExams(): Promise<MahatExams> {
    const response = await fetch(`${BASE_PATH}/exams/mahat_cs.json`);
    if (!response.ok) {
      throw new Error('Failed to load Mahat exams');
    }
    return response.json();
  },

  async getSubjectData(subjectId: string): Promise<any> {
    const response = await fetch(`${BASE_PATH}/subjects/${subjectId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load subject data for ${subjectId}`);
    }
    return response.json();
  }
};

// Helper function to load all required data for an exam
export const loadExamData = async (examId: string) => {
  try {
    // First determine if it's a Bagrut or Mahat exam
    const [institution] = examId.split('_');
    
    // Load the appropriate exam list
    const exams = institution === 'bagrut' 
      ? await examService.getBagrutExams()
      : await examService.getMahatExams();
    
    // Find the specific exam
    const exam = institution === 'bagrut'
      ? exams.exams.find(e => e.id === examId)
      : exams.exams.find(e => e.id === examId);

    if (!exam) {
      throw new Error(`Exam ${examId} not found`);
    }

    // Load all subject data for the exam's topics
    const subjectData = await Promise.all(
      exam.topics.map(topic => 
        examService.getSubjectData(topic.topicId.split('_')[0])
      )
    );

    return {
      exam,
      subjects: subjectData
    };
  } catch (error) {
    console.error('Failed to load exam data:', error);
    throw error;
  }
}; 
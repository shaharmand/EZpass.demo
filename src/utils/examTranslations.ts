import { examService } from '../services/examService';

// Add exam template translations
const examTemplateTranslations: Record<string, string> = {
  'mahat_civil_safety': 'מה"ט - הנדסה אזרחית - בטיחות',
  'mahat_civil_construction': 'מה"ט - הנדסה אזרחית - בנייה',
  'mahat_civil_management': 'מה"ט - הנדסה אזרחית - ניהול',
};

// Helper function to get exam template name
export const getExamTemplateName = async (examTemplateId: string): Promise<string> => {
  try {
    const template = await examService.getExamById(examTemplateId);
    return template?.names.medium || examTemplateId;
  } catch (error) {
    console.warn(`Failed to get exam template name for ${examTemplateId}:`, error);
    return examTemplateId;
  }
};

// Season translations
const seasonTranslations: Record<string, string> = {
  'spring': 'אביב',
  'summer': 'קיץ',
  'winter': 'חורף'
};

// Moed translations
const moedTranslations: Record<string, string> = {
  'a': 'א׳',
  'b': 'ב׳',
  'c': 'ג׳'
};

// Helper function to get exam source display text
export const getExamSourceDisplayText = (source: {
  examTemplateId: string;
  year: string;
  season: string;
  moed: string;
  order: string;
}): string => {
  const template = examTemplateTranslations[source.examTemplateId] || source.examTemplateId;
  const season = seasonTranslations[source.season] || source.season;
  const moed = moedTranslations[source.moed] || source.moed;
  
  return `${template}, ${source.year}, ${season} ${moed}, שאלה ${source.order}`;
}; 
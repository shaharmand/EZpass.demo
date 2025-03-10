import { examService } from '../services/examService';
import { enumMappings } from './translations';

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

// Season translations - use the same translations as in translations.ts
const seasonTranslations = enumMappings.period;

// Moed translations - use the same translations as in translations.ts
const moedTranslations = enumMappings.moed;

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
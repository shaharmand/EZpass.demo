import { ExamTemplate } from '../types/examTemplate';

class ExamTemplatesService {
  private templates: Map<string, ExamTemplate> = new Map();

  constructor() {
    // Initialize with exam templates
    // This would typically load from a JSON file or API
    // For now we'll initialize empty and load later
  }

  getTemplateSafe(templateId: string): ExamTemplate | null {
    return this.templates.get(templateId) || null;
  }

  // Add template(s) - useful for testing and initialization
  addTemplate(template: ExamTemplate) {
    this.templates.set(template.id, template);
  }

  addTemplates(templates: ExamTemplate[]) {
    templates.forEach(template => this.templates.set(template.id, template));
  }
}

export const examTemplates = new ExamTemplatesService(); 
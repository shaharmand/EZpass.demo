import { logger } from '../utils/logger';
import { Subject } from '../types/subject';

class SubjectService {
  private subjects: Subject[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // ... existing code ...

    // Log the initialization summary
    logger.info(`Initialized SubjectService with ${this.subjects.length} subjects`);

    // Log detailed subject and domain information
    this.subjects.forEach(subject => {
      const domainNames = subject.domains.map(d => d.name).join(', ');
      logger.info(`Subject ${subject.name}: ${domainNames}`);
    });
    // ... existing code ...
  }

  // Add other methods as needed
}

// Export a singleton instance
export const subjectService = new SubjectService(); 
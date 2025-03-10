import { universalTopics, universalTopicsV2 } from '../services/universalTopics';
import { questionStorage } from '../services/admin/questionStorage';
import { Domain } from '../types/subject';

// Add counter at the top of the file after imports
let fakeIdCounter = 1;

/**
 * Validates the basic format of a question ID
 * Expected format: XXX-YYY-NNNNNN where:
 * - XXX is a 3-letter subject code that exists in our system
 * - YYY is a 3-letter domain code that exists in our system
 * - NNNNNN is a 6-digit number
 */
export function validateQuestionIdFormat(id: string): boolean {
  // Basic format check: subject-domain-number
  const pattern = /^[A-Z]{3}-[A-Z]{3}-\d{6}$/;
  if (!pattern.test(id)) {
    return false;
  }

  // Split into parts
  const [subjectCode, domainCode, number] = id.split('-');

  // Validate each part
  if (subjectCode.length !== 3 || domainCode.length !== 3) {
    return false;
  }

  // Validate number is 6 digits
  if (number.length !== 6 || isNaN(parseInt(number, 10))) {
    return false;
  }

  // Check if subject code exists in our system
  let foundSubject = false;
  let foundDomain = false;

  // Check if subject code exists by searching through all subjects
  for (const subject of universalTopics.getAllSubjects()) {
    if (subject.code === subjectCode) {
      foundSubject = true;
      // Check if domain exists under this subject
      const domain = subject.domains.find(d => d.code === domainCode);
      if (domain) {
        foundDomain = true;
      }
      break;
    }
  }

  return foundSubject && foundDomain;
}

/**
 * Validates that the codes in the question ID match the provided subject and domain IDs
 * This ensures the ID is consistent with the actual subject/domain it belongs to
 */
export function validateQuestionId(id: string, subjectId: string, domainId: string): boolean {
  // First validate basic format
  if (!validateQuestionIdFormat(id)) {
    return false;
  }

  // Split into parts
  const [subjectCode, domainCode] = id.split('-');

  // Get the actual codes for the subject and domain
  const actualSubjectCode = universalTopicsV2.getSubjectCode(subjectId);
  const actualDomainCode = universalTopicsV2.getDomainCode(domainId);

  // Compare codes
  if (subjectCode !== actualSubjectCode || domainCode !== actualDomainCode) {
    return false;
  }

  return true;
}

/**
 * Generates a fake question ID for dry runs in the format XXX-YYY-99NNNN
 * where XXX is the 3-letter subject code, YYY is the 3-letter domain code,
 * and 99NNNN is a number starting with 99 followed by 4 sequential digits
 */
export function generateFakeQuestionId(subjectId: string, domainId: string): string {
    // Validate that the domain belongs to the subject
    if (!universalTopicsV2.getDomainSafe(subjectId, domainId)) {
        throw new Error(`Domain ${domainId} does not belong to subject ${subjectId}`);
    }

    // Get and validate the 3-letter codes
    const subjectCode = universalTopicsV2.getSubjectCode(subjectId);
    const domainCode = universalTopicsV2.getDomainCode(domainId);
    
    // Use incrementing counter for sequential fake IDs
    const currentCounter = fakeIdCounter++;
    if (fakeIdCounter > 9999) {
        fakeIdCounter = 1; // Reset if we reach max
    }
    
    // Format: XXX-YYY-99NNNN where NNNN is padded to 4 digits
    return `${subjectCode}-${domainCode}-99${currentCounter.toString().padStart(4, '0')}`;
}

/**
 * Generates a unique question ID in the format XXX-YYY-NNNNNN
 * where XXX is the 3-letter subject code, YYY is the 3-letter domain code,
 * and NNNNNN is a sequential number from the database
 * @throws Error if subject or domain ID is invalid
 */
export async function generateQuestionId(subjectId: string, domainId: string, isDryRun?: boolean): Promise<string> {
    if (isDryRun) {
        return generateFakeQuestionId(subjectId, domainId);
    }

    // Validate that the domain belongs to the subject
    if (!universalTopicsV2.getDomainSafe(subjectId, domainId)) {
        throw new Error(`Domain ${domainId} does not belong to subject ${subjectId}`);
    }

    // Get and validate the 3-letter codes
    const subjectCode = universalTopicsV2.getSubjectCode(subjectId);
    const domainCode = universalTopicsV2.getDomainCode(domainId);
    
    // Get the next available ID from the database
    const nextId = await questionStorage.getNextQuestionId(subjectId.toLowerCase(), domainId.toLowerCase());
    
    // Format the ID with 3-letter codes and 6-digit sequential number
    return `${subjectCode}-${domainCode}-${nextId.toString().padStart(6, '0')}`;
}

/**
 * Validates if a subject code matches its full ID
 */
export function validateSubjectCode(code: string, fullId: string): boolean {
    const subject = universalTopicsV2.getSubjectSafe(fullId);
    if (!subject) return false;
    return code === subject.code;
}

/**
 * Validates if a domain code matches its full ID
 */
export function validateDomainCode(code: string, fullId: string, subjectId: string): boolean {
    // Get the subject and check if the domain belongs to it
    const subject = universalTopicsV2.getSubjectSafe(subjectId);
    if (!subject) {
        return false;
    }

    // Find the domain in this subject
    const domain = subject.domains.find((d: Domain) => d.id === fullId);
    if (!domain) {
        return false;
    }

    // Check if the code matches
    return code === domain.code;
}

/**
 * Validates a question ID format and content without requiring subject/domain IDs
 * This is useful for initial validation before we have the full question data
 */
export function validateQuestionIdWithoutSubjectDomain(id: string): boolean {
  // First validate basic format
  if (!validateQuestionIdFormat(id)) {
    return false;
  }

  // Split into parts
  const [subjectCode, domainCode] = id.split('-');

  // Check if subject code exists in our system
  let foundSubject = false;
  let foundDomain = false;

  // Check if subject code exists by searching through all subjects
  for (const subject of universalTopics.getAllSubjects()) {
    if (subject.code === subjectCode) {
      foundSubject = true;
      // Check if domain exists under this subject
      const domain = subject.domains.find(d => d.code === domainCode);
      if (domain) {
        foundDomain = true;
      }
      break;
    }
  }

  return foundSubject && foundDomain;
} 
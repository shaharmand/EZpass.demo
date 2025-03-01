import { universalTopics } from '../services/universalTopics';
import { questionStorage } from '../services/admin/questionStorage';

// Valid subject codes with their 3-letter codes and full IDs
const SUBJECT_CODES = {
    'civil_engineering': {
        code: 'CIV',
        id: 'civil_engineering'
    }
} as const;

// Valid domain codes with their 3-letter codes and full IDs
const DOMAIN_CODES = {
    'construction_safety': {
        code: 'SAF',
        id: 'construction_safety'
    }
} as const;

type ValidSubject = keyof typeof SUBJECT_CODES;
type ValidDomain = keyof typeof DOMAIN_CODES;

/**
 * Validates if a subject code matches its full ID
 */
export function validateSubjectCode(code: string, fullId: string): boolean {
    const subjectEntry = Object.entries(SUBJECT_CODES).find(([_, value]) => value.id === fullId);
    if (!subjectEntry) return false;
    return code === subjectEntry[1].code;
}

/**
 * Validates if a domain code matches its full ID
 */
export function validateDomainCode(code: string, fullId: string): boolean {
    const domainEntry = Object.entries(DOMAIN_CODES).find(([_, value]) => value.id === fullId);
    if (!domainEntry) return false;
    return code === domainEntry[1].code;
}

/**
 * Gets the 3-letter code for a subject
 */
export function getSubjectCode(fullId: string): string {
    const subject = Object.values(SUBJECT_CODES).find(s => s.id === fullId.toLowerCase());
    if (!subject) {
        throw new Error(`Invalid subject ID: ${fullId}`);
    }
    return subject.code;
}

/**
 * Gets the 3-letter code for a domain
 */
export function getDomainCode(fullId: string): string {
    const domain = Object.values(DOMAIN_CODES).find(d => d.id === fullId.toLowerCase());
    if (!domain) {
        throw new Error(`Invalid domain ID: ${fullId}`);
    }
    return domain.code;
}

/**
 * Generates a unique question ID in the format XXX-YYY-NNNNNN
 * where XXX is the 3-letter subject code, YYY is the 3-letter domain code,
 * and NNNNNN is a sequential number from the database
 * @throws Error if subject or domain ID is invalid
 */
export async function generateQuestionId(subjectId: string, domainId: string): Promise<string> {
    // Get and validate the 3-letter codes
    const subjectCode = getSubjectCode(subjectId);
    const domainCode = getDomainCode(domainId);
    
    // Get the next available ID from the database
    const nextId = await questionStorage.getNextQuestionId(subjectId.toLowerCase(), domainId.toLowerCase());
    
    // Format the ID with 3-letter codes and 6-digit sequential number
    return `${subjectCode}-${domainCode}-${nextId.toString().padStart(6, '0')}`;
}

/**
 * Validates a complete question ID format and content
 */
export function validateQuestionId(id: string, subjectId: string, domainId: string): boolean {
    try {
        // Check basic format
        const match = id.match(/^([A-Z]{3})-([A-Z]{3})-(\d{6})$/);
        if (!match) return false;

        const [_, subjectCode, domainCode] = match;

        // Get expected codes
        const expectedSubjectCode = getSubjectCode(subjectId);
        const expectedDomainCode = getDomainCode(domainId);

        // Compare actual vs expected
        return subjectCode === expectedSubjectCode && domainCode === expectedDomainCode;
    } catch (error) {
        return false;
    }
} 
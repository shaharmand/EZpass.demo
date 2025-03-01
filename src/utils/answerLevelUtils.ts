import { AnswerLevel } from '../types/question';

/**
 * Get CSS classes for styling based on answer level
 */
export function getAnswerLevelClasses(level: AnswerLevel): {
  textColor: string;
  bgColor: string;
  borderColor: string;
} {
  switch (level) {
    case AnswerLevel.PERFECT:
      return {
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-500'
      };
    case AnswerLevel.EXCELLENT:
      return {
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500'
      };
    case AnswerLevel.GOOD:
      return {
        textColor: 'text-lime-700',
        bgColor: 'bg-lime-50',
        borderColor: 'border-lime-500'
      };
    case AnswerLevel.PARTIAL:
      return {
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500'
      };
    case AnswerLevel.WEAK:
      return {
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500'
      };
    case AnswerLevel.INSUFFICIENT:
      return {
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500'
      };
    case AnswerLevel.NO_UNDERSTANDING:
      return {
        textColor: 'text-red-800',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-600'
      };
    case AnswerLevel.IRRELEVANT:
      return {
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-500'
      };
  }
}

/**
 * Get Hebrew display text for answer level
 */
export function getAnswerLevelDisplayText(level: AnswerLevel): string {
  switch (level) {
    case AnswerLevel.PERFECT:
      return 'מושלם';
    case AnswerLevel.EXCELLENT:
      return 'מצוין';
    case AnswerLevel.GOOD:
      return 'טוב מאוד';
    case AnswerLevel.PARTIAL:
      return 'חלקי';
    case AnswerLevel.WEAK:
      return 'חלש';
    case AnswerLevel.INSUFFICIENT:
      return 'לא מספיק';
    case AnswerLevel.NO_UNDERSTANDING:
      return 'חוסר הבנה';
    case AnswerLevel.IRRELEVANT:
      return 'לא רלוונטי';
  }
}

/**
 * Get appropriate icon for answer level
 */
export function getAnswerLevelIcon(level: AnswerLevel): string {
  switch (level) {
    case AnswerLevel.PERFECT:
      return '🌟';
    case AnswerLevel.EXCELLENT:
      return '✨';
    case AnswerLevel.GOOD:
      return '👍';
    case AnswerLevel.PARTIAL:
      return '🔸';
    case AnswerLevel.WEAK:
      return '⚠️';
    case AnswerLevel.INSUFFICIENT:
      return '❌';
    case AnswerLevel.NO_UNDERSTANDING:
      return '❓';
    case AnswerLevel.IRRELEVANT:
      return '🤔';
  }
}

/**
 * Check if an answer level is considered passing
 */
export function isPassingLevel(level: AnswerLevel): boolean {
  return [
    AnswerLevel.PERFECT,
    AnswerLevel.EXCELLENT,
    AnswerLevel.GOOD,
    AnswerLevel.PARTIAL
  ].includes(level);
}

/**
 * Get appropriate action text based on answer level
 */
export function getAnswerLevelActionText(level: AnswerLevel): string {
  switch (level) {
    case AnswerLevel.PERFECT:
      return 'המשך לשאלה הבאה';
    case AnswerLevel.EXCELLENT:
      return 'המשך לשאלה הבאה';
    case AnswerLevel.GOOD:
      return 'נסה לשפר או המשך הלאה';
    case AnswerLevel.PARTIAL:
      return 'כדאי לנסות שוב';
    case AnswerLevel.WEAK:
      return 'מומלץ לחזור על החומר ולנסות שוב';
    case AnswerLevel.INSUFFICIENT:
      return 'חזור על החומר ונסה שוב';
    case AnswerLevel.NO_UNDERSTANDING:
      return 'חזור למושגי היסוד ונסה שוב';
    case AnswerLevel.IRRELEVANT:
      return 'קרא שוב את השאלה ונסה שוב';
  }
} 
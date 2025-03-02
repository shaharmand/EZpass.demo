import { EvalLevel } from '../types/question';

/**
 * Get CSS classes for styling based on answer level
 */
export function getAnswerLevelClasses(level: EvalLevel): {
  textColor: string;
  bgColor: string;
  borderColor: string;
} {
  switch (level) {
    case EvalLevel.PERFECT:
      return {
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-500'
      };
    case EvalLevel.EXCELLENT:
      return {
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500'
      };
    case EvalLevel.GOOD:
      return {
        textColor: 'text-lime-700',
        bgColor: 'bg-lime-50',
        borderColor: 'border-lime-500'
      };
    case EvalLevel.PARTIAL:
      return {
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-500'
      };
    case EvalLevel.WEAK:
      return {
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500'
      };
    case EvalLevel.INSUFFICIENT:
      return {
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500'
      };
    case EvalLevel.NO_UNDERSTANDING:
      return {
        textColor: 'text-red-800',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-600'
      };
    case EvalLevel.IRRELEVANT:
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
export function getAnswerLevelDisplayText(level: EvalLevel): string {
  switch (level) {
    case EvalLevel.PERFECT:
      return 'מושלם';
    case EvalLevel.EXCELLENT:
      return 'מצוין';
    case EvalLevel.GOOD:
      return 'טוב מאוד';
    case EvalLevel.PARTIAL:
      return 'חלקי';
    case EvalLevel.WEAK:
      return 'חלש';
    case EvalLevel.INSUFFICIENT:
      return 'לא מספיק';
    case EvalLevel.NO_UNDERSTANDING:
      return 'חוסר הבנה';
    case EvalLevel.IRRELEVANT:
      return 'לא רלוונטי';
  }
}

/**
 * Get appropriate icon for answer level
 */
export function getAnswerLevelIcon(level: EvalLevel): string {
  switch (level) {
    case EvalLevel.PERFECT:
      return '🌟';
    case EvalLevel.EXCELLENT:
      return '✨';
    case EvalLevel.GOOD:
      return '👍';
    case EvalLevel.PARTIAL:
      return '🔸';
    case EvalLevel.WEAK:
      return '⚠️';
    case EvalLevel.INSUFFICIENT:
      return '❌';
    case EvalLevel.NO_UNDERSTANDING:
      return '❓';
    case EvalLevel.IRRELEVANT:
      return '🤔';
  }
}

/**
 * Check if an answer level is considered passing
 */
export function isPassingLevel(level: EvalLevel): boolean {
  return [
    EvalLevel.PERFECT,
    EvalLevel.EXCELLENT,
    EvalLevel.GOOD,
    EvalLevel.PARTIAL
  ].includes(level);
}

/**
 * Get appropriate action text based on answer level
 */
export function getAnswerLevelActionText(level: EvalLevel): string {
  switch (level) {
    case EvalLevel.PERFECT:
      return 'המשך לשאלה הבאה';
    case EvalLevel.EXCELLENT:
      return 'המשך לשאלה הבאה';
    case EvalLevel.GOOD:
      return 'נסה לשפר או המשך הלאה';
    case EvalLevel.PARTIAL:
      return 'כדאי לנסות שוב';
    case EvalLevel.WEAK:
      return 'מומלץ לחזור על החומר ולנסות שוב';
    case EvalLevel.INSUFFICIENT:
      return 'חזור על החומר ונסה שוב';
    case EvalLevel.NO_UNDERSTANDING:
      return 'חזור למושגי היסוד ונסה שוב';
    case EvalLevel.IRRELEVANT:
      return 'קרא שוב את השאלה ונסה שוב';
  }
} 
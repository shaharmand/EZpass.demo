import { format } from 'date-fns';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = string | string[];

interface LogOptions {
  level?: LogLevel;
  timestamp?: boolean;
  isDevelopment?: boolean;
  filters?: LogFilters;
}

interface LogFilters {
  ignorePatterns?: string[];
  showOnly?: string[];
  minLevel?: LogLevel;
}

interface ScopedLogOptions extends LogFilters {
  context: LogContext;
}

// Log level hierarchy
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Default development filters
const DEFAULT_DEV_FILTERS: LogFilters = {
  ignorePatterns: [
    'findDOMNode',
    'Warning: Updating a style property',
    'First question generated',
    'Generated question parameters'
  ],
  showOnly: [
    'error',
    'feedback generation',
    'answer submission',
    'Question type selection'
  ],
  minLevel: 'info'
};

// Default production filters
const DEFAULT_PROD_FILTERS: LogFilters = {
  ignorePatterns: [],
  showOnly: [],
  minLevel: 'warn'
};

const DEFAULT_OPTIONS: LogOptions = {
  level: 'info',
  timestamp: true,
  isDevelopment: process.env.NODE_ENV === 'development',
  filters: process.env.NODE_ENV === 'development' ? DEFAULT_DEV_FILTERS : DEFAULT_PROD_FILTERS
};

// Define critical sections for debugging
export const CRITICAL_SECTIONS = {
  FEEDBACK: 'feedback',
  QUESTION_GENERATION: 'question-generation',
  SUBJECT_MAPPING: 'subject-mapping',
  EXAM_STATE: 'exam-state',
  AUTH: 'auth',
  API: 'api',
  LATEX: 'latex-rendering',
  CODE_BLOCKS: 'code-blocks',
  RACE_CONDITIONS: 'race-conditions',
  QUESTION_TYPE_SELECTION: 'question-type-selection'
} as const;

// Predefined configurations for critical sections
const CRITICAL_SECTION_CONFIGS: Record<string, Omit<ScopedLogOptions, 'context'>> = {
  [CRITICAL_SECTIONS.FEEDBACK]: {
    minLevel: 'debug',
    showOnly: ['feedback', 'generation', 'evaluation', 'score']
  },
  [CRITICAL_SECTIONS.QUESTION_GENERATION]: {
    minLevel: 'debug',
    showOnly: ['question', 'generation', 'validation', 'parameters']
  },
  [CRITICAL_SECTIONS.SUBJECT_MAPPING]: {
    minLevel: 'debug',
    showOnly: ['subject', 'topic', 'mapping']
  },
  [CRITICAL_SECTIONS.EXAM_STATE]: {
    minLevel: 'debug',
    showOnly: ['state', 'transition', 'update']
  },
  [CRITICAL_SECTIONS.AUTH]: {
    minLevel: 'debug',
    showOnly: ['auth', 'session', 'token']
  },
  [CRITICAL_SECTIONS.API]: {
    minLevel: 'debug',
    showOnly: ['api', 'request', 'response']
  },
  [CRITICAL_SECTIONS.LATEX]: {
    minLevel: 'debug',
    showOnly: ['latex', 'math', 'render', 'parse', 'katex', 'mathjax'],
    ignorePatterns: ['Warning: Prop']
  },
  [CRITICAL_SECTIONS.CODE_BLOCKS]: {
    minLevel: 'debug',
    showOnly: ['code', 'syntax', 'highlight', 'prism', 'language'],
    ignorePatterns: ['Warning: Prop']
  },
  [CRITICAL_SECTIONS.RACE_CONDITIONS]: {
    minLevel: 'debug',
    showOnly: ['race', 'async', 'concurrent', 'timing', 'state update'],
    ignorePatterns: ['Warning: Prop']
  },
  [CRITICAL_SECTIONS.QUESTION_TYPE_SELECTION]: {
    minLevel: 'debug',
    showOnly: ['type', 'selection', 'filter', 'change'],
    ignorePatterns: []
  }
};

class Logger {
  private options: LogOptions;
  private scopedConfigs: Map<string, LogFilters> = new Map();
  private activeDebugSections: Set<string> = new Set();

  constructor(options: LogOptions = DEFAULT_OPTIONS) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Update global logger configuration
  configure(options: Partial<LogOptions>) {
    this.options = { ...this.options, ...options };
    if (options.filters) {
      this.options.filters = { ...this.options.filters, ...options.filters };
    }
    console.info('Global logger configuration updated:', this.options);
  }

  // Add a scoped configuration
  addScope(config: ScopedLogOptions) {
    const contexts = Array.isArray(config.context) ? config.context : [config.context];
    contexts.forEach(context => {
      this.scopedConfigs.set(context, {
        minLevel: config.minLevel,
        showOnly: config.showOnly,
        ignorePatterns: config.ignorePatterns
      });
    });
    console.info('Added scoped logger configuration:', config);
  }

  // Remove a scoped configuration
  removeScope(context: LogContext) {
    const contexts = Array.isArray(context) ? context : [context];
    contexts.forEach(ctx => this.scopedConfigs.delete(ctx));
  }

  // Get current configuration
  getConfig(): { global: LogOptions; scoped: Map<string, LogFilters> } {
    return {
      global: { ...this.options },
      scoped: new Map(this.scopedConfigs)
    };
  }

  private meetsMinLevel(level: LogLevel, context?: string): boolean {
    let minLevel: LogLevel;
    
    if (context && this.scopedConfigs.has(context)) {
      minLevel = this.scopedConfigs.get(context)?.minLevel || this.options.filters?.minLevel || 'info';
    } else {
      minLevel = this.options.filters?.minLevel || 'info';
    }
    
    return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
  }

  private shouldLog(message: string, level: LogLevel, context?: string): boolean {
    // Always log if not in development
    if (!this.options.isDevelopment) {
      return this.meetsMinLevel(level, context);
    }

    // Check for scoped configuration first
    if (context && this.scopedConfigs.has(context)) {
      const scopedFilters = this.scopedConfigs.get(context)!;
      
      // Check scoped minimum level
      if (!this.meetsMinLevel(level, context)) {
        return false;
      }

      // Check scoped ignore patterns
      if (scopedFilters.ignorePatterns?.some(pattern => 
        message.toLowerCase().includes(pattern.toLowerCase())
      )) {
        return false;
      }

      // Check scoped show patterns
      if (level !== 'error' && scopedFilters.showOnly?.length) {
        return scopedFilters.showOnly.some(pattern =>
          message.toLowerCase().includes(pattern.toLowerCase())
        );
      }

      return true;
    }

    // Fall back to global configuration
    const filters = this.options.filters;
    if (!filters) return true;

    if (!this.meetsMinLevel(level)) {
      return false;
    }

    if (filters.ignorePatterns?.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    )) {
      return false;
    }

    if (level !== 'error' && filters.showOnly?.length) {
      return filters.showOnly.some(pattern =>
        message.toLowerCase().includes(pattern.toLowerCase())
      );
    }

    return true;
  }

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): string {
    const timestamp = this.options.timestamp 
      ? `[${format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")}] `
      : '';
    const contextStr = context ? `[${context}] ` : '';
    const prefix = `${timestamp}${level.toUpperCase()}: ${contextStr}`;
    return `${prefix}${message}${data ? ' ' + JSON.stringify(data, null, 2) : ''}`;
  }

  debug(message: string, data?: any, context?: string) {
    if (this.shouldLog(message, 'debug', context)) {
      console.debug(this.formatMessage('debug', message, data, context));
    }
  }

  info(message: string, data?: any, context?: string) {
    if (this.shouldLog(message, 'info', context)) {
      console.info(this.formatMessage('info', message, data, context));
    }
  }

  warn(message: string, data?: any, context?: string) {
    if (this.shouldLog(message, 'warn', context)) {
      console.warn(this.formatMessage('warn', message, data, context));
    }
  }

  error(message: string, data?: any, context?: string) {
    if (this.shouldLog(message, 'error', context)) {
      console.error(this.formatMessage('error', message, data, context));
    }
  }

  /**
   * Enable debugging for specific critical sections
   * @param sections Array of critical section names or a single section
   * @param customConfig Optional custom configuration to override defaults
   */
  enableDebugging(sections: string | string[], customConfig?: Partial<LogFilters>) {
    const sectionArray = Array.isArray(sections) ? sections : [sections];
    
    sectionArray.forEach(section => {
      if (!CRITICAL_SECTION_CONFIGS[section]) {
        console.warn(`Unknown critical section: ${section}`);
        return;
      }

      const config = {
        ...CRITICAL_SECTION_CONFIGS[section],
        ...customConfig
      };

      this.addScope({
        context: section,
        ...config
      });

      this.activeDebugSections.add(section);
    });

    console.info('Enabled debugging for sections:', sectionArray);
  }

  /**
   * Disable debugging for specific critical sections
   * @param sections Array of critical section names or a single section
   */
  disableDebugging(sections: string | string[]) {
    const sectionArray = Array.isArray(sections) ? sections : [sections];
    
    sectionArray.forEach(section => {
      this.removeScope(section);
      this.activeDebugSections.delete(section);
    });

    console.info('Disabled debugging for sections:', sectionArray);
  }

  /**
   * Get currently active debug sections
   */
  getActiveDebugSections(): string[] {
    return Array.from(this.activeDebugSections);
  }

  /**
   * Check if debugging is enabled for a section
   */
  isDebuggingEnabled(section: string): boolean {
    return this.activeDebugSections.has(section);
  }
}

// Create default logger instance
export const logger = new Logger();

// Example usage:
/*
// Enable debugging for specific critical sections
logger.enableDebugging([CRITICAL_SECTIONS.FEEDBACK, CRITICAL_SECTIONS.SUBJECT_MAPPING]);

// Enable with custom config
logger.enableDebugging(CRITICAL_SECTIONS.QUESTION_GENERATION, {
  minLevel: 'debug',
  showOnly: ['generation', 'specific-issue']
});

// Usage in code:
logger.debug('Processing feedback', data, CRITICAL_SECTIONS.FEEDBACK);
logger.info('Mapping subject', data, CRITICAL_SECTIONS.SUBJECT_MAPPING);

// Disable when done
logger.disableDebugging(CRITICAL_SECTIONS.FEEDBACK);

// Check status
const activeSections = logger.getActiveDebugSections();
const isFeedbackDebugging = logger.isDebuggingEnabled(CRITICAL_SECTIONS.FEEDBACK);
*/ 
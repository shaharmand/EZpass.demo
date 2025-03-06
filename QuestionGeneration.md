# Question Generation Service Documentation

## Overview
The Question Generation Service is responsible for creating high-quality questions for the EZpass system. It uses LLM (Large Language Model) to generate questions based on specific requirements and follows a structured approach to ensure consistency and quality.

## Directory Structure
```
src/
  services/
    llm/
      prompts/
        common/
          language.ts        # Language and formatting requirements
          metadata.ts        # Metadata structure and validation
          content.ts         # Content requirements and formatting
          schoolAnswer.ts    # School answer structure and validation
          evaluation.ts      # Evaluation criteria and weights
        types/
          multipleChoice/    # Multiple choice specific requirements
          numerical/         # Numerical question specific requirements
          open/             # Open question specific requirements
        requests/
          fullGeneration/   # Full question generation request
          enrichFields/     # Field enrichment request
          createVariant/    # Question variant generation
        examples/           # Example questions for each type
          multipleChoice/
          numerical/
          open/
        index.ts           # Main exports
```

## Type System Integration

### Question Types
1. Multiple Choice
   - Exactly 4 options
   - One correct answer (1-4)
   - Requires solution explanation

2. Numerical
   - Exact numeric answer
   - Optional tolerance
   - Optional units
   - Requires solution steps

3. Open
   - Free-form answer
   - No final answer
   - Requires detailed solution

### Answer Format Requirements
```typescript
interface AnswerFormat {
  hasFinalAnswer: boolean;
  finalAnswerType: 'multiple_choice' | 'numerical' | 'none';
  requiresSolution: boolean;
}
```

### School Answer Structure
```typescript
interface FullAnswer {
  finalAnswer?: MultipleChoiceAnswer | NumericalAnswer;
  solution: {
    text: string;
    format: 'markdown';
  };
}
```

## Evaluation Criteria

### Multiple Choice
- correct_answer (50%)
- explanation_quality (50%)

### Numerical
- calculation_accuracy (40%)
- solution_steps (30%)
- units_and_format (30%)

### Open
- completeness (30%)
- accuracy (30%)
- organization (20%)
- practicality (20%)

## Storage and ID System

### Question IDs
- Format: `{subjectId}_{domainId}_{topicId}_{subtopicId}_{type}_{uniqueId}`
- Example: `safety_101_equipment_102_multiple_choice_abc123`

### Storage Structure
```typescript
interface QuestionStorage {
  id: string;
  metadata: {
    subjectId: string;
    domainId: string;
    topicId: string;
    subtopicId?: string;
    type: QuestionType;
    difficulty: DifficultyLevel;
    estimatedTime?: number;
    answerFormat: AnswerFormat;
    source?: {
      type: 'exam' | 'ezpass';
      // Additional source-specific fields
    };
  };
  content: {
    text: string;
    format: 'markdown';
    options?: Array<{
      text: string;
      format: 'markdown';
    }>;
  };
  schoolAnswer: FullAnswer;
  evaluationGuidelines: AnswerContentGuidelines;
}
```

## Next Steps

### 1. Service Integration
- [ ] Create QuestionGenerationService class
- [ ] Implement connection to main service
- [ ] Add error handling and validation
- [ ] Implement retry mechanism for failed generations

### 2. Storage Implementation
- [ ] Set up database schema
- [ ] Implement CRUD operations
- [ ] Add caching layer
- [ ] Implement versioning system

### 3. API Endpoints
- [ ] POST /api/questions/generate
- [ ] POST /api/questions/enrich
- [ ] POST /api/questions/variant
- [ ] GET /api/questions/{id}
- [ ] PUT /api/questions/{id}

### 4. Validation Layer
- [ ] Implement input validation
- [ ] Add output validation
- [ ] Create validation middleware
- [ ] Add schema validation

### 5. Testing
- [ ] Unit tests for each component
- [ ] Integration tests for service
- [ ] End-to-end tests
- [ ] Performance testing

### 6. Monitoring and Logging
- [ ] Add logging system
- [ ] Implement metrics collection
- [ ] Set up monitoring dashboard
- [ ] Add alerting system

## Usage Examples

### Generating a Multiple Choice Question
```typescript
const question = await questionGenerationService.generate({
  type: 'multiple_choice',
  subjectId: 'safety_101',
  domainId: 'equipment',
  topicId: 'personal_protection',
  difficulty: 2,
  estimatedTime: 5
});
```

### Creating a Question Variant
```typescript
const variant = await questionGenerationService.createVariant({
  originalQuestionId: 'safety_101_equipment_102_multiple_choice_abc123',
  variantType: 'difficulty',
  variantParams: {
    difficulty: 3
  }
});
```

### Enriching Question Fields
```typescript
const enrichedQuestion = await questionGenerationService.enrich({
  questionId: 'safety_101_equipment_102_multiple_choice_abc123',
  fields: ['solution', 'evaluationGuidelines']
});
```

## Best Practices

1. Question Generation
   - Always validate input parameters
   - Ensure proper error handling
   - Follow type system strictly
   - Maintain consistent formatting

2. Storage
   - Use proper indexing
   - Implement caching where appropriate
   - Follow naming conventions
   - Maintain data integrity

3. API Design
   - Use RESTful principles
   - Implement proper error responses
   - Add rate limiting
   - Include proper documentation

4. Testing
   - Write comprehensive tests
   - Include edge cases
   - Test error scenarios
   - Maintain test coverage

## Error Handling

1. Generation Errors
   - Invalid input parameters
   - LLM service failures
   - Validation failures
   - Timeout issues

2. Storage Errors
   - Duplicate IDs
   - Invalid data format
   - Database connection issues
   - Cache misses

3. API Errors
   - Invalid requests
   - Authentication failures
   - Rate limit exceeded
   - Service unavailable

## Performance Considerations

1. Caching Strategy
   - Cache generated questions
   - Cache validation results
   - Cache common prompts
   - Implement cache invalidation

2. Database Optimization
   - Use proper indexes
   - Implement query optimization
   - Use connection pooling
   - Monitor query performance

3. API Performance
   - Implement rate limiting
   - Use compression
   - Optimize response size
   - Monitor response times 
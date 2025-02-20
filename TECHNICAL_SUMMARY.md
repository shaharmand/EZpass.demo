# Question Loading and Skip Flow Technical Summary

## QUESTION LOADING PROCESS
```
1. Initial Load:
ExamContext.startPractice(exam, topics)
  ↓
  Initialize practiceState = {
    exam: FormalExam,
    selectedTopics: string[],
    currentQuestionIndex: 0,
    answers: [],
    startTime: number
  }
  ↓
getNextPracticeQuestion()
  ↓
questionService.generateQuestion()
  ↓
setCurrentQuestion(question)
  ↓
PracticeQuestionDisplay renders
```

## SKIP FLOW
```
User clicks Skip → handleSkipClick(reason)
  ↓
onNextQuestion(reason) in PracticePage
  ↓
handleNextQuestion(reason)
  ↓
submitPracticeAnswer() // Marks as skipped
  ↓
getNextPracticeQuestion()
  ↓
setCurrentQuestion(newQuestion)
  ↓
PracticeQuestionDisplay re-renders
```

## CURRENT ISSUES

### 1. Initial Load
```typescript
// PracticePage.tsx
const initializePractice = useCallback(async () => {
  if (!activePrepId || requestInProgress.current) return;
  
  requestInProgress.current = true;
  try {
    // This is where we need to handle the first question load better
    const question = await startPractice(prep.exam, prep.selectedTopics);
    setCurrentQuestion(question);
  } catch (error) {
    // Error handling
  } finally {
    requestInProgress.current = false;
  }
}, [activePrepId, prep]);
```

### 2. Skip Handling
```typescript
// PracticePage.tsx
const handleNextQuestion = async (reason?: 'too_hard' | 'too_easy' | 'not_in_material') => {
  if (requestInProgress.current) {
    console.log('Request in progress, skipping');
    return;
  }

  requestInProgress.current = true;
  try {
    // Need to improve this transition
    setLoading(true);
    const nextQuestion = await getNextPracticeQuestion();
    setCurrentQuestion(nextQuestion);
  } catch (error) {
    // Error handling
  } finally {
    setLoading(false);
    requestInProgress.current = false;
  }
};
```

## KEY AREAS TO FIX

### 1. State Management
```typescript
// Need to better coordinate these states
const [loading, setLoading] = useState(false);
const requestInProgress = useRef(false);
const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
```

### 2. Loading Coordination
```typescript
// QuestionContent.tsx
// Need to better handle these visibility states
const [isMathRendered, setIsMathRendered] = useState(false);
const [isContentVisible, setIsContentVisible] = useState(false);
```

### 3. Transition Timing
```typescript
// Need to coordinate these transitions better
setLoading(true);
await getNextPracticeQuestion();
setCurrentQuestion(nextQuestion);
setLoading(false);
```

## PROPOSED IMPROVEMENTS

### 1. Add State Machine
```typescript
type QuestionState = 
  | 'initializing'
  | 'loading'
  | 'rendering'
  | 'visible'
  | 'transitioning';
```

### 2. Better Transition Coordination
```typescript
const handleTransition = async () => {
  setQuestionState('transitioning');
  // Fade out current
  await fadeOutContent();
  // Load new
  setQuestionState('loading');
  const newQuestion = await getNextPracticeQuestion();
  // Render new
  setQuestionState('rendering');
  setCurrentQuestion(newQuestion);
  // Show new
  setQuestionState('visible');
};
```

## NEXT STEPS
1. Make the initial question load immediate and smooth
2. Handle transitions between questions properly
3. Coordinate all the loading/visibility states better
4. Implement proper state machine for transitions
5. Add better error handling and recovery
6. Improve animation timing and coordination 
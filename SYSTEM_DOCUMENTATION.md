# EZPass Practice System Documentation

## Core States

### 1. Practice Session States (StudentPrep)
```typescript
type PrepState = 
  | { status: 'initializing' }
  | { status: 'not_started' }
  | { status: 'active', startedAt: number, activeTime: number, lastTick: number }
  | { status: 'paused', activeTime: number, pausedAt: number }
  | { status: 'completed', activeTime: number, completedAt: number }
  | { status: 'error', error: string, activeTime: number };
```

### 2. Question States
```typescript
type QuestionState = {
  status: 'loading' | 'active' | 'submitted' | 'completed';
  startedAt: number;
  lastUpdatedAt: number;
  questionIndex?: number;
  currentAnswer?: string;
  submittedAnswer?: { text: string; timestamp: number };
  skipInfo?: { reason: SkipReason; timestamp: number };
  helpRequests: HelpRequest[];
  feedback?: QuestionFeedback;
  error?: { message: string; timestamp: number };
};
```

## Component Responsibilities

### 1. Context Level
- `StudentPrepProvider`
  - Manages overall practice session state
  - Handles practice initialization, activation, pausing
  - Manages question progression
  - Tracks time and session progress

### 2. Page Level
- `PracticePage`
  - Orchestrates practice flow
  - Handles routing and navigation
  - Manages high-level error states
  - Controls practice header and progress display

### 3. Container Components
- `PracticeContainer`
  - Manages question display and interaction
  - Handles answer submission flow
  - Controls feedback display
  - Manages help and skip actions
  - Logs state changes and user actions

### 4. Display Components
- `PracticeQuestionDisplay`
  - Renders question content
  - Shows question header and actions
  - Pure presentation component

- `QuestionContent`
  - Renders question text and media
  - Handles loading states
  - Manages MathJax rendering

- `QuestionMetadata`
  - Displays topic, difficulty, and type info
  - Shows tooltips with detailed information
  - Located in side panel only

- `QuestionFeedback`
  - Shows answer correctness
  - Displays detailed feedback
  - Manages feedback animations

### 5. Interactive Components
- `QuestionResponseInput`
  - Handles user input
  - Manages input validation
  - Controls submission state

- `QuestionActions`
  - Provides help options
  - Handles skip functionality
  - Manages action states and tooltips

## State Flow

### 1. Practice Session Flow
```
initializing -> not_started -> active -> (paused/completed/error)
```

### 2. Question Flow
```
loading -> active -> submitted -> (next question loading)
```

### 3. Response Flow
```
input -> validation -> submission -> feedback -> next
```

## Key Interactions

### 1. Practice Initialization
- `StudentPrepProvider` creates session
- `PracticePage` handles setup
- `PracticeContainer` begins question flow

### 2. Question Handling
- `PracticeContainer` manages state
- `QuestionContent` displays
- `QuestionResponseInput` handles interaction
- `QuestionFeedback` shows results

### 3. State Updates
- All state changes logged
- Time tracking at multiple levels
- Error handling throughout flow
- Proper cleanup on unmount

## Data Flow
```
StudentPrepProvider
  └─ PracticePage
     └─ PracticeContainer
        ├─ PracticeQuestionDisplay
        │  └─ QuestionContent
        ├─ QuestionResponseInput
        ├─ QuestionFeedback
        └─ QuestionMetadata (side panel)
```

## Layout Structure
1. Fixed header with practice info
2. Progress bar section
3. Main content area
   - Question content (left)
   - Metadata sidebar (right)
4. Response section
   - Input area
   - Feedback display
5. Side panel with metadata

## Remaining Tasks

### 1. Progress Tracking
- Implement progress indicators
- Add statistics for correct/incorrect answers
- Show time spent on questions

### 2. Navigation
- Add navigation between questions
- Implement question history
- Add ability to return to previous questions

### 3. Help System
- Complete implementation of help actions
- Add tooltips and guidance
- Implement skip question functionality

### 4. UI Polish
- Add animations for state transitions
- Improve mobile responsiveness
- Add keyboard shortcuts
- Enhance accessibility

### 5. Error Handling
- Add better error messages
- Implement retry mechanisms
- Add offline support

### 6. Performance
- Optimize state updates
- Add caching for questions
- Improve loading times

### 7. Testing
- Add unit tests for components
- Add integration tests for state flow
- Add end-to-end tests for user flows 
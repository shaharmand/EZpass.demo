# Question Editor Component Structure

## Core Components and Responsibilities

### 1. Admin Layout Components

#### AdminLayout
`src/layouts/AdminLayout.tsx`
- **Responsibility**: Main admin area layout and navigation
- **Layout Structure** (RTL):
  ```
  +------------------------+
  |    AdminPageHeader    |
  +-------------+--------+
  |             |        |
  |   Content   |  Nav   |
  |    Area     |  Bar   |
  |             |        |
  +-------------+--------+
  ```
- **Contains**:
  - AdminPageHeader (top)
  - AdminNavigationBar (right side)
  - Content area (left side)
- **Props**:
  - `children`: React.ReactNode (renders in content area)

#### AdminNavigationBar
`src/components/admin/AdminNavigationBar.tsx`
- **Responsibility**: Main admin navigation
- **Contains**:
  - Navigation menu:
    - Questions Library
    - Question Creation
    - User Management
    - System Settings
  - Collapse/Expand control
- **Props**:
  - `currentRoute`: string
  - `onNavigate`: (route: string) => void
- **State**:
  - `isCollapsed`: boolean

#### AdminPageHeader
`src/components/admin/AdminPageHeader.tsx`
- **Responsibility**: Global admin header with extensible area
- **Layout** (RTL):
  ```
  +-----------+---------------------+
  | Profile   | Page-specific area  |
  | Controls  | (injected content)  |
  +-----------+---------------------+
  ```
- **Contains**:
  - Right side: Page-specific content area (slot for pages to inject content)
  - Left side: Profile section with connect/disconnect
- **Props**:
  - `user`: UserProfile
  - `onProfileAction`: (action: 'connect' | 'disconnect') => void
  - `pageHeaderContent?: React.ReactNode` (slot for page-specific content)

### 2. Question Editor Components

#### QuestionEditPage
`src/pages/admin/questions/QuestionEditPage.tsx`
- **Responsibility**: Main page container and state management
- **Contains**:
  - Question data loading
  - Global state management:
    - Current question data
    - Modification tracking (for save/cancel actions)
  - Error handling and loading states
  - Layout wrapper for all editor components
- **Props**:
  - `questionId`: from URL params
- **State**:
  - `question`: DatabaseQuestion (DB state, unchanged)
  - `isModified`: boolean (from Container)
- **Actions**:
  - `handleSave`: (data: SaveQuestion) => Promise<void> (saves changes)
  - `handleCancel`: () => void (discards changes)

### 3. Main Container
`src/components/question/editor/QuestionEditorContainer.tsx`
- **Responsibility**: Layout orchestration and state coordination
- **Contains**:
  - Layout structure for editor components:
    - Content editor sections:
      - Title & content
      - Multiple choice options
      - Solution & explanation
      - Final answer configuration
      - Evaluation guidelines
    - Properties panel (metadata)
    - Status header (navigation & status)
    - Editor header (save/cancel controls)
  - State coordination:
    - Receives field changes via callbacks from child components
    - Calls page's onFieldChange to update currentQuestion
    - Tracks overall modification state
  - Change management:
    - Aggregates modifications from all sections
    - Handles save/cancel operations
    - Manages validation state
    - Calls ContentEditor's `resetChanges` ref method only when:
      - Cancel button clicked (to discard changes without page reload)
    - Note: No reset needed for save/navigation as they trigger full page reload
- **Props**:
  - `question`: DatabaseQuestion (original DB state)
  - `onSave`: (data: SaveQuestion) => Promise<void>
  - `onCancel`: () => void
- **State**:
  - `currentQuestion`: DatabaseQuestion (current editing state with all changes)
  - `currentValidation`: ValidationResult[] (validation results for current state)
  - `isModified`: boolean (whether currentQuestion differs from DB question)
- **Computed Values**:
  - `hasValidationErrors`: boolean (derived from currentValidation.some(result => result.severity === 'error'))
  - `hasWarnings`: boolean (derived from currentValidation.some(result => result.severity === 'warning'))

### 4. Status Header
`src/components/question/editor/QuestionStatusHeader.tsx`
- **Responsibility**: Navigation, status display and management
- **Contains**:
  - Navigation controls:
    - Previous/Next question navigation
    - Question location in list (e.g., "2 / 10" from library search results)
    - Library link (UX Decision Needed):
      - Option A: Opens library in new tab during edit mode
      - Option B: Shows warning about unsaved changes
      - Option C: Remove from edit mode entirely
  - Status indicators:
    - Initial creation state:
      - Shows "בתהליך יצירה" when `in_creation` is true
      - Hides review/publish statuses until first save
      - Changes to "Draft" status after first save
    - Regular states (after first save):
      - Publication status (Draft/Published)
      - Review status (Pending/Approved)
    - Last updated time (updated_at)
    - Validation status and details
  - Action buttons:
    - Save button (during creation)
    - Publish/Approve buttons (after first save)
  - Validation display:
    - Shows current validation state
    - Lists all errors/warnings
    - Indicates if question can be published/approved
- **Props**:
  - `question`: DatabaseQuestion
  - `isModified`: boolean (to check for unsaved changes)
  - `onPrevious/onNext`: () => void
  - `currentPosition`: { current: number, total: number }
  - `onQuestionChange`: (questionId: string) => void
- **Navigation Behavior**:
  - Previous/Next buttons disabled when isModified is true
  - Shows warning dialog if attempting navigation with unsaved changes
  - User must save or discard changes before navigating between questions

### 5. Editor Header
`src/components/question/editor/QuestionEditorHeader.tsx`
- **Responsibility**: Manages save/cancel actions and displays modification status
- **Contains**:
  - Save/Cancel action buttons
  - Unsaved changes warning
- **Layout**:
  ```
  +----------------------------------------+
  |  [Warning] Unsaved Changes   [Cancel] [Save] |
  +----------------------------------------+
  ```
- **Props**:
  - `isModified`: boolean (whether there are unsaved changes)
  - `onSave`: () => Promise<void>
  - `onCancel`: () => void
  - `isSaving`: boolean (optional, for save in progress state)
- **State Management**:
  - Disabled states:
    - Save button disabled when no changes (!isModified)
    - Cancel button disabled when no changes (!isModified)
    - Both buttons disabled during save operation
  - Warning message shown only when isModified is true
- **Behavior**:
  - Always visible during editing
  - Provides clear visual feedback about unsaved state
  - Confirms before canceling if there are changes

### 6. Content Editor
`src/components/question/editor/content/ContentEditor.tsx`
- **Responsibility**: Question content and answer management interface
- **Contains**:
  - Title section
    - Always editable input
  - Question content section
    - Rich text editor (LexicalEditor)
    - Markdown support
  - Multiple choice options (when applicable)
    - Option inputs
    - Correct answer selection
  - Solution section
    - Rich text solution field (all question types)
      - LexicalEditor component
      - Markdown support
      - Full formatting capabilities
    - For numerical questions only (additional fields):
      - Final answer value
      - Acceptable threshold (±)
      - Units selection
  - Answer fields (determined by question type from creation):
    - Multiple choice: handled in options section
    - Numerical: handled in solution section
    - Open-ended: no answer input needed
  - Evaluation Guidelines:
    - Four criteria entries, each with:
      - `name`: string (criterion name)
      - `weight`: number (percentage weight)
      - `description`: string (criterion details)
    - Total weights must sum to 100%
    - Same structure for all question types
    - No rich text, just simple text inputs
- **Props**:
  - `question`: DatabaseQuestion (current editing state from Container)
  - `onFieldChange`: (fieldPath: string, value: any) => void (from Container)
  - `onModified`: (modified: boolean) => void (notify of changes)
- **Ref Methods**:
  - `handleSimpleSave`: () => Promise<void>
  - `collectChanges`: () => Promise<Partial<Question>>
  - `resetChanges`: () => void
- **State Management**:
  - All fields notify changes through onFieldChange prop
  - Each field specifies its path in the question object
  - No direct state access - changes flow up through props

### 7. Properties Panel
`src/components/question/editor/layout/PropertiesPanel.tsx`
- **Responsibility**: Question metadata editing
- **Contains**:
  - Editable metadata fields:
    - Topic/Subtopic selectors
    - Difficulty selector
    - Estimated time input
    - Source
- **Props**:
  - `question`: DatabaseQuestion (current question data)
  - `onFieldChange`: (fieldPath: string, value: any) => void (from Container)
- **State Management**:
  - All fields always editable
  - Calls `onFieldChange` immediately when a field changes

### 0. Question Creation Page
`src/pages/admin/questions/QuestionCreatePage.tsx`
- **Main Component**: `QuestionCreatePage`
- **Sub Components**:
  - `QuestionTypeSelector`: Type selection with preview
  - `QuestionMetadataForm`: Subject/Domain and basic fields
- **Responsibility**: Create new questions with initial metadata and type-specific setup
- **Contains**:
  - Basic Metadata Form:
    - Subject/Domain selection
    - Question type selection:
      - Multiple Choice
      - Numerical
      - Open-ended
    - Title input
  - Question type specific initialization on create:
    - Multiple Choice:
      - `metadata.type`: QuestionType.MULTIPLE_CHOICE
      - `metadata.answerFormat`: {
          hasFinalAnswer: true,
          finalAnswerType: 'multiple_choice',
          requiresSolution: true
        }
    - Numerical:
      - `metadata.type`: QuestionType.NUMERICAL
      - `metadata.answerFormat`: {
          hasFinalAnswer: true,
          finalAnswerType: 'numerical',
          requiresSolution: true
        }
    - Open-ended:
      - `metadata.type`: QuestionType.OPEN
      - `metadata.answerFormat`: {
          hasFinalAnswer: false,
          finalAnswerType: 'none',
          requiresSolution: true
        }
  - Common fields:
    - `metadata.source`: { type: 'ezpass', creatorType: 'human' }
    - Empty content template
- **Props**: none (standalone page)
- **State**:
  - `questionData`: Partial<Question>
- **Actions**:
  - `handleCreate`: () => Promise<void>
- **Behavior**:
  - Single form with required metadata fields
  - Creates question with type-specific initialization
  - Redirects to edit page after creation

## Component Hierarchy
```
QuestionEditPage (manages data & state)
├── QuestionEditorContainer (layout & orchestration)
│   ├── QuestionStatusHeader (navigation & status)
│   └── ContentEditor (content & answer management)
│       ├── TitleSection (editable)
│       ├── ContentSection (rich text)
│       ├── OptionsSection (multiple choice)
│       ├── SolutionSection (explanation & steps)
│       └── EvaluationSection (grading criteria)
└── PropertiesPanel (metadata)
```

## UI/UX Elements
- **Editing Interactions**:
  - Hover states show edit tooltips
  - Click to edit functionality
  - Field validation on blur
  - Unsaved changes warnings
- **Navigation**:
  - Back to library
  - Previous/Next question
  - Question location in list
- **Status Management**:
  - Publication controls
  - Review workflow
  - Validation feedback
- **Save/Cancel**:
  - Fixed action bar at bottom
  - Disabled when no changes
  - Unsaved changes warning
- **Validation Feedback**:
  - Field validation (on blur):
    - Field-level error messages
    - Visual indicators (red borders, warning icons)
  - Current validation state:
    - Shows in status header
    - Affects publish/approve buttons
  - Save button disabled if:
    - No changes made
    - Current changes have blocking errors

## Current Files vs Target Structure

### Pages
Current:
- `src/pages/admin/questions/new.tsx` → rename to `QuestionCreatePage.tsx`
  - Main component: `NewQuestionWizard` → rename to `QuestionCreatePage`
  - Handles question creation and initial setup
  - Sets answer format based on type
  - Creates question in `in_creation` state
  - **Action needed**: Rename file and component to match target structure

- `src/pages/admin/questions/edit.tsx` → rename to `QuestionEditPage.tsx`
  - Main component: `QuestionEditPage`
  - Main page component for editing questions
  - **Action needed**: Rename file to match component name

### Editor Components
Current:
- `src/components/question/editor/QuestionEditorContainer.tsx` ✓ KEEP
  - Main container component
  - Core orchestration logic
  - Already in correct location

- `src/components/question/editor/QuestionEditorHeader.tsx` ✓ KEEP
  - Main component: `QuestionEditorHeader`
  - Contains save/cancel buttons
  - Shows unsaved changes warning
  - Essential editing controls

- `src/components/question/editor/QuestionEditHeader.tsx` → mark as `_delete`
  - DUPLICATE of AdminPageHeader
  - Both show the same page title, ID, and metadata
  - We should use AdminPageHeader instead

- `src/components/question/editor/QuestionEditorLayout.tsx` → investigate
  - Need to check what this does before deciding

- `src/components/question/editor/QuestionEditor.tsx` → investigate
  - Need to check what this does before deciding

- `src/components/admin/PageIdentity.tsx` → rename to `AdminPageHeader.tsx`
  - Main component: `AdminPageHeader`
  - Shows page title with question ID
  - Shows metadata (subject, domain, type)
  - This is the main page header component used across admin pages

- `src/pages/admin/components/questions/editor/content/Header.tsx` → rename to `QuestionStatusHeader.tsx`
  - Main component: `QuestionStatusHeader`
  - Handles all status management (review, publication, validation)
  - Contains navigation controls (back to library, prev/next)
  - Contains status-specific action buttons (approve, publish)
  - Shows update status and validation warnings

- `src/components/question/editor/content/ContentEditor.tsx` ✓ KEEP
  - Main component: `ContentEditor`
  - Handles the main question content editing

## Next Steps

### 1. File Status and Actions

#### Keep (Active Components)
- `src/pages/admin/questions/QuestionEditPage.tsx` ✓ KEEP
  - Main edit page component
  - Uses QuestionEditorContainer
  - Already in correct location

- `src/components/question/editor/QuestionEditorContainer.tsx` ✓ KEEP
  - Main container component
  - Core orchestration logic
  - Already in correct location

- `src/pages/admin/questions/QuestionCreatePage.tsx` ✓ KEEP
  - Main component: `QuestionCreatePage`
  - Handles question creation and initial setup
  - Sets answer format based on type
  - Creates question in `in_creation` state

- `src/components/question/editor/QuestionEditorHeader.tsx` ✓ KEEP
  - Main component: `QuestionEditorHeader`
  - Contains save/cancel buttons
  - Shows unsaved changes warning
  - Essential editing controls

- `src/components/question/editor/QuestionEditorLayout.tsx` → investigate
  - Need to check what this does before deciding

- `src/components/question/editor/QuestionEditor.tsx` → investigate
  - Need to check what this does before deciding

- `src/components/admin/PageIdentity.tsx` → rename to `AdminPageHeader.tsx`
  - Main component: `AdminPageHeader`
  - Shows page title with question ID
  - Shows metadata (subject, domain, type)
  - This is the main page header component used across admin pages

- `src/pages/admin/components/questions/editor/content/Header.tsx` → rename to `QuestionStatusHeader.tsx`
  - Main component: `QuestionStatusHeader`
  - Handles all status management (review, publication, validation)
  - Contains navigation controls (back to library, prev/next)
  - Contains status-specific action buttons (approve, publish)
  - Shows update status and validation warnings

- `src/components/question/editor/content/ContentEditor.tsx` ✓ KEEP
  - Main component: `ContentEditor`
  - Handles the main question content editing

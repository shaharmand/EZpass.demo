# Question System Refactoring Tasks - Updated Priority List

## Major Changes History & Context
### Core Type System Changes
- Moved from separate answer types to unified `FullAnswer` type
- Removed code-related question types and templates
- Consolidated evaluation levels into `DetailedEvalLevel`
- Changed numerical answer validation to include tolerance
- Simplified source types to exam/ezpass only

### Database Schema Changes
- Added `tolerance` field for numerical questions
- Modified `answerEvalLevel` to match new evaluation system
- Removed unused fields (codeTemplate, testCases)
- Added practice session tracking fields

### Known Recurring Issues
1. `AnswerEvalLevel` Sync Issues:
   - Mismatch between DB and frontend types
   - Need to ensure consistency in evaluation levels
   - Watch for type errors in admin panel

2. Database Field Consistency:
   - Some legacy fields still present in DB
   - Need careful migration for numerical tolerance
   - Practice session state fields need validation

3. Admin Panel Issues:
   - Question preview not handling all types correctly
   - Evaluation level display inconsistencies
   - Numerical tolerance input validation needed
   - Legacy fields still visible in some forms

### Technical Debt & Migration Notes
1. Type System:
   - Old question types still exist in some DB records
   - Need to validate all existing questions
   - Some components still expect old type structure
   - Watch for type casting in legacy code

2. Database Migration:
   - Need careful handling of `tolerance` field migration
   - Some questions may have invalid evaluation levels
   - Practice session data structure needs validation
   - Consider adding DB constraints for new fields

3. Component Migration:
   - Admin forms need updates for new fields
   - Question preview needs tolerance support
   - Evaluation display needs standardization
   - Help request system needs proper tracking

4. Performance Concerns:
   - Type checking overhead in practice flow
   - State management complexity increasing
   - Need to optimize re-renders
   - Consider caching for practice session

### Critical Paths & Dependencies
1. Type System Dependencies:
   ```
   Question -> FullAnswer -> EvalLevel
   └─> Affects admin forms
   └─> Affects practice flow
   └─> Affects feedback display
   ```

2. Database Dependencies:
   ```
   tolerance field -> numerical validation
   evalLevel -> feedback system
   practiceState -> help system
   ```

3. Component Flow:
   ```
   Admin Form -> Preview -> Practice -> Feedback
   └─> All need consistent type handling
   └─> All need proper error states
   └─> All need proper loading states
   ```

4. Migration Order:
   1. Update DB schema (careful with existing data)
   2. Update type system (maintain backwards compatibility)
   3. Update components (handle both old and new types)
   4. Clean up legacy code
   5. Add new features (help, practice tracking)

## 1. Remaining Core Type Updates
- [ ] Finalize `Question` interface updates:
  - Verify all question types are properly handled
  - Double check numerical question handling with tolerance
  - Ensure proper typing for feedback and evaluation

## 2. Critical Component Updates
- [ ] Question Practice Flow:
  - Implement proper feedback display
  - Add progress tracking
  - Implement retry functionality
  - Add help request handling

- [ ] Answer Components:
  - Complete numerical answer validation with tolerance
  - Implement proper feedback display
  - Add proper error states and validation messages

## 3. High Priority Features
- [ ] Feedback System:
  - Implement `DetailedEvalLevel` functionality
  - Add proper feedback messages for each level
  - Implement the 80% threshold logic
  - Add Hebrew translations for feedback messages

- [ ] Practice Session Features:
  - Implement help request tracking
  - Add proper skip reason handling
  - Implement practice session state management
  - Add progress tracking and statistics

## 4. Testing & Validation
- [ ] Critical Test Cases:
  - Test numerical answer validation
  - Test feedback system
  - Test practice session state management
  - Test help request functionality

## 5. Performance Optimization
- [ ] Review and optimize:
  - State management efficiency
  - Component re-renders
  - Data fetching strategies
  - Type checking performance

## 6. Documentation Updates
- [ ] Document new features:
  - Practice session workflow
  - Feedback system
  - Help request system
  - Skip handling

## Priority Order
1. Complete numerical answer validation
2. Implement feedback system
3. Add practice session features
4. Add proper error handling
5. Optimize performance
6. Update documentation

## Known Issues to Watch
1. Type checking performance in practice session
2. Feedback display timing and UI
3. State management complexity
4. Error handling coverage 
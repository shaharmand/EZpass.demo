# EZpass Admin Structure Documentation

## Component Organization Principles

### Reusable Components (`src/components/admin/`)
Components that are used across multiple admin pages should be placed here.
- Generic UI components
- Shared functionality
- Components used by multiple admin pages
Example: `AdminPageHeader.tsx` used across all admin pages

### Page-Specific Components (`src/pages/admin/components/`)
Components that are specific to a particular page or feature should be placed here.
- Components used only by one page
- Tightly coupled with their parent page
- Feature-specific implementations
Example: Question editor components specific to the question editing page

### Core/Shared Components (`src/components/`)
Base components used throughout the application:

#### Editor Core (`src/components/editor/`)
- `LexicalEditor.tsx` - Rich text editor component (391 lines)
- `LexicalEditorToolbar.tsx` - Editor toolbar (169 lines)
- `nodes/` - Custom editor nodes

#### Shared UI (`src/components/shared/`)
- `EditableField.tsx` - Editable field wrapper (164 lines)
- `EditableWrapper.tsx` - Editable content wrapper (128 lines)
- `SourceEditor.tsx` - Source code editor (408 lines)

#### Base Components (`src/components/base/`)
Generic UI components used across the application

#### Question Components (`src/components/question/`)
Shared question-related components used in both admin and user interfaces

#### Markdown & Math (`src/components/`)
- `MarkdownRenderer.tsx` - Markdown display (368 lines)
- `MathInput.tsx` - Mathematical input (135 lines)
- `SimpleTextMathInput.tsx` - Simple math input (92 lines)
- `MarkdownEditor.tsx` - Markdown editor (336 lines)

## Directory Structure

### Main Admin Pages (`src/pages/admin/`)
- `Dashboard.tsx` - Main admin dashboard

### Question Management (`src/pages/admin/questions/`)
- `QuestionCreatePage.tsx` - New question creation wizard
- `QuestionLibraryPage.tsx` - Question list and management (1436 lines)
- `QuestionEditPage.tsx` - Question editing interface (362 lines)
- `generate.tsx` - Question generation functionality (278 lines)
- `import.tsx` - Question import functionality (105 lines)
- `index.tsx` - Questions section routing (108 lines)

### Admin Components
#### Shared Components (`src/components/admin/`)
- `AdminPageHeader.tsx` - Common header for admin pages (166 lines)
- `sections/` - Section-specific components

#### Question Components (`src/pages/admin/components/questions/`)
- Editor Components (`editor/`):
  - `QuestionEditor.tsx` - Core editor component (139 lines)
  - `QuestionContainer.tsx` - Container component (77 lines)
  - `QuestionStatusHeader.tsx` - Header with status (82 lines)
  - Subdirectories:
    - `content/` - Content editing components:
      - `Content.tsx` - Main content editor (730 lines)
      - `Metadata.tsx` - Metadata editor (704 lines)
      - `MetadataSection.tsx` - ⚠️ Possible duplicate (604 lines)
      - `QuestionStatusHeader.tsx` - ⚠️ Duplicate of parent dir (718 lines)
      - `QuestionEditorContainer.tsx` - ⚠️ Possible duplicate (31 lines)
      - `QuestionStatusManager.tsx` - Status management (115 lines)
      - `SubjectDomainSelector.tsx` - Subject/domain selection (249 lines)
      - `Solution.tsx` - Solution editor (188 lines)
      - `JsonData.tsx` - JSON data display (70 lines)
      - `ImportInfo.tsx` - Import information (45 lines)
    - `properties/` - Property editing components
    - `toolbar/` - Editor toolbar components
    - `solution/` - Solution editing components
    - `evaluation/` - Evaluation criteria components

### Admin Services (`src/services/admin/`)
- `questionStorage.ts` - Question data management
- `questionImporter.ts` - Question import functionality
- `importers/` - Various question importers:
  - `BaseImporter.ts` - Base importer class
  - `WordPressEzPassImporter.ts` - WordPress importer

### Layout (`src/layouts/`)
- `AdminLayout.tsx` - Main admin layout wrapper

## Routing Configuration
File: `src/routes/adminRoutes.tsx`
```typescript
{
  path: 'admin',
  children: [
    { index: true, element: <AdminDashboard /> },
    {
      path: 'questions',
      children: [
        { index: true, element: <QuestionLibraryPage /> },
        { path: 'new', element: <QuestionCreatePage /> },
        { path: ':id', element: <QuestionEditPageWrapper /> },
        { path: 'import', element: <QuestionImport /> },
        { path: 'generate', element: <QuestionGenerator /> }
      ]
    }
  ]
}
```

## Recently Cleaned Files
1. ✓ Removed `src/pages/admin/QuestionLibrary.tsx` (redundant with QuestionLibraryPage)
2. ✓ Removed `src/pages/admin/components/questions/editor/NewQuestionEditor.tsx` (redundant with QuestionCreatePage)
3. ✓ Removed `src/pages/admin/components/questions/create/CreateQuestionWizard.tsx` (moved to QuestionCreatePage)

## Potential Redundancies Found
1. Duplicate Status Headers:
   - `editor/QuestionStatusHeader.tsx`
   - `editor/content/QuestionStatusHeader.tsx`
   - **Action Needed**: Determine which one is actively used and remove the other

2. Duplicate Metadata Components:
   - `editor/content/Metadata.tsx`
   - `editor/content/MetadataSection.tsx`
   - **Action Needed**: Review both files and merge functionality if needed

3. Multiple Container Components:
   - `editor/QuestionContainer.tsx`
   - `editor/content/QuestionEditorContainer.tsx`
   - **Action Needed**: Review usage and consolidate if possible

## Component Relationships
1. Question Creation Flow:
   - `QuestionCreatePage` → Creates question → Redirects to `QuestionEditPage`

2. Question Editing Flow:
   - `QuestionEditPageWrapper` (handles data loading)
   - └─ `QuestionEditPage` (main editor interface)
      - └─ `QuestionEditor` (core editing functionality)
         - └─ Various editor components in subdirectories

## TODO
- [ ] Review and document contents of editor subdirectories
- [ ] Identify any unused components
- [ ] Check for duplicate functionality
- [ ] Document component dependencies
- [ ] Verify all imports/exports
- [ ] Resolve duplicate QuestionStatusHeader
- [ ] Resolve duplicate Metadata components
- [ ] Resolve duplicate Container components
- [ ] Review and organize admin services
- [ ] Document admin layout structure
- [ ] Reorganize components based on reusability:
      - Move reusable components to src/components/admin/
      - Keep page-specific components in src/pages/admin/components/ 
- [ ] Review each component systematically:
      1. Check usage and necessity
      2. Verify correct placement
      3. Ensure proper documentation
      4. Look for potential improvements

## Component Organization Guidelines

1. Core/Base Components (`
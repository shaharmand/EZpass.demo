/**
 * Programming language types for CS exams
 */
export enum ProgrammingLanguage {
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
  C = 'c',
  CPP = 'cpp',
  CSHARP = 'csharp',
  PHP = 'php',
  RUBY = 'ruby',
  GO = 'go',
  RUST = 'rust',
  SWIFT = 'swift',
  KOTLIN = 'kotlin',
  SCALA = 'scala',
  TYPESCRIPT = 'typescript',
  OTHER = 'other'
}

export type SupportedProgrammingLanguage = 
  | ProgrammingLanguage.JAVASCRIPT
  | ProgrammingLanguage.PYTHON
  | ProgrammingLanguage.JAVA
  | ProgrammingLanguage.CPP
  | ProgrammingLanguage.CSHARP
  | ProgrammingLanguage.PHP
  | ProgrammingLanguage.RUBY
  | ProgrammingLanguage.GO
  | ProgrammingLanguage.RUST
  | ProgrammingLanguage.SWIFT
  | ProgrammingLanguage.KOTLIN
  | ProgrammingLanguage.SCALA
  | ProgrammingLanguage.TYPESCRIPT; 
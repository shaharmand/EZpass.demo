import xlsx from 'xlsx';
import type { Question } from '../src/types/question';

interface ExcelQuestion {
  content: string;
  solution: string;
  topic: string;
  subtopic: string;
  difficulty: string;
  // ... other Excel columns
}

function convertExcelToQuestions(filePath: string): Question[] {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: ExcelQuestion[] = xlsx.utils.sheet_to_json(sheet);

  return rows.map((row, index) => ({
    id: `excel_${index}`,
    content: {
      text: row.content,
      format: 'markdown'
    },
    solution: {
      text: row.solution,
      format: 'markdown'
    },
    metadata: {
      topic: row.topic,
      subtopic: row.subtopic,
      difficulty: row.difficulty,
      source: 'excel',
      lastUsed: new Date(),
      tags: []
    }
  }));
} 
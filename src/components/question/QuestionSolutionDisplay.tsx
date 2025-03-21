import React from 'react';
import { Space } from 'antd';
import { QuestionSolution } from './QuestionSolution';
import { QuestionEvaluation } from './QuestionEvaluation';
import { Question, FullAnswer } from '../../types/question';

interface QuestionSolutionDisplayProps {
  /** The solution and evaluation data */
  solution: FullAnswer['solution'];
  /** The school's answer for evaluation */
  schoolAnswer: FullAnswer;
  /** The evaluation guidelines */
  evaluationGuidelines: Question['evaluationGuidelines'];
  /** Whether to show the evaluation rubric */
  showEvaluation?: boolean;
  /** Whether to wrap sections in Cards */
  useCards?: boolean;
  /** Optional class name for styling */
  className?: string;
}

/**
 * Component for displaying a question's solution and evaluation criteria.
 * Used alongside QuestionAndOptionsDisplay when solution should be shown
 * (teacher view, admin view, or after question completion in practice mode).
 */
export const QuestionSolutionDisplay: React.FC<QuestionSolutionDisplayProps> = ({
  solution,
  schoolAnswer,
  evaluationGuidelines,
  showEvaluation = true,
  useCards = true,
  className = ''
}) => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }} className={className}>
      {/* Solution Section */}
      {solution && (
        <QuestionSolution 
          solution={solution}
          showCard={useCards}
        />
      )}

      {/* Evaluation Section */}
      {showEvaluation && (
        <QuestionEvaluation 
          evaluation={evaluationGuidelines}
          showCard={useCards}
        />
      )}
    </Space>
  );
}; 
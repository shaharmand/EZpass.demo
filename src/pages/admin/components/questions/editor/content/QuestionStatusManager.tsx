import React from 'react';
import { 
  DatabaseQuestion, 
  Question, 
  PublicationStatusEnum, 
  ReviewStatusEnum, 
  ValidationStatus,
  PublicationMetadata,
  ReviewMetadata,
  AIGeneratedFields
} from '../../../../../../types/question';
import { questionStorage } from '../../../../../../services/admin/questionStorage';
import { message } from 'antd';

interface QuestionStatusManagerProps {
  question: DatabaseQuestion;
  onQuestionUpdated: (updatedQuestion: DatabaseQuestion) => void;
  hasUnsavedChanges?: boolean;
  children: (props: {
    canPublish: boolean;
    canApprove: boolean;
    onApprove: () => Promise<void>;
    onPublish: () => Promise<void>;
    isPendingReview: boolean;
    isDraft: boolean;
  }) => React.ReactElement;
}

export const QuestionStatusManager = ({
  question,
  onQuestionUpdated,
  hasUnsavedChanges = false,
  children
}: QuestionStatusManagerProps): React.ReactElement => {
  // Compute status flags
  const isPendingReview = question.review_status === ReviewStatusEnum.PENDING_REVIEW;
  const isApproved = question.review_status === ReviewStatusEnum.APPROVED;
  const isDraft = question.publication_status === PublicationStatusEnum.DRAFT;
  const hasValidationErrors = question.validation_status === ValidationStatus.ERROR;

  // Compute permissions - prevent status changes if there are unsaved changes
  const canPublish = !hasUnsavedChanges && ((isDraft && isApproved && !hasValidationErrors) || !isDraft);
  const canApprove = !hasUnsavedChanges && ((isPendingReview && !hasValidationErrors) || isApproved);

  // Handle review status change
  const handleApprove = async () => {
    if (hasUnsavedChanges) {
      message.error('יש לשמור את השינויים לפני שינוי סטטוס');
      return;
    }

    try {
      // First save the status change
      await questionStorage.saveQuestion({
        id: question.id,
        data: question.data,
        publication_status: question.publication_status,
        validation_status: question.validation_status,
        review_status: isPendingReview ? ReviewStatusEnum.APPROVED : ReviewStatusEnum.PENDING_REVIEW
      });

      // Then fetch the updated question with all metadata
      const updatedQuestion = await questionStorage.getQuestion(question.id);
      if (!updatedQuestion) {
        throw new Error('Failed to fetch updated question');
      }

      onQuestionUpdated(updatedQuestion);
      message.success(isPendingReview ? 'השאלה אושרה בהצלחה' : 'השאלה הועברה לבדיקה');
    } catch (error) {
      console.error('Failed to update review status:', error);
      message.error('Failed to update review status');
    }
  };

  // Handle publication status change
  const handlePublish = async () => {
    if (hasUnsavedChanges) {
      message.error('יש לשמור את השינויים לפני שינוי סטטוס');
      return;
    }

    try {
      // First save the status change
      await questionStorage.saveQuestion({
        id: question.id,
        data: question.data,
        publication_status: isDraft ? PublicationStatusEnum.PUBLISHED : PublicationStatusEnum.DRAFT,
        validation_status: question.validation_status,
        review_status: question.review_status
      });

      // Then fetch the updated question with all metadata
      const updatedQuestion = await questionStorage.getQuestion(question.id);
      if (!updatedQuestion) {
        throw new Error('Failed to fetch updated question');
      }

      onQuestionUpdated(updatedQuestion);
      message.success(isDraft ? 'השאלה פורסמה בהצלחה' : 'השאלה הועברה לטיוטה');
    } catch (error) {
      console.error('Failed to update publication status:', error);
      message.error('Failed to update publication status');
    }
  };

  return children({
    canPublish,
    canApprove,
    onApprove: handleApprove,
    onPublish: handlePublish,
    isPendingReview,
    isDraft
  });
}; 
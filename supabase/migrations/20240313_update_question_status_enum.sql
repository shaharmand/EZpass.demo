-- Update question_status enum to remove unused statuses
BEGIN;
  /* First update all questions to use 'draft' status */
  UPDATE questions 
  SET status = 'draft'::question_status
  WHERE status IN ('imported', 'generated');

  /* Drop the default constraint */
  ALTER TABLE questions 
    ALTER COLUMN status DROP DEFAULT;

  /* Create new enum type */
  CREATE TYPE question_status_new AS ENUM ('draft', 'approved');
  
  /* Update the table to use the new type */
  ALTER TABLE questions 
    ALTER COLUMN status TYPE question_status_new 
    USING (status::text::question_status_new);
  
  /* Drop the old type */
  DROP TYPE question_status;
  
  /* Rename the new type to the old name */
  ALTER TYPE question_status_new RENAME TO question_status;

  /* Add back the default with new type */
  ALTER TABLE questions 
    ALTER COLUMN status SET DEFAULT 'draft'::question_status;
COMMIT; 
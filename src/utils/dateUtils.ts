export const formatTimeUntilExam = (targetDate: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  const examDate = new Date(targetDate);
  examDate.setHours(0, 0, 0, 0); // Reset time to start of day
  
  // Check if exam is today
  if (examDate.getTime() === today.getTime()) {
    return 'הבחינה היום!';
  }
  
  const diffTime = Math.abs(targetDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Validate if date is in the past
  if (targetDate.getTime() < today.getTime()) {
    return 'תאריך היעד עבר';
  }

  if (diffDays <= 21) {
    return `בעוד ${diffDays} ימים`;
  } else if (diffDays <= 90) {
    const weeks = Math.floor(diffDays / 7);
    return `בעוד ${weeks} שבועות`;
  } else {
    const months = Math.floor(diffDays / 30.44); // More accurate month calculation
    return `בעוד ${months} חודשים`;
  }
};

export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}; 
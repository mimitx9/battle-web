import { useEffect } from 'react';
import { trackQuizStart, trackQuizComplete, trackQuizAbandon, trackPageViewCustom } from '@/lib/analytics';

interface UseQuizTrackingProps {
  quizType: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  attempt?: any;
  quizSections?: any[] | null;
  onQuizStart?: () => void;
}

export const useQuizTracking = ({ 
  quizType, 
  attempt, 
  quizSections, 
  onQuizStart 
}: UseQuizTrackingProps) => {
  
  // Track page view on mount
  useEffect(() => {
    trackPageViewCustom(`quiz-${quizType.toLowerCase()}`, 'quiz');
  }, [quizType]);

  // Track quiz start when attempt and sections are loaded
  useEffect(() => {
    if (attempt && quizSections && quizSections.length > 0) {
      trackQuizStart(quizType);
      onQuizStart?.();
    }
  }, [attempt, quizSections, quizType, onQuizStart]);

  // Track quiz completion
  const trackCompletion = (score?: number, timeSpent?: number) => {
    trackQuizComplete(quizType, score, timeSpent);
  };

  // Track quiz abandonment
  const trackAbandonment = (questionNumber?: number) => {
    trackQuizAbandon(quizType, questionNumber);
  };

  return {
    trackCompletion,
    trackAbandonment,
  };
};

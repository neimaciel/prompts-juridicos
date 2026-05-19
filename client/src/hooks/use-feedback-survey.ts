import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserIdentifier } from './use-user-identifier';
import { apiRequest } from '@/lib/queryClient';

interface FeedbackSubmission {
  satisfactionScore: number;
  usageFrequency: number;
  suggestions: string;
}

interface FeedbackSurveyStatus {
  shouldShow: boolean;
}

export function useFeedbackSurvey() {
  const { userIdentifier, isLoading: isLoadingIdentifier } = useUserIdentifier();
  const [hasViewedPromptCard, setHasViewedPromptCard] = useState(false);
  const [surveyShown, setSurveyShown] = useState(false);
  const queryClient = useQueryClient();

  // Check if user should see the feedback survey
  const { data: surveyStatus, isLoading: isCheckingSurvey } = useQuery({
    queryKey: ['feedback-survey-status', userIdentifier],
    queryFn: async (): Promise<FeedbackSurveyStatus> => {
      if (!userIdentifier) {
        return { shouldShow: false };
      }
      
      const response = await fetch(`/api/feedback/should-show/${encodeURIComponent(userIdentifier)}`);
      if (!response.ok) {
        throw new Error('Failed to check survey status');
      }
      return response.json();
    },
    enabled: !!userIdentifier && !isLoadingIdentifier,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false
  });

  // Submit feedback survey
  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedback: FeedbackSubmission) => {
      return apiRequest('POST', '/api/feedback/submit', {
        ...feedback,
        userIdentifier
      });
    },
    onSuccess: () => {
      // Invalidate the survey status to prevent showing again
      queryClient.invalidateQueries({ queryKey: ['feedback-survey-status'] });
      setSurveyShown(true);
    }
  });

  // Trigger to mark that user has viewed a prompt card
  const markPromptCardViewed = () => {
    setHasViewedPromptCard(true);
  };

  // Check if survey should be shown
  const shouldShowSurvey = 
    !isLoadingIdentifier && 
    !isCheckingSurvey && 
    hasViewedPromptCard && 
    !surveyShown && 
    surveyStatus?.shouldShow === true;

  // Reset survey shown status when user identifier changes (e.g., login/logout)
  useEffect(() => {
    setSurveyShown(false);
  }, [userIdentifier]);

  return {
    shouldShowSurvey,
    isLoading: isLoadingIdentifier || isCheckingSurvey,
    markPromptCardViewed,
    submitFeedback: submitFeedbackMutation.mutateAsync,
    isSubmitting: submitFeedbackMutation.isPending,
    dismissSurvey: () => setSurveyShown(true)
  };
}
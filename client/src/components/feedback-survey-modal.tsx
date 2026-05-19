import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, ThumbsUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    satisfactionScore: number;
    usageFrequency: number;
    suggestions: string;
  }) => Promise<void>;
}

export function FeedbackSurveyModal({ isOpen, onClose, onSubmit }: FeedbackSurveyModalProps) {
  // Temporariamente desabilitado para resolver problema de tela preta
  return null;
}
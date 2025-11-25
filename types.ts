export interface Criterion {
  name: string;
  score: number;
  comment: string;
}

export interface AnalysisResult {
  title: string;
  totalScore: number;
  summary: string;
  criteria: Criterion[];
  advice: string; // General photography advice
  avatarCritique: string; // Specific advice on avatar, makeup, costume
  posingAdvice: string; // Advice on positioning and posing
  accessoryRecommendations: string[]; // List of recommended accessories
  technicalDetails?: string;
}

export interface HistoryItem extends AnalysisResult {
  id: string;
  timestamp: number;
  thumbnail: string; // Small base64 image for list view
}

export interface LoadingStep {
  message: string;
  status: 'pending' | 'active' | 'completed';
}
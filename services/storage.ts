import { AnalysisResult, HistoryItem } from '../types';

const STORAGE_KEY = 'vrc_photo_critic_history';

export const saveAnalysisResult = (result: AnalysisResult, thumbnailBase64: string): void => {
  try {
    const newItem: HistoryItem = {
      ...result,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      thumbnail: thumbnailBase64,
    };

    const existingData = localStorage.getItem(STORAGE_KEY);
    const history: HistoryItem[] = existingData ? JSON.parse(existingData) : [];

    // Add new item
    history.push(newItem);

    // Limit storage to avoid QuotaExceededError (keep last 50 items roughly)
    // In a real app, we'd use IndexedDB or a backend.
    const limitedHistory = history.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Failed to save analysis result to localStorage:', error);
    // If quota exceeded, we might want to alert the user or silently fail.
    // For this demo, we just log it.
  }
};

export const getRankings = (period: 'day' | 'week' | 'month'): HistoryItem[] => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) return [];

    const history: HistoryItem[] = JSON.parse(existingData);
    const now = Date.now();
    
    // Filter based on period
    const filtered = history.filter(item => {
      const diff = now - item.timestamp;
      const day = 24 * 60 * 60 * 1000;
      
      switch (period) {
        case 'day': return diff < day;
        case 'week': return diff < 7 * day;
        case 'month': return diff < 30 * day;
        default: return true;
      }
    });

    // Sort by Total Score Descending
    return filtered.sort((a, b) => b.totalScore - a.totalScore);
  } catch (error) {
    console.error('Failed to retrieve rankings:', error);
    return [];
  }
};
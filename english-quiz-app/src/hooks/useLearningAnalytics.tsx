'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LearningSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  quizType: 'listening' | 'reading' | 'writing' | 'speaking' | 'general';
  questionsAnswered: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
  aiInteractions: number;
  topicsDiscussed: string[];
  confidenceLevel: number; // 0-1
}

export interface LearningAnalytics {
  totalSessions: number;
  totalTimeSpent: number; // in seconds
  averageAccuracy: number;
  strongestSkill: string;
  weakestSkill: string;
  improvementTrend: number; // percentage
  aiUsageFrequency: number;
  learningStreak: number; // consecutive days
  lastActiveDate: Date;
}

export interface LearningGoal {
  id: string;
  type: 'accuracy' | 'time' | 'consistency' | 'ai_usage';
  target: number;
  current: number;
  deadline: Date;
  isAchieved: boolean;
}

export function useLearningAnalytics() {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [analytics, setAnalytics] = useState<LearningAnalytics>({
    totalSessions: 0,
    totalTimeSpent: 0,
    averageAccuracy: 0,
    strongestSkill: '',
    weakestSkill: '',
    improvementTrend: 0,
    aiUsageFrequency: 0,
    learningStreak: 0,
    lastActiveDate: new Date()
  });
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);

  const sessionStartTimeRef = useRef<Date | null>(null);
  const questionStartTimeRef = useRef<Date | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('learning_sessions');
    const savedGoals = localStorage.getItem('learning_goals');
    
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined
        }));
        setSessions(parsedSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    }
    
    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals).map((goal: any) => ({
          ...goal,
          deadline: new Date(goal.deadline)
        }));
        setGoals(parsedGoals);
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    }
  }, []);

  // Save to localStorage whenever sessions or goals change
  useEffect(() => {
    localStorage.setItem('learning_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('learning_goals', JSON.stringify(goals));
  }, [goals]);

  // Calculate analytics whenever sessions change
  useEffect(() => {
    if (sessions.length === 0) return;

    const totalSessions = sessions.length;
    const totalTimeSpent = sessions.reduce((sum, session) => sum + session.timeSpent, 0);
    const totalQuestions = sessions.reduce((sum, session) => sum + session.questionsAnswered, 0);
    const totalCorrect = sessions.reduce((sum, session) => sum + session.correctAnswers, 0);
    const averageAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
    
    // Calculate skill performance
    const skillPerformance = sessions.reduce((acc, session) => {
      if (!acc[session.quizType]) {
        acc[session.quizType] = { total: 0, correct: 0 };
      }
      acc[session.quizType].total += session.questionsAnswered;
      acc[session.quizType].correct += session.correctAnswers;
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    const skillAccuracies = Object.entries(skillPerformance).map(([skill, data]) => ({
      skill,
      accuracy: data.total > 0 ? data.correct / data.total : 0
    }));

    const strongestSkill = skillAccuracies.length > 0 
      ? skillAccuracies.reduce((max, current) => current.accuracy > max.accuracy ? current : max).skill
      : '';
    
    const weakestSkill = skillAccuracies.length > 0
      ? skillAccuracies.reduce((min, current) => current.accuracy < min.accuracy ? current : min).skill
      : '';

    // Calculate improvement trend (last 7 sessions vs previous 7)
    const recentSessions = sessions.slice(-7);
    const previousSessions = sessions.slice(-14, -7);
    
    const recentAccuracy = recentSessions.length > 0 
      ? recentSessions.reduce((sum, s) => sum + (s.correctAnswers / s.questionsAnswered), 0) / recentSessions.length
      : 0;
    
    const previousAccuracy = previousSessions.length > 0
      ? previousSessions.reduce((sum, s) => sum + (s.correctAnswers / s.questionsAnswered), 0) / previousSessions.length
      : 0;
    
    const improvementTrend = previousAccuracy > 0 ? ((recentAccuracy - previousAccuracy) / previousAccuracy) * 100 : 0;

    // Calculate AI usage frequency
    const totalAIInteractions = sessions.reduce((sum, session) => sum + session.aiInteractions, 0);
    const aiUsageFrequency = totalSessions > 0 ? totalAIInteractions / totalSessions : 0;

    // Calculate learning streak
    const learningStreak = calculateLearningStreak(sessions);

    // Get last active date
    const lastActiveDate = sessions.length > 0 ? sessions[sessions.length - 1].startTime : new Date();

    setAnalytics({
      totalSessions,
      totalTimeSpent,
      averageAccuracy,
      strongestSkill,
      weakestSkill,
      improvementTrend,
      aiUsageFrequency,
      learningStreak,
      lastActiveDate
    });
  }, [sessions]);

  // Calculate learning streak
  const calculateLearningStreak = useCallback((sessions: LearningSession[]): number => {
    if (sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    const currentDate = new Date(today);
    
    // Check if there was activity today
    const hasActivityToday = sessions.some(session => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === currentDate.getTime();
    });
    
    if (!hasActivityToday) {
      currentDate.setDate(currentDate.getDate() - 1);
      streak = 0;
    } else {
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count consecutive days with activity
    while (true) {
      const hasActivity = sessions.some(session => {
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === currentDate.getTime();
      });
      
      if (!hasActivity) break;
      
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }, []);

  // Start a new learning session
  const startSession = useCallback((quizType: LearningSession['quizType']) => {
    const session: LearningSession = {
      id: `session_${Date.now()}`,
      startTime: new Date(),
      quizType,
      questionsAnswered: 0,
      correctAnswers: 0,
      timeSpent: 0,
      aiInteractions: 0,
      topicsDiscussed: [],
      confidenceLevel: 0.5
    };
    
    setCurrentSession(session);
    sessionStartTimeRef.current = new Date();
  }, []);

  // End current session
  const endSession = useCallback(() => {
    if (!currentSession || !sessionStartTimeRef.current) return;

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - sessionStartTimeRef.current.getTime()) / 1000);
    
    const completedSession: LearningSession = {
      ...currentSession,
      endTime,
      timeSpent
    };
    
    setSessions(prev => [...prev, completedSession]);
    setCurrentSession(null);
    sessionStartTimeRef.current = null;
  }, [currentSession]);

  // Record question answered
  const recordQuestion = useCallback((isCorrect: boolean, timeSpent?: number) => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
    } : null);
  }, [currentSession]);

  // Record AI interaction
  const recordAIInteraction = useCallback((topic?: string) => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      aiInteractions: prev.aiInteractions + 1,
      topicsDiscussed: topic ? [...prev.topicsDiscussed, topic] : prev.topicsDiscussed
    } : null);
  }, [currentSession]);

  // Update confidence level
  const updateConfidence = useCallback((confidence: number) => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      confidenceLevel: Math.max(0, Math.min(1, confidence))
    } : null);
  }, [currentSession]);

  // Create learning goal
  const createGoal = useCallback((type: LearningGoal['type'], target: number, deadline: Date) => {
    const goal: LearningGoal = {
      id: `goal_${Date.now()}`,
      type,
      target,
      current: 0,
      deadline,
      isAchieved: false
    };
    
    setGoals(prev => [...prev, goal]);
    return goal.id;
  }, []);

  // Update goal progress
  const updateGoalProgress = useCallback((goalId: string, current: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const isAchieved = current >= goal.target;
        return { ...goal, current, isAchieved };
      }
      return goal;
    }));
  }, []);

  // Get insights and recommendations
  const getInsights = useCallback(() => {
    const insights = [];
    
    if (analytics.improvementTrend > 10) {
      insights.push({
        type: 'positive',
        message: `Tuyệt vời! Bạn đang cải thiện ${analytics.improvementTrend.toFixed(1)}% so với tuần trước.`,
        action: 'Tiếp tục duy trì thói quen học tập này!'
      });
    } else if (analytics.improvementTrend < -10) {
      insights.push({
        type: 'warning',
        message: `Điểm số của bạn giảm ${Math.abs(analytics.improvementTrend).toFixed(1)}% so với tuần trước.`,
        action: 'Hãy xem lại chiến lược học tập và sử dụng AI hỗ trợ nhiều hơn.'
      });
    }
    
    if (analytics.learningStreak >= 7) {
      insights.push({
        type: 'positive',
        message: `Bạn đã duy trì thói quen học tập ${analytics.learningStreak} ngày liên tiếp!`,
        action: 'Đây là một thành tích tuyệt vời, hãy tiếp tục!'
      });
    } else if (analytics.learningStreak === 0) {
      insights.push({
        type: 'info',
        message: 'Bạn chưa có hoạt động học tập nào hôm nay.',
        action: 'Hãy bắt đầu một session học tập ngay!'
      });
    }
    
    if (analytics.weakestSkill && analytics.strongestSkill) {
      insights.push({
        type: 'info',
        message: `Kỹ năng mạnh nhất của bạn là ${analytics.strongestSkill}, yếu nhất là ${analytics.weakestSkill}.`,
        action: `Hãy tập trung luyện tập ${analytics.weakestSkill} nhiều hơn.`
      });
    }
    
    if (analytics.aiUsageFrequency < 2) {
      insights.push({
        type: 'suggestion',
        message: 'Bạn có thể sử dụng AI hỗ trợ nhiều hơn để cải thiện hiệu quả học tập.',
        action: 'Thử hỏi AI về các chiến lược học tập phù hợp với bạn.'
      });
    }
    
    return insights;
  }, [analytics]);

  // Get weekly progress
  const getWeeklyProgress = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklySessions = sessions.filter(session => 
      session.startTime >= weekAgo
    );
    
    const totalQuestions = weeklySessions.reduce((sum, session) => sum + session.questionsAnswered, 0);
    const totalCorrect = weeklySessions.reduce((sum, session) => sum + session.correctAnswers, 0);
    const totalTime = weeklySessions.reduce((sum, session) => sum + session.timeSpent, 0);
    const totalAIInteractions = weeklySessions.reduce((sum, session) => sum + session.aiInteractions, 0);
    
    return {
      sessions: weeklySessions.length,
      questions: totalQuestions,
      accuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
      timeSpent: totalTime,
      aiInteractions: totalAIInteractions,
      averageSessionTime: weeklySessions.length > 0 ? totalTime / weeklySessions.length : 0
    };
  }, [sessions]);

  return {
    // Current session
    currentSession,
    startSession,
    endSession,
    recordQuestion,
    recordAIInteraction,
    updateConfidence,
    
    // Analytics
    analytics,
    sessions,
    getInsights,
    getWeeklyProgress,
    
    // Goals
    goals,
    createGoal,
    updateGoalProgress,
    
    // Utilities
    calculateLearningStreak
  };
}


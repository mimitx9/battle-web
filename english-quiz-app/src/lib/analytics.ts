// Google Analytics 4 tracking utilities
declare global {
  interface Window {
    dataLayer: any[];
    gtag: {
      (...args: any[]): void;
      q: any[];
      l: number;
    };
  }
}

export const GA_MEASUREMENT_ID = 'G-B7BEXMV3E5';

// Initialize Google Analytics - chỉ khởi tạo dataLayer và gtag function
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Initialize gtag function
    window.gtag = window.gtag || function(...args: any[]) {
      (window.gtag.q = window.gtag.q || []).push(args);
    };
    window.gtag.l = +new Date();

    // Configure GA4
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title || document.title,
    });
  }
};

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', eventName, {
      ...parameters,
      event_category: parameters?.event_category || 'general',
      event_label: parameters?.event_label || '',
      value: parameters?.value || 0,
    });
  }
};

// Specific tracking functions for your app
export const trackUserRegistration = (method: string = 'email') => {
  trackEvent('user_registration', {
    event_category: 'user',
    event_label: method,
    value: 1,
  });
};

export const trackUserLogin = (method: string = 'email') => {
  trackEvent('user_login', {
    event_category: 'user',
    event_label: method,
    value: 1,
  });
};

export const trackQuizStart = (quizType: string, difficulty?: string) => {
  trackEvent('quiz_start', {
    event_category: 'quiz',
    event_label: quizType,
    quiz_type: quizType,
    difficulty: difficulty,
    value: 1,
  });
};

export const trackQuizComplete = (quizType: string, score?: number, timeSpent?: number) => {
  trackEvent('quiz_complete', {
    event_category: 'quiz',
    event_label: quizType,
    quiz_type: quizType,
    score: score,
    time_spent: timeSpent,
    value: score || 0,
  });
};

export const trackQuizAbandon = (quizType: string, questionNumber?: number) => {
  trackEvent('quiz_abandon', {
    event_category: 'quiz',
    event_label: quizType,
    quiz_type: quizType,
    question_number: questionNumber,
    value: 1,
  });
};

export const trackPageViewCustom = (pageName: string, pageType?: string) => {
  trackEvent('page_view', {
    event_category: 'navigation',
    event_label: pageName,
    page_name: pageName,
    page_type: pageType,
    value: 1,
  });
};

// Conversion tracking
export const trackConversion = (conversionName: string, value?: number) => {
  trackEvent('conversion', {
    event_category: 'conversion',
    event_label: conversionName,
    conversion_name: conversionName,
    value: value || 1,
  });
};

// User engagement tracking
export const trackEngagement = (action: string, content?: string, duration?: number) => {
  trackEvent('user_engagement', {
    event_category: 'engagement',
    event_label: action,
    action: action,
    content: content,
    duration: duration,
    value: duration || 1,
  });
};

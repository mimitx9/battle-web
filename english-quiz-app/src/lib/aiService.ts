// AI Service for enhanced responses and real-time processing
export interface AIResponse {
  content: string;
  type: 'text' | 'suggestion' | 'quiz_help' | 'error';
  confidence: number;
  sources?: string[];
  metadata?: {
    context?: string;
    difficulty?: string;
    language?: string;
  };
}

export interface AIConfig {
  model?: 'gpt-3.5-turbo' | 'gpt-4' | 'claude' | 'gemini' | 'local';
  temperature?: number;
  maxTokens?: number;
  enableRealTime?: boolean;
}

class AIService {
  private config: AIConfig;
  private apiKey?: string;
  private baseUrl?: string;

  constructor(config: AIConfig = {}) {
    this.config = {
      model: 'gemini',
      temperature: 0.7,
      maxTokens: 500,
      enableRealTime: false,
      ...config
    };
  }

  // Enhanced context-aware response generation
  async generateResponse(
    userInput: string,
    context: string,
    userPreferences: {
      language: 'vi' | 'en';
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      showHints: boolean;
    },
    messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): Promise<AIResponse> {
    try {
      // Always use external AI services (LLM)
      return await this.generateExternalResponse(userInput, context, userPreferences, messages);
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        content: 'Xin lỗi, hiện không thể xử lý yêu cầu. Vui lòng thử lại sau.',
        type: 'error',
        confidence: 0,
        metadata: { context }
      };
    }
  }

  // Note: All responses now come from LLM; no local templates

  // External AI service integration via Next API route
  private async generateExternalResponse(
    userInput: string,
    context: string,
    userPreferences: any,
    messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): Promise<AIResponse> {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : undefined;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: userInput,
          context,
          preferences: userPreferences,
          model: this.config.model === 'gemini' ? 'gemini' : (this.config.model === 'gpt-3.5-turbo' || this.config.model === 'gpt-4' ? this.config.model : 'gpt-4'),
          messages: messages || []
        })
      });

      if (!res.ok) {
        // Handle 401 error
        if (res.status === 401) {
          const { handle401Error } = await import('./authUtils');
          handle401Error();
          return {
            content: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            type: 'error',
            confidence: 0,
            metadata: { context }
          };
        }
        
        const txt = await res.text();
        console.error('AI API error:', txt);
        return {
          content: 'Xin lỗi, hiện không thể xử lý yêu cầu. Vui lòng thử lại sau.',
          type: 'error',
          confidence: 0,
          metadata: { context }
        };
      }

      const data = await res.json();
      return {
        content: data.content,
        type: data.type ?? 'text',
        confidence: data.confidence ?? 0.8,
        metadata: data.metadata ?? { context }
      };
    } catch (e) {
      console.error('AI API exception:', e);
      return {
        content: 'Xin lỗi, hiện không thể xử lý yêu cầu. Vui lòng thử lại sau.',
        type: 'error',
        confidence: 0,
        metadata: { context }
      };
    }
  }

  // Real-time processing capabilities
  async processRealTime(
    userInput: string,
    context: string,
    callback: (response: AIResponse) => void
  ): Promise<void> {
    if (!this.config.enableRealTime) {
      const response = await this.generateResponse(userInput, context, {
        language: 'vi',
        difficulty: 'intermediate',
        showHints: true
      });
      callback(response);
      return;
    }

    // Simulate real-time processing with streaming
    const words = userInput.split(' ');
    let currentResponse = '';
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      currentResponse += words[i] + ' ';
      
      callback({
        content: currentResponse,
        type: 'text',
        confidence: 0.5,
        metadata: { context }
      });
    }
  }
}

export default AIService;

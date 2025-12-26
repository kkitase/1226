
export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  partnerRole: string;
  systemPrompt: string;
  icon: string;
}

export interface AssessmentResult {
  scores: {
    empathy: number;      // 共感力
    logic: number;        // 論理性
    clarity: number;      // 分かりやすさ
    confidence: number;   // 自信・堂々とした態度
    persuasion: number;   // 説得力
  };
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  advice: string;
}

export enum AppState {
  IDLE = 'IDLE',
  CHATTING = 'CHATTING',
  ASSESSING = 'ASSESSING',
  RESULT = 'RESULT'
}

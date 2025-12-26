
import React from 'react';
import { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'interview',
    title: '採用面接',
    description: '希望する企業の採用面接シーン。自己PRや志望動機を話してみましょう。',
    partnerRole: '面接官',
    icon: '💼',
    systemPrompt: 'あなたは厳格だが公平な採用面接官です。ユーザーの回答に対して深掘りする質問を投げかけてください。'
  },
  {
    id: 'customer_complaint',
    title: 'クレーム対応',
    description: '怒っている顧客への対応。共感を示しつつ、適切に解決へ導けるか試されます。',
    partnerRole: '不満を持つ顧客',
    icon: '😠',
    systemPrompt: 'あなたは購入した製品が壊れていて非常に怒っている顧客です。最初は感情的ですが、誠実な対応には少しずつ心を開きます。'
  },
  {
    id: 'networking',
    title: '交流会・ネットワーキング',
    description: '初対面の人との雑談。自然な会話から共通点を見つけ、良い印象を与えましょう。',
    partnerRole: '交流会の参加者',
    icon: '🤝',
    systemPrompt: 'あなたはIT企業のエンジニアで、技術交流会に参加しています。明るく社交的ですが、少し専門的な話題も好みます。'
  },
  {
    id: 'performance_review',
    title: '上司への昇給交渉',
    description: '自身の成果をアピールし、上司に昇給や条件の改善を提案するシーンです。',
    partnerRole: '部門マネージャー',
    icon: '📈',
    systemPrompt: 'あなたは合理的で成果を重視するマネージャーです。納得感のある根拠がない限り、首を縦に振りません。'
  }
];

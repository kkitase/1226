
import React, { useState, useEffect, useRef } from 'react';
import { Message, Scenario, AppState, AssessmentResult } from './types';
import { SCENARIOS } from './constants';
import { getChatResponse, assessConversation } from './services/gemini';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const startChat = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setMessages([{ role: 'model', text: `こんにちは。${scenario.title}を始めましょう。準備はいいですか？` }]);
    setState(AppState.CHATTING);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedScenario || isTyping) return;

    const userMessage: Message = { role: 'user', text: inputText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await getChatResponse(selectedScenario, newMessages);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndChat = async () => {
    if (!selectedScenario || messages.length < 3) {
      if (confirm('まだ会話が少ないです。終了して評価しますか？')) {
        runAssessment();
      }
      return;
    }
    runAssessment();
  };

  const runAssessment = async () => {
    if (!selectedScenario) return;
    setState(AppState.ASSESSING);
    try {
      const result = await assessConversation(selectedScenario, messages);
      setAssessment(result);
      setState(AppState.RESULT);
    } catch (error) {
      console.error(error);
      alert('評価中にエラーが発生しました。');
      setState(AppState.CHATTING);
    }
  };

  const resetApp = () => {
    setState(AppState.IDLE);
    setSelectedScenario(null);
    setMessages([]);
    setAssessment(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">C</div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">CommAI</h1>
          </div>
          {state !== AppState.IDLE && (
            <button 
              onClick={resetApp}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              トップに戻る
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-5xl flex-1 px-4 py-8">
        {state === AppState.IDLE && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl">コミュニケーション力を磨く。</h2>
              <p className="text-slate-500 text-lg">AIとの実践的なロールプレイで、あなたの話し方のクセや強みを分析します。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SCENARIOS.map((scenario) => (
                <div 
                  key={scenario.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                  onClick={() => startChat(scenario)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                      {scenario.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-800">{scenario.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{scenario.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      セッションを開始 →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state === AppState.CHATTING && selectedScenario && (
          <div className="h-[calc(100vh-12rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            {/* Chat Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedScenario.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-800 leading-none">{selectedScenario.title}</h3>
                  <span className="text-xs text-slate-400">相手: {selectedScenario.partnerRole}</span>
                </div>
              </div>
              <button 
                onClick={handleEndChat}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-red-200"
              >
                終了して評価
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                  }`}>
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex gap-2 max-w-4xl mx-auto"
              >
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="メッセージを入力..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:bg-slate-50"
                />
                <button 
                  type="submit"
                  disabled={isTyping || !inputText.trim()}
                  className="bg-indigo-600 text-white p-3 px-6 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  送信
                </button>
              </form>
            </div>
          </div>
        )}

        {state === AppState.ASSESSING && (
          <div className="flex flex-col items-center justify-center h-96 animate-pulse">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-xl font-bold text-slate-800">評価を生成中...</h3>
            <p className="text-slate-500">あなたのコミュニケーションを多角的に分析しています。</p>
          </div>
        )}

        {state === AppState.RESULT && assessment && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl overflow-hidden">
              <div className="text-center mb-10">
                <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 inline-block">
                  Assessment Result
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900">評価レポート</h2>
                <p className="text-slate-500 mt-2">今回のコミュニケーションの分析結果です。</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
                {/* Chart */}
                <div className="h-80 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: '共感力', A: assessment.scores.empathy, full: 100 },
                      { subject: '論理性', A: assessment.scores.logic, full: 100 },
                      { subject: '明瞭さ', A: assessment.scores.clarity, full: 100 },
                      { subject: '自信', A: assessment.scores.confidence, full: 100 },
                      { subject: '説得力', A: assessment.scores.persuasion, full: 100 },
                    ]}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                      <Radar
                        name="Score"
                        dataKey="A"
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Score Summary */}
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-2xl">
                    <h4 className="font-bold text-slate-800 mb-2">総合フィードバック</h4>
                    <p className="text-slate-600 leading-relaxed text-sm md:text-base">{assessment.overallFeedback}</p>
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                  <h4 className="text-emerald-800 font-bold flex items-center gap-2 mb-4">
                    <span className="bg-emerald-200 p-1 rounded-full text-xs text-emerald-800">✓</span> 
                    あなたの強み
                  </h4>
                  <ul className="space-y-2">
                    {assessment.strengths.map((s, i) => (
                      <li key={i} className="text-emerald-700 text-sm flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                  <h4 className="text-amber-800 font-bold flex items-center gap-2 mb-4">
                    <span className="bg-amber-200 p-1 rounded-full text-xs text-amber-800">!</span> 
                    改善のヒント
                  </h4>
                  <ul className="space-y-2">
                    {assessment.improvements.map((s, i) => (
                      <li key={i} className="text-amber-700 text-sm flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Advice */}
              <div className="bg-indigo-600 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                </div>
                <h4 className="text-indigo-100 font-bold text-sm uppercase tracking-widest mb-2">Next Step</h4>
                <h3 className="text-xl font-bold mb-4">実践に向けた具体的なアドバイス</h3>
                <p className="text-indigo-50 leading-relaxed italic">"{assessment.advice}"</p>
              </div>

              <div className="mt-10 flex justify-center gap-4">
                <button 
                  onClick={resetApp}
                  className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-md hover:shadow-lg"
                >
                  新しいセッションを開始
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-slate-400 text-sm border-t border-slate-100 mt-12">
        <p>© 2024 CommAI Communication Coaching Tool</p>
      </footer>
    </div>
  );
};

export default App;

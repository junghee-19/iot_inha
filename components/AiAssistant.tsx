import React, {
    useState,
    useRef,
    useEffect,
    FormEvent,
  } from 'react';
  
  interface AiAssistantProps {
    buildingId?: string | number | null;
    buildingName?: string | null;
    context?: string | null;
  }
  
  type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
  };
  
  const AiAssistant: React.FC<AiAssistantProps> = ({
    buildingId = null,
    buildingName = null,
    context = null,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
    // textarea 자동 높이 조절
    useEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, [question]);
  
    // 메시지 변경 시 맨 아래로 스크롤
    useEffect(() => {
      if (!messagesEndRef.current) return;
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, isOpen]);
  
    // ESC로 닫기
    useEffect(() => {
      if (!isOpen) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);
  
    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (!question.trim() || isLoading) return;
  
      const userContent = question.trim();
  
      // 입력창 비우기 먼저
      setQuestion('');
      setError(null);
      setIsLoading(true);
  
      const newUserMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userContent,
      };
  
      // 1) 사용자 메시지를 히스토리에 추가
      setMessages((prev) => [...prev, newUserMessage]);
  
      try {
        const res = await fetch('/api/building-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: userContent,
            buildingId,
            buildingName,
            context,
            // 지금은 서버에 이전 히스토리는 안 보내지만,
            // 나중에 필요하면 messages도 같이 보낼 수 있음
          }),
        });
  
        if (!res.ok) {
          throw new Error(`서버 오류가 발생했습니다. (status: ${res.status})`);
        }
  
        const data = await res.json();
        const answerText: string =
          data.answer ?? '답변을 가져오지 못했습니다.';
  
        const newAssistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: answerText,
        };
  
        // 2) GPT 답변도 히스토리에 추가
        setMessages((prev) => [...prev, newAssistantMessage]);
      } catch (err: any) {
        setError(err.message ?? '요청 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <>
        {/* 🔘 우측 하단 떠 있는 AI 버튼 */}
        <button
          type="button"
          aria-label="도움말 어시스턴트"
          aria-pressed={isOpen}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
        >
          <span className="text-xl font-bold">?</span>
        </button>
  
        {/* 🪟 모달 패널 */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end items-center pointer-events-none">
            <div className="absolute inset-0" />
  
            <div
              role="dialog"
              aria-label="어시스턴트 패널"
              tabIndex={-1}
              className="pointer-events-auto fixed right-2 top-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col"
              style={{ maxHeight: 520 }}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-semibold text-gray-900">
                    AI 어시스턴트
                  </h2>
                  <p className="text-xs text-gray-500">
                    캠퍼스/건물과 관련된 내용을 채팅으로 물어보세요.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="닫기"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="m6 6 12 12M6 18 18 6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
  
              {/* 채팅 영역 */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 히스토리 */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.length === 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      예시 질문:
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>“학식은 어디에서 먹을 수 있어?”</li>
                        <li>“도서관 열람실 이용 시간을 알려줘.”</li>
                        <li>“체육관에 뭐가 있는지 알려줘.”</li>
                      </ul>
                    </div>
                  )}
  
                  {messages.map((m) => {
                    const isUser = m.role === 'user';
                    return (
                      <div
                        key={m.id}
                        className={`flex ${
                          isUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                            isUser
                              ? 'bg-slate-900 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 px-3 py-2 text-xs text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150" />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-300" />
                      </div>
                    </div>
                  )}
  
                  <div ref={messagesEndRef} />
                </div>
  
                {/* 입력폼 */}
                <form
                  onSubmit={handleSubmit}
                  className="border-t border-gray-100 px-3 pt-2 pb-3"
                >
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <textarea
                        ref={textareaRef}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent min-h-[40px] max-h-40"
                        dir="auto"
                        rows={1}
                        maxLength={800}
                        placeholder="메시지를 입력하세요…"
                        aria-label="어시스턴트에게 질문 입력"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      aria-label="질문 전송"
                      aria-disabled={isLoading || !question.trim()}
                      disabled={isLoading || !question.trim()}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="m12.75 7.15 4.38 4.38a.75.75 0 1 0 1.06-1.06l-4.95-4.95a1.75 1.75 0 0 0-2.48 0l-4.95 4.95a.75.75 0 0 0 1.06 1.06l4.38-4.38v11.6a.75.75 0 1 0 1.5 0V7.15z"
                        />
                      </svg>
                    </button>
                  </div>
  
                  {error && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {error}
                    </p>
                  )}
                </form>
  
                {/* 푸터 안내 */}
                <div className="px-4 pb-2 text-[11px] text-gray-400">
                  이 어시스턴트는 AI를 활용해 답변을 제공합니다. 실제 시설 정보와
                  다를 수 있으니, 중요한 내용은 학교 공식 안내를 다시 확인해 주세요.
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
  
  export default AiAssistant;
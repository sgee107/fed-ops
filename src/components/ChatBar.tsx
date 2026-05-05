import ReactMarkdown from 'react-markdown';
import type { CompanyProfile, RFPResult } from '@/types';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

interface ChatBarProps {
  profile: CompanyProfile | null;
  rfpContext: RFPResult[];
  onFindRFPs: () => void;
  searching: boolean;
  messages: ChatMessage[];
  onMessagesChange: (msgs: ChatMessage[]) => void;
}

export default function ChatBar({
  profile,
  rfpContext,
  onFindRFPs,
  searching,
  messages,
  onMessagesChange,
}: ChatBarProps) {
  const disabled = !profile || searching;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('chat') as HTMLInputElement;
    const text = input.value.trim();
    if (!text || disabled) return;

    input.value = '';
    const userMsg: ChatMessage = { role: 'user', content: text };
    const next = [...messages, userMsg];
    onMessagesChange(next);

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    onMessagesChange([...next, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          profileId: profile?.id,
          rfpContext,
        }),
      });

      if (!res.ok || !res.body) {
        onMessagesChange([...next, { role: 'assistant', content: 'Error: could not get response.' }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        onMessagesChange([...next, { role: 'assistant', content }]);
      }
    } catch {
      onMessagesChange([...next, { role: 'assistant', content: 'Error: request failed.' }]);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={onFindRFPs}
          disabled={disabled}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {searching
            ? 'Searching…'
            : profile
            ? `Find RFPs for ${profile.name}`
            : 'Select a profile to search'}
        </button>
      </div>

      {messages.length > 0 && (
        <div className="max-h-64 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.content
                  ? msg.role === 'assistant'
                    ? <div className="prose prose-sm max-w-none prose-p:my-1 prose-p:text-gray-900 prose-headings:my-2 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-li:my-0.5 prose-li:text-gray-900 prose-ul:my-1 prose-ol:my-1"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    : msg.content
                  : <span className="opacity-50 italic">Thinking…</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-100">
        <input
          name="chat"
          type="text"
          disabled={disabled}
          placeholder={profile ? 'Ask about these opportunities…' : 'Select a profile first'}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

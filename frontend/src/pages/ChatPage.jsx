/**
 * Botivate HR Support - Chatbot Interface
 * Premium messenger-style UI. "Chatbot = Only Door."
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Button, Badge } from '../components/ui/Components';
import SupportCard from '../components/SupportCard';
import { chatAPI, approvalAPI } from '../api';
import toast from 'react-hot-toast';
import {
  HiOutlinePaperAirplane, HiOutlinePaperClip, HiOutlineInformationCircle,
  HiOutlineCheck, HiOutlineX,
} from 'react-icons/hi';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-greet on mount
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage('hi');
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    const newUserMessage = { role: 'user', content: userMsg, time: new Date() };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatAPI.send({ message: userMsg });
      const aiMessage = {
        role: 'ai',
        content: res.data.reply,
        actions: res.data.actions || [],
        time: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: 'Sorry, I encountered an issue. Please try again.',
          actions: [],
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle interactive actions (Approve/Reject buttons in chat)
  const handleAction = async (action, requestId) => {
    if (action === 'approve' || action === 'reject') {
      try {
        await approvalAPI.decide(requestId, {
          status: action === 'approve' ? 'approved' : 'rejected',
          decision_note: `${action}d via chat by ${user.employee_name}`,
        });
        toast.success(`Request ${action}d successfully!`);
      } catch {
        toast.error(`Failed to ${action} the request.`);
      }
    }
    if (action === 'mark_urgent') {
      toast.success('Request marked as urgent!');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">

        {/* ── Chat Header ────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                HR Assistant
              </h2>
              <p className="text-xs text-[var(--color-accent)]">● Online</p>
            </div>
          </div>
          <button
            onClick={() => setShowSupport(!showSupport)}
            className="p-2 rounded-xl hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] cursor-pointer"
            title="Company Support"
          >
            <HiOutlineInformationCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Support Card Overlay */}
        {showSupport && (
          <div className="px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)] animate-fadeInUp">
            <SupportCard companyId={user?.company_id} alwaysVisible />
          </div>
        )}

        {/* ── Messages Area ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div
                className={`
                  max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-[var(--color-primary)] text-white rounded-br-md'
                    : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-md shadow-[var(--shadow-sm)]'
                  }
                `}
              >
                {/* Message Content */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Interactive Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                    {msg.actions.map((action, actionIdx) => {
                      if (action.type === 'button') {
                        return (
                          <button
                            key={actionIdx}
                            onClick={() => handleAction(action.action, action.requestId)}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                              ${action.action === 'approve'
                                ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                : action.action === 'reject'
                                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                  : 'bg-white/10 text-white/80 hover:bg-white/20'
                              }
                            `}
                          >
                            {action.action === 'approve' && <HiOutlineCheck className="inline w-3 h-3 mr-1" />}
                            {action.action === 'reject' && <HiOutlineX className="inline w-3 h-3 mr-1" />}
                            {action.label}
                          </button>
                        );
                      }
                      if (action.type === 'info') {
                        return (
                          <Badge key={actionIdx} variant="primary">
                            {action.text}
                          </Badge>
                        );
                      }
                      if (action.type === 'support_card') {
                        return (
                          <button
                            key={actionIdx}
                            onClick={() => setShowSupport(true)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 cursor-pointer"
                          >
                            📞 {action.text}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                {/* Timestamp */}
                <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/50' : 'text-[var(--color-text-secondary)]'}`}>
                  {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 rounded-2xl rounded-bl-md shadow-[var(--shadow-sm)]">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input Bar ──────────────────────────────── */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-end gap-3">
            <button
              className="p-2.5 rounded-xl hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-all cursor-pointer flex-shrink-0"
              title="Attach file"
            >
              <HiOutlinePaperClip className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="
                  w-full px-4 py-3 rounded-xl text-sm resize-none
                  bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]
                  border border-[var(--color-border)]
                  focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20
                  outline-none transition-all
                  placeholder:text-[var(--color-text-secondary)]/50
                "
                style={{ maxHeight: '120px' }}
              />
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              variant="primary"
              className="flex-shrink-0 !rounded-xl !p-3"
            >
              <HiOutlinePaperAirplane className="w-5 h-5 rotate-90" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Send, Bot, User, Sparkles, CheckCircle2, HelpCircle, Volume2, AlertCircle, MessageSquare } from 'lucide-react';
import { Customer } from '@/types';

interface LiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  callId: string | null;
  callMode?: string;
  onCallEnded?: () => void;
}

interface ChatMessage {
  speaker: 'AI' | 'CUSTOMER';
  text: string;
  timestamp: string;
}

export const LiveCallModal: React.FC<LiveCallModalProps> = ({
  isOpen,
  onClose,
  customer,
  callId,
  callMode = 'simulated',
  onCallEnded,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<'Connecting' | 'In Call' | 'AI Speaking' | 'Listening' | 'Completed' | 'Failed'>('Connecting');
  const [isMicActive, setIsMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [collectedSlots, setCollectedSlots] = useState<Record<string, any>>({});
  const [missingSlots, setMissingSlots] = useState<string[]>([]);
  
  const socketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect WebSocket when modal opens
  useEffect(() => {
    if (!isOpen || !callId) return;

    setMessages([]);
    setStatus('Connecting');
    setCollectedSlots({});
    setMicError(null);

    const wsUrl = `ws://localhost:8000/ws/call/${callId}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus('In Call');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'ai_response') {
        setStatus('AI Speaking');
        setMessages((prev) => [
          ...prev,
          {
            speaker: 'AI',
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        if (data.collected_slots) setCollectedSlots(data.collected_slots);
        if (data.missing_slots) setMissingSlots(data.missing_slots);

        // Play AI Neural Voice Audio
        if (data.audio_base64) {
          if (audioRef.current) {
            audioRef.current.pause();
          }
          const audio = new Audio(data.audio_base64);
          audioRef.current = audio;
          audio.play().catch((err) => console.log('Audio autoplay prevented or error:', err));
          audio.onended = () => {
            setStatus(data.is_finished ? 'Completed' : 'Listening');
          };
        } else {
          setTimeout(() => {
            setStatus(data.is_finished ? 'Completed' : 'Listening');
          }, 1500);
        }

        if (data.is_finished) {
          setStatus('Completed');
        }
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setStatus('Failed');
    };

    ws.onclose = () => {
      if (status !== 'Completed') setStatus('Completed');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [isOpen, callId]);

  // Robust Speech Recognition (Web Speech API)
  const toggleMic = () => {
    setMicError(null);

    const isSpeechAvailable = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    if (!isSpeechAvailable) {
      setMicError('Speech recognition is not supported in this browser. Please type or click sample prompts below!');
      return;
    }

    if (isMicActive) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsMicActive(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsMicActive(true);
        setStatus('Listening');
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          sendCustomerMessage(transcript);
        }
        setIsMicActive(false);
      };

      recognition.onerror = (err: any) => {
        setIsMicActive(false);
        const errType = err.error || '';
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setMicError('Microphone permission blocked. Please allow mic access or use text input / sample prompts below.');
        } else if (errType === 'no-speech' || errType === 'aborted') {
          // Benign error: user didn't speak before timeout
          console.log('Speech recognition timed out or stopped.');
        } else {
          setMicError(`Speech input note: ${errType || 'Interrupted'}. You can type or click quick responses below.`);
        }
      };

      recognition.onend = () => {
        setIsMicActive(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Recognition start exception:', e);
      setIsMicActive(false);
      setMicError('Could not start microphone. You can type customer responses directly below.');
    }
  };

  const sendCustomerMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !socketRef.current) return;

    // Append to messages
    setMessages((prev) => [
      ...prev,
      {
        speaker: 'CUSTOMER',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Send payload over WebSocket
    socketRef.current.send(
      JSON.stringify({
        event: 'user_speak',
        user_text: text,
      })
    );

    setInputText('');
    setStatus('In Call');
    setMicError(null);
  };

  const handleEndCall = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event: 'end_call' }));
      socketRef.current.close();
    }
    setStatus('Completed');
    if (onCallEnded) onCallEnded();
  };

  if (!isOpen || !customer) return null;

  // Sample quick customer responses for easy 1-click testing
  const quickPrompts = [
    `I am looking for a 500 LPH RO system for my hotel in Bangalore.`,
    `Our budget is around ₹1,00,000 and installation is needed within 1 month.`,
    `It is primarily for kitchen and guest drinking water.`,
    `Could you send a technical quotation?`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                {customer.name.charAt(0)}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                status === 'In Call' || status === 'AI Speaking' || status === 'Listening'
                  ? 'bg-emerald-500 animate-ping'
                  : status === 'Completed'
                  ? 'bg-slate-500'
                  : 'bg-amber-500'
              }`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">{customer.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {customer.phone_number}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Product: <span className="text-cyan-400 font-medium">{customer.product}</span> ({customer.purpose})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status Pill */}
            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              status === 'AI Speaking'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : status === 'Listening'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : status === 'Completed'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              <Volume2 className={`w-3.5 h-3.5 ${status === 'AI Speaking' ? 'animate-bounce' : ''}`} />
              <span>{status}</span>
            </div>

            <button
              onClick={handleEndCall}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        </div>

        {/* Dynamic Waveform Visualizer */}
        <div className="h-12 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-center px-6 gap-1">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                status === 'AI Speaking'
                  ? 'bg-gradient-to-t from-cyan-500 to-indigo-400 animate-pulse'
                  : status === 'Listening'
                  ? 'bg-gradient-to-t from-emerald-500 to-teal-400 animate-pulse'
                  : 'bg-slate-800'
              }`}
              style={{
                height:
                  status === 'AI Speaking' || status === 'Listening'
                    ? `${Math.max(12, Math.sin(i * 0.4 + Date.now() * 0.005) * 32 + 20)}px`
                    : '6px',
              }}
            />
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 flex-1 overflow-hidden">
          
          {/* Left / Top: Agentic Slot Tracking Panel */}
          <div className="p-4 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> GenAI Agent Slots State
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Capacity', value: collectedSlots.capacity },
                  { label: 'Location', value: collectedSlots.location },
                  { label: 'Application', value: collectedSlots.application },
                  { label: 'Budget', value: collectedSlots.budget },
                  { label: 'Timeline', value: collectedSlots.timeline },
                ].map((slot, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      slot.value
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-medium">{slot.label}</span>
                    {slot.value ? (
                      <span className="font-semibold flex items-center gap-1 text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" /> {slot.value}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/90 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <HelpCircle className="w-3 h-3" /> Missing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <h5 className="text-[11px] font-semibold text-slate-400 mb-1">Call Mode Info</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                Mode: <span className="text-cyan-400 font-semibold uppercase">{callMode}</span>. 
                Using Microsoft Edge Neural Voice (<span className="text-indigo-400">en-IN-Prabhat</span>) and Google Gemini 2.5 Flash for agentic reasoning.
              </p>
            </div>
          </div>

          {/* Right / Main: Turn-by-Turn Live Chat Bubbles */}
          <div className="md:col-span-2 flex flex-col h-full overflow-hidden bg-slate-900/40">
            
            {/* Transcript Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <Bot className="w-12 h-12 text-cyan-400/50 mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-slate-300">Initiating Two-Way AI Call...</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Connecting customer {customer.phone_number} with HawkAI agent engine.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 ${
                      msg.speaker === 'CUSTOMER' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        msg.speaker === 'AI'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {msg.speaker === 'AI' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                        msg.speaker === 'CUSTOMER'
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 opacity-80 text-[10px]">
                        <span className="font-semibold">{msg.speaker === 'AI' ? 'HawkAI Agent' : customer.name}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Customer Voice Response Prompts */}
            <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/80">
              <p className="text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-cyan-400" /> Quick Customer Responses (1-Click Voice Trigger):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => sendCustomerMessage(prompt)}
                    disabled={status === 'Completed'}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-cyan-300 transition-all text-left truncate max-w-xs disabled:opacity-40"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Mic Error Notice */}
            {micError && (
              <div className="px-3 py-1.5 bg-amber-500/10 border-t border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>{micError}</span>
              </div>
            )}

            {/* Customer Speech Input Controls */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
              <button
                onClick={toggleMic}
                title={isMicActive ? 'Stop Listening' : 'Speak into Microphone'}
                className={`p-3 rounded-xl transition-all ${
                  isMicActive
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {isMicActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-cyan-400" />}
              </button>

              <input
                type="text"
                placeholder={isMicActive ? 'Listening to speech...' : 'Type customer response (e.g. "500 LPH RO for my hotel in Bangalore")...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendCustomerMessage()}
                disabled={status === 'Completed'}
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500 disabled:opacity-50"
              />

              <button
                onClick={() => sendCustomerMessage()}
                disabled={!inputText.trim() || status === 'Completed'}
                className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

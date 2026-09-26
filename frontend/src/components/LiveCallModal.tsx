'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Send, Bot, User, Sparkles, CheckCircle2, HelpCircle, Volume2, AlertCircle, MessageSquare, X, ArrowLeft, Radio } from 'lucide-react';
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
  const [autoMicLoop, setAutoMicLoop] = useState(true); // Hands-free continuous voice mode default ON
  const [micError, setMicError] = useState<string | null>(null);
  const [collectedSlots, setCollectedSlots] = useState<Record<string, any>>({});
  const [missingSlots, setMissingSlots] = useState<string[]>([]);
  
  const socketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const isCallActiveRef = useRef(false);
  const autoMicLoopRef = useRef(true);

  useEffect(() => {
    autoMicLoopRef.current = autoMicLoop;
  }, [autoMicLoop]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Automatically start microphone listening (Hands-free voice mode)
  const startListeningAutomatically = useCallback(() => {
    if (!isCallActiveRef.current || !autoMicLoopRef.current) return;

    const isSpeechAvailable = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    if (!isSpeechAvailable) return;

    // Stop previous instance if active
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
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
        setIsMicActive(false);
        if (transcript && transcript.trim()) {
          sendCustomerMessage(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        setIsMicActive(false);
        const errType = err.error || '';
        if (errType === 'no-speech' || errType === 'aborted') {
          // Restart listening automatically if call is still active & in auto mode
          if (isCallActiveRef.current && autoMicLoopRef.current && status !== 'Completed') {
            setTimeout(() => {
              if (isCallActiveRef.current && autoMicLoopRef.current) {
                startListeningAutomatically();
              }
            }, 600);
          }
        } else if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setMicError('Microphone permission blocked. Please allow mic access in browser or use text input below.');
        }
      };

      recognition.onend = () => {
        setIsMicActive(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Auto recognition start exception:', e);
      setIsMicActive(false);
    }
  }, []);

  // Triggered when AI finishes speaking its sentence
  const onAISpeechEnd = useCallback(() => {
    if (!isCallActiveRef.current) return;
    setStatus('Listening');

    // Automatically shift to listening to customer's voice!
    if (autoMicLoopRef.current) {
      setTimeout(() => {
        startListeningAutomatically();
      }, 400);
    }
  }, [startListeningAutomatically]);

  // Dual Voice Playback Engine (Edge Neural Base64 Audio + Browser SpeechSynthesis)
  const speakVoice = useCallback((text: string, audioBase64?: string | null) => {
    // Stop any ongoing mic before AI speaks
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsMicActive(false);

    if (audioBase64) {
      try {
        if (audioRef.current) {
          try {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          } catch (e) {}
        }
        const audio = new Audio(audioBase64);
        audioRef.current = audio;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              audio.onended = () => {
                onAISpeechEnd();
              };
            })
            .catch(() => {
              // Silently fallback to Web Speech Synthesis if audio autoplay is blocked
              speakBrowserSpeech(text);
            });
          return;
        }
      } catch (e) {
        console.log('Error playing base64 audio:', e);
      }
    }
    speakBrowserSpeech(text);
  }, [onAISpeechEnd]);

  const speakBrowserSpeech = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        utterance.rate = 1.0;
        utterance.onend = () => {
          onAISpeechEnd();
        };
        utterance.onerror = () => {
          onAISpeechEnd();
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        onAISpeechEnd();
      }
    } else {
      onAISpeechEnd();
    }
  };

  // Connect WebSocket when modal opens
  useEffect(() => {
    if (!isOpen || !callId) return;

    setMessages([]);
    setStatus('Connecting');
    setCollectedSlots({});
    setMicError(null);
    isCallActiveRef.current = true;

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

        if (data.is_finished) {
          isCallActiveRef.current = false;
          setStatus('Completed');
        }

        // Play AI Voice Response out loud & auto-trigger mic when done!
        speakVoice(data.text, data.audio_base64);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setStatus('Failed');
      isCallActiveRef.current = false;
    };

    ws.onclose = () => {
      isCallActiveRef.current = false;
      if (status !== 'Completed') setStatus('Completed');
    };

    return () => {
      isCallActiveRef.current = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [isOpen, callId, speakVoice]);

  // Manual Mic Toggle
  const toggleMic = () => {
    if (isMicActive) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsMicActive(false);
    } else {
      startListeningAutomatically();
    }
  };

  const sendCustomerMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !socketRef.current) return;

    // Append customer message to transcript
    setMessages((prev) => [
      ...prev,
      {
        speaker: 'CUSTOMER',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    // Stop speech synthesis & mic
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsMicActive(false);

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

  // Close call modal & return to Dashboard
  const handleEndCall = () => {
    isCallActiveRef.current = false;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event: 'end_call' }));
      socketRef.current.close();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setStatus('Completed');
    if (onCallEnded) onCallEnded();
    onClose();
  };

  if (!isOpen || !customer) return null;

  // Sample quick customer responses for 1-click voice trigger
  const quickPrompts = [
    `I am looking for a 500 LPH RO system for my hotel in Bangalore.`,
    `Our budget is around ₹1,00,000 and installation is needed within 1 month.`,
    `It is primarily for kitchen and guest drinking water.`,
    `Could you send a technical quotation?`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleEndCall}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {customer.name.charAt(0)}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                status === 'In Call' || status === 'AI Speaking' || status === 'Listening'
                  ? 'bg-emerald-500 animate-ping'
                  : status === 'Completed'
                  ? 'bg-slate-500'
                  : 'bg-amber-500'
              }`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">{customer.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {customer.phone_number}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Product: <span className="text-cyan-400 font-medium">{customer.product}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Auto-Mic Loop Toggle Indicator */}
            <button
              onClick={() => setAutoMicLoop(!autoMicLoop)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
                autoMicLoop
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title="Toggle Hands-Free Continuous Voice Loop"
            >
              <Radio className={`w-3 h-3 ${autoMicLoop ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>Auto-Voice: {autoMicLoop ? 'ON' : 'OFF'}</span>
            </button>

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

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>

            {/* Close X Button */}
            <button
              onClick={handleEndCall}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 rounded-full hover:bg-slate-800 transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Waveform Visualizer */}
        <div className="h-10 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-center px-6 gap-1">
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
                    ? `${Math.max(10, Math.sin(i * 0.4 + Date.now() * 0.005) * 26 + 16)}px`
                    : '5px',
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
              <h5 className="text-[11px] font-semibold text-slate-400 mb-1">Hands-Free Voice Loop</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                Mode: <span className="text-cyan-400 font-semibold uppercase">{callMode}</span>. 
                When AI finishes speaking, microphone <span className="text-emerald-400 font-semibold">automatically opens</span> for continuous hands-free voice conversation.
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
                <MessageSquare className="w-3 h-3 text-cyan-400" /> Quick Responses (1-Click Voice & AI Answer Trigger):
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
                title={isMicActive ? 'Mic Active (Listening...)' : 'Start Microphone Listening'}
                className={`p-3 rounded-xl transition-all ${
                  isMicActive
                    ? 'bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {isMicActive ? <Mic className="w-5 h-5 text-white animate-bounce" /> : <Mic className="w-5 h-5 text-cyan-400" />}
              </button>

              <input
                type="text"
                placeholder={isMicActive ? 'Listening to your voice...' : 'Type customer response (e.g. "500 LPH RO for my hotel in Bangalore")...'}
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

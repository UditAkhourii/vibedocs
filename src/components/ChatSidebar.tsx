"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "model";
    content: string;
}

export function ChatSidebar({ documentId }: { documentId: string }) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "model", content: "Hi! I'm your SuperDocs assistant. Ask me anything about this documentation." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch('/api/docs/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    documentId
                })
            });

            if (!response.ok) throw new Error("Failed to send message");
            if (!response.body) return;

            // Stream handling
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedResponse = "";

            setMessages(prev => [...prev, { role: "model", content: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                accumulatedResponse += chunk;

                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = accumulatedResponse;
                    return newMsgs;
                });
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "model", content: "Sorry, I ran into an issue. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background/40 backdrop-blur-xl border-l border-border/40 w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border/40 bg-background/20 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-foreground">SuperDocs AI</h3>
                    <p className="text-[10px] text-muted-foreground">Context-Aware Assistant</p>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'model' && (
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center mt-1">
                                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                        )}
                        <div
                            className={`
                                max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                                ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : 'bg-muted/50 border border-border/40 text-foreground rounded-tl-sm prose prose-invert prose-sm max-w-none'
                                }
                            `}
                        >
                            {msg.role === 'user' ? (
                                msg.content
                            ) : (
                                <ReactMarkdown
                                    components={{
                                        code: ({ node, className, children, ...props }: any) => {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return match ? (
                                                <code className="block bg-black/30 p-2 rounded text-xs overflow-x-auto" {...props}>
                                                    {children}
                                                </code>
                                            ) : (
                                                <code className="bg-white/10 px-1 py-0.5 rounded text-xs" {...props}>
                                                    {children}
                                                </code>
                                            )
                                        }
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs pl-9">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Thinking...</span>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/40 bg-background/20 shrink-0">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about this documentation..."
                        className="w-full bg-muted/40 border border-border/40 rounded-xl pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 focus:bg-muted/60 transition-all placeholder:text-muted-foreground"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Plane, Hotel, Car, Calendar, Users, MapPin } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! 👋 I'm your AI travel assistant. I can help you book flights, hotels, or arrange ground transportation. What would you like to do today?",
      timestamp: new Date(),
      suggestions: ['Book a flight', 'Find a hotel', 'Arrange Uber', 'Check my bookings']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(message);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();

    // Flight booking
    if (lowerMessage.includes('flight') || lowerMessage.includes('fly')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "Great! I can help you book a flight. ✈️\n\nCould you tell me:\n• Where are you flying from?\n• Where are you flying to?\n• What date would you like to travel?\n• How many passengers?",
        timestamp: new Date(),
        suggestions: ['Lagos to Nairobi', 'Accra to Johannesburg', 'See popular routes']
      };
    }

    // Hotel booking
    if (lowerMessage.includes('hotel') || lowerMessage.includes('accommodation')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "Perfect! Let me help you find a hotel. 🏨\n\nPlease provide:\n• Which city?\n• Check-in date?\n• Check-out date?\n• Number of guests?",
        timestamp: new Date(),
        suggestions: ['Hotels in Nairobi', 'Hotels in Lagos', 'Hotels in Accra']
      };
    }

    // Uber/Transportation
    if (lowerMessage.includes('uber') || lowerMessage.includes('transport') || lowerMessage.includes('ride')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "I can arrange ground transportation for you! 🚗\n\nLet me know:\n• Pick-up location?\n• Drop-off location?\n• Date and time?\n• Number of passengers?",
        timestamp: new Date(),
        suggestions: ['Airport transfer', 'Hotel to office', 'Full day rental']
      };
    }

    // Check bookings
    if (lowerMessage.includes('booking') || lowerMessage.includes('reservation') || lowerMessage.includes('check')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "You currently have:\n\n✅ 3 upcoming flights\n✅ 2 hotel reservations\n✅ 1 pending Uber booking\n\nWould you like to see details of any specific booking?",
        timestamp: new Date(),
        suggestions: ['Show flights', 'Show hotels', 'Show all bookings']
      };
    }

    // Specific route examples
    if (lowerMessage.includes('lagos') && lowerMessage.includes('nairobi')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "Great choice! Lagos to Nairobi route. 🛫\n\nI found several options:\n\n✈️ Ethiopian Airlines - $450\nDeparture: 10:30 AM\nDuration: 6h 30m\n\n✈️ Kenya Airways - $520\nDeparture: 2:15 PM\nDuration: 5h 45m\n\nShall I proceed with one of these or show more options?",
        timestamp: new Date(),
        suggestions: ['Book Ethiopian Airlines', 'Book Kenya Airways', 'See more options']
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: "I understand you're looking for travel services. I can help you with:\n\n✈️ Flight bookings\n🏨 Hotel reservations\n🚗 Ground transportation\n📊 Expense tracking\n🧾 Invoice generation\n\nWhat would you like to do?",
      timestamp: new Date(),
      suggestions: ['Book a flight', 'Find a hotel', 'Arrange transportation']
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        >
          <MessageSquare className="w-7 h-7 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Travel Assistant</h3>
                <p className="text-xs text-blue-100">Online • Instant responses</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50/50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => handleSendMessage('Book a flight')}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                <Plane className="w-3 h-3" />
                Flights
              </button>
              <button
                onClick={() => handleSendMessage('Find a hotel')}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                <Hotel className="w-3 h-3" />
                Hotels
              </button>
              <button
                onClick={() => handleSendMessage('Arrange Uber')}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                <Car className="w-3 h-3" />
                Transport
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

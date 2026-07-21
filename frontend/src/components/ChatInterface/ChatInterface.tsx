import React, { useState } from 'react';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    // TODO: Connect to backend API
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: 'This is a skeleton response from Sentinel AI.' }]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full border rounded shadow-sm">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}>
            <strong>{msg.role === 'user' ? 'You: ' : 'Sentinel AI: '}</strong>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="p-2 border-t flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border p-2 rounded mr-2"
          placeholder="Ask operational questions..."
        />
        <button onClick={handleSend} className="bg-blue-500 text-white p-2 rounded">Send</button>
      </div>
    </div>
  );
};

export default ChatInterface;

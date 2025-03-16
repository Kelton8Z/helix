import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Message } from '../types';

interface ChatBarProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
}

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ccc;
  font-weight: bold;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 80%;
  padding: 10px;
  border-radius: 8px;
  align-self: ${(props) => (props.isUser ? 'flex-end' : 'flex-start')};
  background-color: ${(props) => (props.isUser ? '#007bff' : '#f1f1f1')};
  color: ${(props) => (props.isUser ? 'white' : 'black')};
`;

const StatusMessage = styled.div`
  padding: 8px;
  border-radius: 8px;
  background-color: #e6f7ff;
  color: #0066cc;
  text-align: center;
  font-style: italic;
`;

const InputContainer = styled.div`
  display: flex;
  padding: 10px;
  border-top: 1px solid #ccc;
`;

const Input = styled.input`
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
`;

const SendButton = styled.button`
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ChatBar: React.FC<ChatBarProps> = ({ messages, onSendMessage, isGenerating }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (input.trim() && !isGenerating) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <ChatContainer>
      <ChatHeader>Chat</ChatHeader>
      <MessagesContainer>
        {messages.length === 0 && (
          <StatusMessage>How can I help?</StatusMessage>
        )}
        
        {messages.map((message, index) => (
          message.type === 'status' ? (
            <StatusMessage key={index}>{message.content}</StatusMessage>
          ) : (
            <MessageBubble 
              key={index} 
              isUser={message.type === 'user'}
            >
              {message.content}
            </MessageBubble>
          )
        ))}
        
        {isGenerating && (
          <StatusMessage>Generating sequence...</StatusMessage>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isGenerating}
        />
        <SendButton onClick={handleSend} disabled={!input.trim() || isGenerating}>
          Send
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default ChatBar;

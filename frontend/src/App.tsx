import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ChatBar from './components/ChatBar';
import Workspace from './components/Workspace';
import { Message, Sequence, SequenceStep } from './types';
import { sendMessage, generateSequence, updateSequence, testOpenAI, testSupabase, testGemini, ModelProvider } from './services/api';
import './App.css';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
`;

const Header = styled.header`
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
`;

const Subtitle = styled.p`
  color: #666;
  margin: 5px 0 0;
`;

const MainContent = styled.main`
  display: flex;
  flex: 1;
  gap: 20px;
  height: calc(100% - 80px);
  min-height: 0;
`;

const Column = styled.div`
  flex: 1 0 0;
  width: 50%;
  max-width: 50%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId] = useState(`user-${Date.now()}`);
  const [openaiTestResult, setOpenaiTestResult] = useState<string | null>(null);
  const [supabaseTestResult, setSupabaseTestResult] = useState<string | null>(null);
  const [geminiTestResult, setGeminiTestResult] = useState<string | null>(null);
  const [modelProvider, setModelProvider] = useState<ModelProvider>('openai');

  const handleSendMessage = async (content: string) => {
    // Add user message to chat
    const userMessage: Message = { content, type: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      setIsGenerating(true);
      
      // Send message to API with selected model provider
      const response = await sendMessage(content, userId, modelProvider);
      
      // Add AI response to chat
      const aiMessage: Message = { content: response.message, type: 'assistant' };
      setMessages(prev => [...prev, aiMessage]);
      
      // Check if we should generate a sequence based on the conversation
        // Extract context from messages
        const context = {
          messages: [...messages, userMessage, aiMessage].map(m => ({ content: m.content, type: m.type })),
          userRequest: content
        };
        
        try {
          // Generate sequence with selected model provider
          const sequenceResponse = await generateSequence(context, userId, modelProvider);
          
          // Debug: Log the sequence response
          console.log('Raw sequence response:', sequenceResponse);
          
          // Ensure we have a valid sequence response with steps
          if (!sequenceResponse || !Array.isArray(sequenceResponse.sequence)) {
            throw new Error('Invalid sequence response format');
          }
          
          // Create properly formatted sequence object
          const newSequence: Sequence = {
            steps: sequenceResponse.sequence.map((step: any, index: number) => ({
              step: (index + 1).toString(),
              content: typeof step === 'string' ? step : step.content || '',
            }))
          };
          
          console.log('Formatted sequence:', newSequence);
          setSequence(newSequence);
          
        } catch (error) {
          console.error('Error generating sequence:', error);
          // Only show error in chat if sequence generation fails
          setMessages(prev => [...prev, { 
            content: 'Error generating sequence. Please try again.', 
            type: 'status' 
          }]);
        }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { content: 'An error occurred. Please try again.', type: 'status' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateSequence = (updatedSteps: SequenceStep[]) => {
    console.log("App received updated steps:", updatedSteps);
    
    if (!sequence) return;
    
    // Update local state
    setSequence({
      ...sequence,
      steps: updatedSteps
    });
    
    // Optionally save to backend
    // saveSequenceToBackend(sequence.id, updatedSteps);
  };

  const handleTestOpenAI = async () => {
    try {
      setOpenaiTestResult('Testing OpenAI connection...');
      const result = await testOpenAI();
      setOpenaiTestResult(JSON.stringify(result, null, 2));
    } catch (error: any) {  
      console.error('OpenAI test error:', error);
      const errorResponse = error.response?.data || {};
      setOpenaiTestResult(`Error: ${error.message || 'Unknown error'}\n\nDetails: ${JSON.stringify(errorResponse, null, 2)}`);
    }
  };

  const handleTestGemini = async () => {
    try {
      setGeminiTestResult('Testing Gemini connection...');
      const result = await testGemini();
      setGeminiTestResult(JSON.stringify(result, null, 2));
    } catch (error: any) {  
      console.error('Gemini test error:', error);
      const errorResponse = error.response?.data || {};
      setGeminiTestResult(`Error: ${error.message || 'Unknown error'}\n\nDetails: ${JSON.stringify(errorResponse, null, 2)}`);
    }
  };

  const handleTestSupabase = async () => {
    try {
      setSupabaseTestResult('Testing Supabase connection...');
      const result = await testSupabase();
      setSupabaseTestResult(JSON.stringify(result, null, 2));
    } catch (error: any) {  
      console.error('Supabase test error:', error);
      const errorResponse = error.response?.data || {};
      setSupabaseTestResult(`Error: ${error.message || 'Unknown error'}\n\nDetails: ${JSON.stringify(errorResponse, null, 2)}`);
    }
  };

  return (
    <AppContainer>
      <Header>
        <Title>Helix - Recruiting Outreach Agent</Title>
        <Subtitle>Chat with AI to create and edit recruiting outreach sequences</Subtitle>
        
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          <label style={{ marginRight: '10px' }}>Model Provider:</label>
          <select 
            value={modelProvider} 
            onChange={(e) => setModelProvider(e.target.value as ModelProvider)}
            style={{ padding: '5px', marginRight: '20px' }}
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={handleTestOpenAI}>Test OpenAI API</button>
          <button onClick={handleTestGemini}>Test Gemini API</button>
          <button onClick={handleTestSupabase}>Test Supabase API</button>
        </div>
        
        {openaiTestResult && (
          <div>
            <h4>OpenAI Test Result:</h4>
            <pre style={{ maxHeight: '200px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px' }}>
              {openaiTestResult}
            </pre>
          </div>
        )}
        
        {geminiTestResult && (
          <div>
            <h4>Gemini Test Result:</h4>
            <pre style={{ maxHeight: '200px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px' }}>
              {geminiTestResult}
            </pre>
          </div>
        )}
        
        {supabaseTestResult && (
          <div>
            <h4>Supabase Test Result:</h4>
            <pre style={{ maxHeight: '200px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px' }}>
              {supabaseTestResult}
            </pre>
          </div>
        )}
      </Header>
      
      <MainContent>
        <Column>
          <ChatBar 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isGenerating={isGenerating} 
          />
        </Column>
        <Column>
          <Workspace 
            sequence={sequence} 
            onUpdateSequence={handleUpdateSequence} 
          />
        </Column>
      </MainContent>
    </AppContainer>
  );
}

export default App;

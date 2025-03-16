import { Message, Sequence, SequenceStep } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

// Define the response type from the backend
interface ChatResponse {
  message: string;
  status: string;
}

interface SequenceResponse {
  sequence: SequenceStep[];
  status: string;
}

// Model provider types
export type ModelProvider = 'openai' | 'gemini';

// Helper function for API requests
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const config: RequestInit = {
    ...options,
    headers,
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

export const sendMessage = async (
  message: string, 
  userId: string = 'anonymous',
  modelProvider: ModelProvider = 'openai',
  modelName?: string
): Promise<ChatResponse> => {
  return fetchApi('/chat', {
    method: 'POST',
    body: JSON.stringify({ 
      message, 
      userId, 
      modelProvider,
      modelName
    })
  });
};

export const generateSequence = async (
  context: any, 
  userId: string = 'anonymous',
  modelProvider: ModelProvider = 'openai',
  modelName?: string
): Promise<SequenceResponse> => {
  return fetchApi('/generate-sequence', {
    method: 'POST',
    body: JSON.stringify({ 
      context, 
      userId,
      modelProvider,
      modelName
    })
  });
};

export const updateSequence = async (sequenceId: string, steps: SequenceStep[]): Promise<any> => {
  return fetchApi('/update-sequence', {
    method: 'PUT',
    body: JSON.stringify({ sequenceId, steps })
  });
};

export const testOpenAI = async (): Promise<any> => {
  try {
    return fetchApi('/test-openai');
  } catch (error) {
    console.error('Error testing OpenAI:', error);
    throw error;
  }
};

export const testGemini = async (): Promise<any> => {
  try {
    return fetchApi('/test-gemini');
  } catch (error) {
    console.error('Error testing Gemini:', error);
    throw error;
  }
};

export const testSupabase = async (): Promise<any> => {
  try {
    return fetchApi('/test-supabase');
  } catch (error) {
    console.error('Error testing Supabase:', error);
    throw error;
  }
};

// Message types
export interface Message {
  id?: string;
  content: string;
  type: 'user' | 'assistant' | 'status';
  timestamp?: string;
}

// Sequence step type
export interface SequenceStep {
  step: string;
  content: string;
}

// Full sequence type
export interface Sequence {
  id?: string;
  steps: SequenceStep[];
  context?: any;
  createdAt?: string;
  updatedAt?: string;
}

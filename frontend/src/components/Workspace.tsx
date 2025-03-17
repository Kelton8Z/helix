import React from 'react';
import styled from 'styled-components';
import { Sequence, SequenceStep } from '../types';

interface WorkspaceProps {
  sequence: Sequence | null;
  onUpdateSequence: (steps: SequenceStep[]) => void;
}

const WorkspaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
`;

const WorkspaceHeader = styled.div`
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ccc;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.div`
  font-weight: bold;
`;

const SequenceContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
`;

const StepContainer = styled.div`
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
`;

const StepHeader = styled.div`
  background-color: #f5f5f5;
  padding: 8px 12px;
  font-weight: bold;
  border-bottom: 1px solid #e0e0e0;
`;

const StepContent = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: none;
  resize: vertical;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.5;
  overflow: auto;
  
  &:focus {
    outline: none;
    background-color: #f9f9f9;
  }
`;

const Workspace: React.FC<WorkspaceProps> = ({ sequence, onUpdateSequence }) => {
  const handleStepChange = (index: number, newContent: string) => {
    if (!sequence) return;
    
    const updatedSteps = [...sequence.steps];
    updatedSteps[index] = {
      ...updatedSteps[index],
      content: newContent
    };
    
    onUpdateSequence(updatedSteps);
  };

  return (
    <WorkspaceContainer>
      <WorkspaceHeader>
        <Title>Workspace</Title>
        {sequence && <div>Sequence</div>}
      </WorkspaceHeader>
      
      <SequenceContainer>
        {!sequence || sequence.steps.length === 0 ? (
          <EmptyState>
            <p>No sequence generated.</p>
            <p>Chat with the AI to generate a recruiting outreach sequence.</p>
          </EmptyState>
        ) : (
          sequence.steps.map((step, index) => (
            <StepContainer key={index}>
              <StepHeader>Step {step.step}</StepHeader>
              <StepContent
                value={step.content}
                onChange={(e) => handleStepChange(index, e.target.value)}
              />
            </StepContainer>
          ))
        )}
      </SequenceContainer>
    </WorkspaceContainer>
  );
};

export default Workspace;

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface GameScores {
  colorTap: number;
  whackMole: number;
  reaction: number;
}

interface GameContextValue {
  scores: GameScores;
  setColorTapScore: (score: number) => void;
  setWhackMoleScore: (score: number) => void;
  setReactionScore: (score: number) => void;
  resetScores: () => void;
  totalScore: number;
  reflexLevel: string;
  reflexDescription: string;
}

const GameContext = createContext<GameContextValue | null>(null);

const defaultScores: GameScores = {
  colorTap: 0,
  whackMole: 0,
  reaction: 0,
};

function getReflexLevel(total: number): { level: string; description: string } {
  if (total >= 270) return { level: 'SUPERHUMAN', description: 'Your reflexes are beyond human limits. You react before things even happen.' };
  if (total >= 220) return { level: 'LIGHTNING', description: 'Incredibly fast reflexes. You could dodge a bullet... almost.' };
  if (total >= 170) return { level: 'QUICK', description: 'Your reflexes are sharp and fast. Well above average!' };
  if (total >= 120) return { level: 'AVERAGE', description: 'Solid reflexes. You are right around normal human speed.' };
  if (total >= 70) return { level: 'SLUGGISH', description: 'Your reflexes need some work. Keep practicing!' };
  return { level: 'SLEEPY', description: 'Were you napping? Time to wake up those reflexes!' };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<GameScores>(defaultScores);

  const setColorTapScore = (score: number) => setScores(prev => ({ ...prev, colorTap: score }));
  const setWhackMoleScore = (score: number) => setScores(prev => ({ ...prev, whackMole: score }));
  const setReactionScore = (score: number) => setScores(prev => ({ ...prev, reaction: score }));
  const resetScores = () => setScores(defaultScores);

  const totalScore = scores.colorTap + scores.whackMole + scores.reaction;
  const { level, description } = getReflexLevel(totalScore);

  const value = useMemo(() => ({
    scores,
    setColorTapScore,
    setWhackMoleScore,
    setReactionScore,
    resetScores,
    totalScore,
    reflexLevel: level,
    reflexDescription: description,
  }), [scores, totalScore, level, description]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}

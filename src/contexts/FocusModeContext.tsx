import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Exercise, ExerciseImage } from '@/types/music';
import { FocusMode } from '@/components/FocusMode';

interface FocusModeContextType {
  openFocusMode: (exercise: Exercise, images: ExerciseImage[]) => void;
  closeFocusMode: () => void;
  isFocusModeActive: boolean;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export const FocusModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [activeImages, setActiveImages] = useState<ExerciseImage[]>([]);

  const openFocusMode = (exercise: Exercise, images: ExerciseImage[]) => {
    setActiveExercise(exercise);
    setActiveImages(images);
  };

  const closeFocusMode = () => {
    setActiveExercise(null);
    setActiveImages([]);
  };

  return (
    <FocusModeContext.Provider value={{
      openFocusMode,
      closeFocusMode,
      isFocusModeActive: !!activeExercise
    }}>
      {children}
      {activeExercise && (
        <FocusMode 
          exercise={activeExercise} 
          images={activeImages} 
          onClose={closeFocusMode} 
        />
      )}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
};

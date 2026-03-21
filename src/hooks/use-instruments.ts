import { useLocalStorage } from './use-local-storage';
import { InstrumentDef, DEFAULT_INSTRUMENTS } from '@/types/music';

const INSTRUMENTS_KEY = 'user-instruments';

export function useInstruments() {
  const [instruments, setInstruments] = useLocalStorage<InstrumentDef[]>(
    INSTRUMENTS_KEY,
    DEFAULT_INSTRUMENTS
  );

  const addInstrument = (name: string, emoji: string) => {
    const id = name.toLowerCase().trim().replace(/\s+/g, '-');
    if (instruments.find(i => i.id === id)) return;
    
    setInstruments([...instruments, { id, name, emoji }]);
  };

  const removeInstrument = (id: string) => {
    if (DEFAULT_INSTRUMENTS.find(i => i.id === id)) {
      // Opcional: Impedir borrar los básicos para evitar roturas
    }
    setInstruments(instruments.filter((i: InstrumentDef) => i.id !== id));
  };

  const updateInstrument = (id: string, updates: Partial<Omit<InstrumentDef, 'id'>>) => {
    setInstruments(instruments.map((i: InstrumentDef) => i.id === id ? { ...i, ...updates } : i));
  };

  return {
    instruments,
    addInstrument,
    removeInstrument,
    updateInstrument
  };
}

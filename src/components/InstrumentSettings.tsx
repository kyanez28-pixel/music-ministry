import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInstruments } from '@/hooks/use-instruments';
import { Trash2, Plus, Music } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface InstrumentSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMOJI_OPTIONS = ['🎹', '🎸', '🥁', '🎻', '🎺', '🎷', '🎤', '🪕', '🪗', '📻', '🎼', '🎵'];

export function InstrumentSettings({ open, onOpenChange }: InstrumentSettingsProps) {
  const { instruments, addInstrument, removeInstrument } = useInstruments();
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎵');

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error("El nombre del instrumento no puede estar vacío");
      return;
    }
    addInstrument(newName.trim(), newEmoji);
    setNewName('');
    toast.success(`Instrumento "${newName}" añadido`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-panel !bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold font-display">
            <Music className="text-primary h-5 w-5" />
            Gestionar Instrumentos
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Personaliza los instrumentos que practicas en MusicMinistry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* New Instrument Form */}
          <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-white/80">Nuevo Instrumento</h3>
            <div className="flex gap-2">
              <div className="relative group">
                <Input 
                  value={newEmoji} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmoji(e.target.value)}
                  className="w-12 text-center text-lg p-0 h-10 bg-white/5 border-white/10"
                  maxLength={2}
                />
                <div className="absolute top-12 left-0 z-50 bg-neutral-900 border border-white/10 p-2 rounded-lg grid grid-cols-4 gap-1 opacity-0 group-focus-within:opacity-100 pointer-events-none group-focus-within:pointer-events-auto transition-opacity shadow-2xl">
                  {EMOJI_OPTIONS.map(e => (
                    <button 
                      key={e} 
                      onClick={() => setNewEmoji(e)}
                      className="hover:bg-white/10 p-1 rounded transition-colors"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <Input 
                placeholder="Nombre (ej: Bajo, Violín...)" 
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                className="flex-1 bg-white/5 border-white/10"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAdd()}
              />
              <Button size="icon" onClick={handleAdd} className="h-10 w-10 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* List of Instruments */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white/50 px-1">Instrumentos Activos</h3>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {instruments.map((inst: any) => (
                  <div 
                    key={inst.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{inst.emoji}</span>
                      <span className="font-medium text-white/90">{inst.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeInstrument(inst.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

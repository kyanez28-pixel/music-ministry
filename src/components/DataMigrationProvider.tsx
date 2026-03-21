import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CloudUpload, RefreshCw, X, Download, Upload as UploadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  useExercises, 
  useExerciseImages, 
  useMelodies, 
  useMelodyFolders, 
  useMelodyImages, 
  useRhythms, 
  useRhythmImages 
} from '@/hooks/use-music-data';
import { useAuth } from '@/contexts/AuthContext';
import { AppTooltip } from '@/components/AppTooltip';

export const DataMigrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // Supabase setters
  const [, setExercises] = useExercises();
  const [, setExerciseImages] = useExerciseImages();
  const [, setMelodies] = useMelodies();
  const [, setFolders] = useMelodyFolders();
  const [, setMelodyImages] = useMelodyImages();
  const [, setRhythms] = useRhythms();
  const [, setRhythmImages] = useRhythmImages();

  useEffect(() => {
    if (!user) return;

    // Check if there is any local data to migrate
    const keys = [
      'mm-exercises', 
      'mm-melodies-v2', 
      'mm-melody-folders', 
      'mm-melody-images', 
      'mm-rhythms', 
      'mm-rhythm-images'
    ];
    
    const hasLocalData = keys.some(key => {
      const data = localStorage.getItem(key);
      return data && data !== '[]' && data !== '{}';
    });

    if (hasLocalData) {
      // Small delay to let the app load
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const migrateKey = async (key: string, setter: (data: any) => void) => {
        const localData = localStorage.getItem(key);
        if (localData && localData !== '[]') {
          const parsed = JSON.parse(localData);
          await setter(parsed);
          // We don't remove from localStorage yet for safety, 
          // but we could rename it to avoid re-triggering prompt
          localStorage.setItem(`${key}-migrated`, localData);
          localStorage.removeItem(key);
        }
      };

      await migrateKey('mm-exercises', setExercises);
      await migrateKey('mm-exercise-images', setExerciseImages);
      await migrateKey('mm-melody-folders', setFolders);
      await migrateKey('mm-melodies-v2', setMelodies);
      await migrateKey('mm-melody-images', setMelodyImages);
      await migrateKey('mm-rhythms', setRhythms);
      await migrateKey('mm-rhythm-images', setRhythmImages);

      toast.success('¡Datos migrados a la nube con éxito!');
      setShowPrompt(false);
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Hubo un error al migrar algunos datos. Inténtalo de nuevo.');
    } finally {
      setMigrating(false);
    }
  };

  const handleExport = () => {
    const backup: Record<string, string | null> = {};
    const keys = [
      'mm-exercises', 
      'mm-exercises-v2', // check if v2 exists
      'mm-exercise-images',
      'mm-melodies-v2', 
      'mm-melody-folders', 
      'mm-melody-images', 
      'mm-melody-logs',
      'mm-rhythms', 
      'mm-rhythm-images',
      'mm-rhythm-logs',
      'mm-instruments',
      'mm-practice-sessions'
    ];
    
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) backup[key] = data;
    });

    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `music-ministry-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Respaldo descargado con éxito');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        Object.entries(backup).forEach(([key, value]) => {
          if (typeof value === 'string') {
            localStorage.setItem(key, value);
          }
        });
        toast.success('Datos importados localmente. Recargando...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error('Error al importar el archivo');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="fixed bottom-20 right-6 z-[60] flex flex-col gap-2">
         <AppTooltip content="Exportar mis datos locales a un archivo">
           <Button variant="outline" size="icon" onClick={handleExport} className="rounded-full shadow-lg bg-background/80 backdrop-blur">
             <Download className="h-4 w-4" />
           </Button>
         </AppTooltip>
         <AppTooltip content="Importar datos desde un archivo">
           <div className="relative">
             <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-background/80 backdrop-blur">
               <UploadIcon className="h-4 w-4" />
             </Button>
             <input 
               type="file" 
               accept=".json" 
               onChange={handleImport} 
               className="absolute inset-0 opacity-0 cursor-pointer" 
             />
           </div>
         </AppTooltip>
      </div>
      {children}
      
      {showPrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-card/95 border border-primary/30 backdrop-blur-xl p-5 rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CloudUpload className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground">¿Sincronizar datos locales?</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Hemos detectado contenido guardado en este navegador. Súbelo a la nube para acceder desde cualquier dispositivo.
                </p>
              </div>
              <button onClick={() => setShowPrompt(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowPrompt(false)}>
                Ahora no
              </Button>
              <Button size="sm" onClick={handleMigrate} disabled={migrating} className="premium-btn-glow">
                {migrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-4 w-4 mr-2" />
                    Subir a la nube
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

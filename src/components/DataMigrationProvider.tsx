import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { CloudUpload, Download, Upload as UploadIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const LOCAL_KEYS = [
  'mm-exercises',
  'mm-exercise-images',
  'mm-melodies-v2',
  'mm-melody-folders',
  'mm-melody-images',
  'mm-melody-logs',
  'mm-rhythms',
  'mm-rhythm-images',
  'mm-rhythm-logs',
  'mm-practice-sessions',
  'mm-instruments',
  'mm-scale-videos',
  'mm-harmony-videos',
];

export const DataMigrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    // If the user already dismissed or exported, never show again
    if (localStorage.getItem('mm-prompt-dismissed')) return;

    // Check if there is any non-empty local data
    const hasLocalData = LOCAL_KEYS.some(key => {
      const data = localStorage.getItem(key);
      return data && data !== '[]' && data !== '{}' && data !== 'null';
    });

    if (hasLocalData) {
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleExport = () => {
    const backup: Record<string, string> = {};
    LOCAL_KEYS.forEach(key => {
      const data = localStorage.getItem(key);
      if (data && data !== '[]' && data !== '{}' && data !== 'null') {
        backup[key] = data;
      }
    });

    if (Object.keys(backup).length === 0) {
      toast.info('No hay datos locales para exportar');
      return;
    }

    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `musica-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Mark as exported so prompt doesn't show again
    localStorage.setItem('mm-data-exported', 'true');
    toast.success('¡Respaldo descargado! Carga este archivo en la nueva URL.');
    setShowPrompt(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        let count = 0;
        Object.entries(backup).forEach(([key, value]) => {
          if (typeof value === 'string' && LOCAL_KEYS.includes(key)) {
            localStorage.setItem(key, value);
            count++;
          }
        });
        toast.success(`¡${count} secciones importadas! Recargando...`);
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error('Error al leer el archivo. Asegúrate de que es un archivo de respaldo válido.');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (importRef.current) importRef.current.value = '';
  };

  return (
    <>
      {children}

      {/* Floating Export/Import buttons */}
      {user && (
        <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
          <button
            onClick={handleExport}
            title="Exportar mis datos a archivo"
            className="w-10 h-10 rounded-full bg-background/80 border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all backdrop-blur"
          >
            <Download className="h-4 w-4" />
          </button>
          <label
            title="Importar datos desde archivo"
            className="w-10 h-10 rounded-full bg-background/80 border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all backdrop-blur cursor-pointer"
          >
            <UploadIcon className="h-4 w-4" />
            <input
              ref={importRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Migration Prompt */}
      {showPrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-card/95 border border-primary/30 backdrop-blur-xl p-5 rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <CloudUpload className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground text-sm">Datos guardados localmente</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Tienes contenido en este navegador. Descarga un respaldo para importarlo en la versión web y no perder nada.
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('mm-prompt-dismissed', 'true');
                  setShowPrompt(false);
                }}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => {
                localStorage.setItem('mm-prompt-dismissed', 'true');
                setShowPrompt(false);
              }}>
                Ahora no
              </Button>
              <Button size="sm" onClick={handleExport} className="premium-btn-glow">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Descargar respaldo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

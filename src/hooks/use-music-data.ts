import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PracticeSession, Scale, Harmony, Melody, Rhythm, Song, WeeklySetlist, ScalePracticeLog, HarmonyPracticeLog, RhythmPracticeLog, MelodyImage, RhythmImage, Exercise, ExerciseImage, ScaleImage, HarmonyImage, ScaleFolder, HarmonyFolder, RhythmFolder, ExerciseFolder } from '@/types/music';

export function useSupabaseData<T>(tableName: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = [tableName, user?.id];

  const { data: serverData = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from(tableName as any).select('*').eq('user_id', user.id);
      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw error;
      }
      return data as T[];
    },
    enabled: !!user,
  });

  const [localData, setLocalData] = useState<T[]>(serverData || []);

  useEffect(() => {
    setLocalData(serverData);
  }, [serverData]);

  const setData = useCallback(async (value: T[] | ((val: T[]) => T[])) => {
    if (!user) return;
    
    const processData = async (prev: T[], newData: T[]) => {
      try {
        const hasMissingIds = newData.some((item: any) => !item.id) || prev.some((item: any) => !item.id);
        
        if (hasMissingIds) {
          const { error: delError } = await supabase.from(tableName as any).delete().eq('user_id', user.id);
          if (delError) throw delError;
          
          if (newData.length > 0) {
            const { error: insError } = await supabase.from(tableName as any).insert(
              newData.map((item: any) => {
                const copy = { ...item, user_id: user.id };
                delete copy.id;
                if (copy.created_at === undefined || copy.created_at === null) {
                  copy.created_at = new Date().toISOString();
                }
                return copy;
              })
            );
            if (insError) throw insError;
          }
        } else {
           const newIds = new Set(newData.map((item: any) => item.id));
           const deletedIds = prev.filter((item: any) => !newIds.has(item.id)).map((item: any) => item.id);
           const oldDataMap = new Map(prev.map((item: any) => [item.id, item]));
           
           const upserts = newData.filter((newItem: any) => {
             const oldItem = oldDataMap.get(newItem.id);
             return !oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem);
           }).map((item: any) => ({ ...item, user_id: user.id }));
           
           if (deletedIds.length > 0) {
             const { error: delError } = await supabase.from(tableName as any).delete().in('id', deletedIds).eq('user_id', user.id);
             if (delError) throw delError;
           }
           if (upserts.length > 0) {
             const { error: upsError } = await supabase.from(tableName as any).upsert(upserts);
             if (upsError) throw upsError;
           }
        }
        queryClient.invalidateQueries({ queryKey });
      } catch (error: any) {
        console.error(`Sync error on ${tableName}:`, error);
        alert(`Error al guardar en ${tableName}: ${error.message || 'Restricción de base de datos'}`);
        const { toast } = await import('sonner');
        toast.error(`Error guardando ${tableName}: ${error.message || 'Error de red'}`, { duration: 10000 });
      }
    };

    setLocalData(prev => {
      const newData = typeof value === 'function' ? (value as any)(prev) : value;
      // Solo dispara la red de fondo usando setTimeout para separar el ciclo de vida síncrono
      setTimeout(() => processData(prev, newData), 0);
      return newData;
    });
  }, [user, tableName, queryClient, queryKey]);

  return [localData, setData, isLoading] as const;
}

export function useSessions() { return useSupabaseData<PracticeSession>('practice_sessions'); }
export function useScales() { return useSupabaseData<Scale>('scales'); }
export function useScaleLogs() { return useSupabaseData<ScalePracticeLog>('scale_logs'); }
export function useHarmonies() { return useSupabaseData<Harmony>('harmonies'); }
export function useHarmonyLogs() { return useSupabaseData<HarmonyPracticeLog>('harmony_logs'); }
export function useMelodies() { return useSupabaseData<Melody>('melodies'); }
export function useRhythms() { return useSupabaseData<Rhythm>('rhythms'); }
export function useSongs() { return useSupabaseData<Song>('songs'); }
export function useSetlists() { return useSupabaseData<WeeklySetlist>('weekly_setlists'); }

// Melodías (Carpetas e Imágenes)
export function useMelodyFolders() { return useSupabaseData<ScaleFolder>('melody_folders'); }
export function useMelodyImages() { return useSupabaseData<MelodyImage>('melody_images'); }
export function useMelodyPracticeLogs() { return useSupabaseData<any>('melody_practice_logs'); }

// Ritmos (Carpetas, Imágenes y Logs)
export function useRhythmFolders() { return useSupabaseData<RhythmFolder>('rhythm_folders'); }
export function useRhythmImages() { return useSupabaseData<RhythmImage>('rhythm_images'); }
export function useRhythmPracticeLogs() { return useSupabaseData<RhythmPracticeLog>('rhythm_practice_logs'); }

// Ejercicios
export function useExercises() { return useSupabaseData<Exercise>('exercises'); }
export function useExerciseFolders() { return useSupabaseData<ExerciseFolder>('exercise_folders'); }
export function useExerciseImages() { return useSupabaseData<ExerciseImage>('exercise_images'); }
export function useExercisePracticeLogs() { return useSupabaseData<any>('exercise_practice_logs'); }

// Escalas
export function useScaleFolders() { return useSupabaseData<ScaleFolder>('scale_folders'); }
export function useScaleImages() { return useSupabaseData<ScaleImage>('scale_images'); }

// Armonías
export function useHarmonyFolders() { return useSupabaseData<HarmonyFolder>('harmony_folders'); }
export function useHarmonyImages() { return useSupabaseData<HarmonyImage>('harmony_images'); }

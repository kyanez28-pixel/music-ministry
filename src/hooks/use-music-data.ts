import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PracticeSession, Scale, Harmony, Melody, Rhythm, Song, WeeklySetlist, ScalePracticeLog, HarmonyPracticeLog, RhythmPracticeLog } from '@/types/music';

export function useSupabaseData<T>(tableName: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = [tableName, user?.id];

  const { data: serverData = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from(tableName).select('*').eq('user_id', user.id);
      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw error;
      }
      return data as T[];
    },
    enabled: !!user,
  });

  const [localData, setLocalData] = useState<T[]>(serverData);

  useEffect(() => {
    setLocalData(serverData);
  }, [serverData]);

  const setData = useCallback(async (value: T[] | ((val: T[]) => T[])) => {
    if (!user) return;
    
    setLocalData(prev => {
      const newData = typeof value === 'function' ? (value as any)(prev) : value;
      
      (async () => {
        try {
          const hasMissingIds = newData.some((item: any) => !item.id) || prev.some((item: any) => !item.id);
          
          if (hasMissingIds) {
            await supabase.from(tableName).delete().eq('user_id', user.id);
            if (newData.length > 0) {
              await supabase.from(tableName).insert(
                newData.map((item: any) => {
                  const copy = { ...item, user_id: user.id };
                  delete copy.id;
                  return copy;
                })
              );
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
               await supabase.from(tableName).delete().in('id', deletedIds).eq('user_id', user.id);
             }
             if (upserts.length > 0) {
               await supabase.from(tableName).upsert(upserts);
             }
          }
          queryClient.invalidateQueries({ queryKey });
        } catch (error) {
          console.error(`Sync error on ${tableName}:`, error);
        }
      })();

      return newData;
    });
  }, [user, tableName, queryClient, queryKey]);

  return [isLoading ? [] : localData, setData] as const;
}

export function useSessions() { return useSupabaseData<PracticeSession>('practice_sessions'); }
export function useScales() { return useSupabaseData<Scale>('scales'); }
export function useScaleLogs() { return useSupabaseData<ScalePracticeLog>('scale_logs'); }
export function useHarmonies() { return useSupabaseData<Harmony>('harmonies'); }
export function useHarmonyLogs() { return useSupabaseData<HarmonyPracticeLog>('harmony_logs'); }
export function useMelodies() { return useSupabaseData<Melody>('melodies'); }
export function useRhythms() { return useSupabaseData<Rhythm>('rhythms'); }
export function useRhythmLogs() { return useSupabaseData<RhythmPracticeLog>('rhythm_logs'); }
export function useSongs() { return useSupabaseData<Song>('songs'); }
export function useSetlists() { return useSupabaseData<WeeklySetlist>('weekly_setlists'); }


// Melodías (Carpetas, Imágenes y Logs adicionales)
export function useMelodyFolders() { return useSupabaseData<any>('melody_folders'); }
export function useMelodyImages() { return useSupabaseData<any>('melody_images'); }
export function useMelodyPracticeLogs() { return useSupabaseData<any>('melody_practice_logs'); }

// Ritmos (Carpetas, Imágenes y Logs adicionales)
export function useRhythmFolders() { return useSupabaseData<any>('rhythm_folders'); }
export function useRhythmImages() { return useSupabaseData<any>('rhythm_images'); }
export function useRhythmPracticeLogs() { return useSupabaseData<any>('rhythm_practice_logs'); }

// Ejercicios
export function useExercises() { return useSupabaseData<any>('exercises'); }
export function useExerciseFolders() { return useSupabaseData<any>('exercise_folders'); }
export function useExerciseImages() { return useSupabaseData<any>('exercise_images'); }
export function useExercisePracticeLogs() { return useSupabaseData<any>('exercise_practice_logs'); }

// Escalas
export function useScaleFolders() { return useSupabaseData<any>('scale_folders'); }
export function useScalePracticeLogs() { return useSupabaseData<any>('scale_practice_logs'); }

// Armonías
export function useHarmonyFolders() { return useSupabaseData<any>('harmony_folders'); }
export function useHarmonyPracticeLogs() { return useSupabaseData<any>('harmony_practice_logs'); }

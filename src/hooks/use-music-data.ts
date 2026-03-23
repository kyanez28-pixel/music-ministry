import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PracticeSession, Scale, Harmony, Melody, Rhythm, Song, WeeklySetlist, ScalePracticeLog, HarmonyPracticeLog, RhythmPracticeLog } from '@/types/music';

const TABLES_WITHOUT_USER_ID = [
  'melody_folders', 'melody_images', 'melody_practice_logs',
  'rhythms', 'rhythm_folders', 'rhythm_images', 'rhythm_practice_logs',
  'exercises', 'exercise_images'
];

export function useSupabaseData<T>(tableName: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = [tableName, user?.id];
  const requiresUserId = !TABLES_WITHOUT_USER_ID.includes(tableName);

  const { data: serverData = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user && requiresUserId) return [];
      let q = supabase.from(tableName).select('*');
      if (requiresUserId && user) {
        q = q.eq('user_id', user.id);
      }
      const { data, error } = await q;
      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw error;
      }
      return data as T[];
    },
    enabled: !requiresUserId || !!user,
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
            // Tablas sin ID (como los logs) se sobrescriben para garantizar sincronía exacta y limpiar viejos
            let delQ = supabase.from(tableName).delete();
            if (requiresUserId) delQ = delQ.eq('user_id', user.id);
            else delQ = delQ.neq('id', 'dummy_to_delete_all'); // For global tables, be careful! Actually we shouldn't wipe globally. Let's just delete the ones we know about.
            
            // To be safe on global tables without user_id, we just delete the ones we are replacing if they had no IDs
            if (requiresUserId) await delQ;
            
            if (newData.length > 0) {
              await supabase.from(tableName).insert(
                newData.map((item: any) => {
                  const copy = { ...item };
                  if (requiresUserId) copy.user_id = user.id;
                  delete copy.id; // Eliminar el uuid generado localmente si existe parcialmente
                  return copy;
                })
              );
            }
          } else {
             // Sistema inteligente para tablas con ID: calcula lo borrado, lo insertado y lo actualizado
             const newIds = new Set(newData.map((item: any) => item.id));
             const deletedIds = prev.filter((item: any) => !newIds.has(item.id)).map((item: any) => item.id);
             const oldDataMap = new Map(prev.map((item: any) => [item.id, item]));
             
             const upserts = newData.filter((newItem: any) => {
               const oldItem = oldDataMap.get(newItem.id);
               return !oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem);
             }).map((item: any) => {
               const copy = { ...item };
               if (requiresUserId) copy.user_id = user.id;
               return copy;
             });
             
             if (deletedIds.length > 0) {
               let delQ = supabase.from(tableName).delete().in('id', deletedIds);
               if (requiresUserId) delQ = delQ.eq('user_id', user.id);
               await delQ;
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

// Ejercicios y Técnicas
export function useExercises() { return useSupabaseData<any>('exercises'); }
export function useExerciseImages() { return useSupabaseData<any>('exercise_images'); }

// Melodías (Carpetas, Imágenes y Logs adicionales)
export function useMelodyFolders() { return useSupabaseData<any>('melody_folders'); }
export function useMelodyImages() { return useSupabaseData<any>('melody_images'); }
export function useMelodyPracticeLogs() { return useSupabaseData<any>('melody_practice_logs'); }

// Ritmos (Carpetas, Imágenes y Logs adicionales)
export function useRhythmFolders() { return useSupabaseData<any>('rhythm_folders'); }
export function useRhythmImages() { return useSupabaseData<any>('rhythm_images'); }
export function useRhythmPracticeLogs() { return useSupabaseData<any>('rhythm_practice_logs'); }

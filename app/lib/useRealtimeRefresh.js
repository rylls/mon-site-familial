'use client';
import { useEffect } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseBrowser';

// S'abonne aux changements Postgres d'une table et rappelle `refetch` à
// chaque événement (insert/update/delete), pour que les autres appareils
// voient une réservation ou un objet d'inventaire changer sans recharger la
// page. Se contente de redemander la liste complète plutôt que de fusionner
// le payload à la main : plus simple, et évite de dupliquer ici la logique de
// tri/filtrage `deleted_at` déjà centralisée dans les server actions.
export function useRealtimeRefresh(table, refetch) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
}

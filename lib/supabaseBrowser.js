import { createClient } from '@supabase/supabase-js';

// Client Supabase pour le navigateur : utilise la clé publique "anon"
// (protégée par des policies RLS en lecture seule, voir
// supabase/migrations/0015_public_read_for_realtime.sql), jamais la clé
// service_role qui reste exclusivement côté serveur (lib/supabaseAdmin.js).
// Un seul client est créé et réutilisé pour toutes les souscriptions Realtime.
let client = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return client;
}

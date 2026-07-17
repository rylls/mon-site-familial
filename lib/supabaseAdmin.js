import { createClient } from '@supabase/supabase-js';

// Ce client n'est importé que dans des fichiers "use server" (app/actions.js),
// il n'est donc jamais envoyé au navigateur. La clé service_role reste secrète.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

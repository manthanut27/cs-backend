const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail fast during development so misconfiguration is obvious
  // (API handlers will still guard against missing client)
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseClient] SUPABASE_URL or SUPABASE_ANON_KEY is not set. ' +
      'Supabase-backed endpoints will return 500 until configured.',
  );
}

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
        },
      })
    : null;

module.exports = {
  supabase,
};


import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
const supabase = createClient(env.SECRET_SUPABASE_URL, env.SECRET_SUPABASE_SERVICE_ROLE);

export default supabase;

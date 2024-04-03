import { createClient } from '@supabase/supabase-js';
import { SECRET_SUPABASE_URL, SECRET_SUPABASE_SERVICE_ROLE } from '$env/static/private';
const supabase = createClient(SECRET_SUPABASE_URL, SECRET_SUPABASE_SERVICE_ROLE);

export default supabase;

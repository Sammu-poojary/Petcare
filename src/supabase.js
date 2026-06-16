// src/supabase.js
import { createClient } from "@supabase/supabase-js";

// Note: If you see 400 errors, ensure your Supabase project is not paused 
// and that 'Confirm Email' is disabled in Auth Settings if you want instant login.
const supabaseUrl = "https://qfvtvzlqynovobdtftqs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdnR2emxxeW5vdm9iZHRmdHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzg0MzYsImV4cCI6MjA4MDQxNDQzNn0.ApYdAjE27dNhPPuXYu3DWdMpFjvbf_gn7YvadzgxZ9I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

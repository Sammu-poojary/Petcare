import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qfvtvzlqynovobdtftqs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdnR2emxxeW5vdm9iZHRmdHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzg0MzYsImV4cCI6MjA4MDQxNDQzNn0.ApYdAjE27dNhPPuXYu3DWdMpFjvbf_gn7YvadzgxZ9I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  // We can't really list all tables easily without RPC or similar, 
  // but we can try to access some likely names.
  const commonNames = ['groomings', 'boardings', 'walkings', 'services'];
  const result = [];
  for (const name of commonNames) {
    const { error } = await supabase.from(name).select('*').limit(1);
    if (!error) {
      result.push(name);
    }
  }
  console.log("Existing service-related tables:", result);
}

check();

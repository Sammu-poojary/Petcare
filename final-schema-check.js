import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qfvtvzlqynovobdtftqs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdnR2emxxeW5vdm9iZHRmdHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzg0MzYsImV4cCI6MjA4MDQxNDQzNn0.ApYdAjE27dNhPPuXYu3DWdMpFjvbf_gn7YvadzgxZ9I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const tables = ['appointments', 'orders', 'trainings'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (data && data[0]) {
      console.log(`${table.toUpperCase()}_KEYS:${Object.keys(data[0]).join(',')}`);
    } else {
      console.log(`${table.toUpperCase()}_EMPTY_OR_ERROR`);
    }
  }
}

inspect();

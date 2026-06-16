import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qfvtvzlqynovobdtftqs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdnR2emxxeW5vdm9iZHRmdHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzg0MzYsImV4cCI6MjA4MDQxNDQzNn0.ApYdAjE27dNhPPuXYu3DWdMpFjvbf_gn7YvadzgxZ9I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const tables = ['appointments', 'orders', 'trainings', 'pets', 'profiles'];
  for (const table of tables) {
    console.log(`--- Table: ${table} ---`);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Error reading ${table}: ${error.code} - ${error.message}`);
      } else if (data && data.length > 0) {
        const keys = Object.keys(data[0]);
        console.log(`Columns (${keys.length}): ${keys.join(', ')}`);
        console.log(`Sample Row:`, JSON.stringify(data[0]));
      } else {
        console.log(`No data found in ${table}.`);
      }
    } catch (e) {
      console.log(`Exception reading ${table}: ${e.message}`);
    }
  }
}

inspect();

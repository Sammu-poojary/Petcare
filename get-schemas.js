import { createClient } from "@supabase/supabase-js";
import fs from 'fs';

const supabaseUrl = "https://qfvtvzlqynovobdtftqs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdnR2emxxeW5vdm9iZHRmdHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzg0MzYsImV4cCI6MjA4MDQxNDQzNn0.ApYdAjE27dNhPPuXYu3DWdMpFjvbf_gn7YvadzgxZ9I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const result = {};
  for (const table of ['trainings', 'appointments', 'orders', 'pets', 'profiles']) {
    const { data } = await supabase.from(table).select('*').limit(1);
    if (data && data.length > 0) {
      result[table] = Object.keys(data[0]);
    } else {
      result[table] = 'no data';
    }
  }
  fs.writeFileSync('schemas.json', JSON.stringify(result, null, 2));
  console.log('Schemas written to schemas.json');
}

check();

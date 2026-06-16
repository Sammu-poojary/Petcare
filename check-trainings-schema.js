import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qfvtvzlqynovobdtftqs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdnR2emxxeW5vdm9iZHRmdHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzg0MzYsImV4cCI6MjA4MDQxNDQzNn0.ApYdAjE27dNhPPuXYu3DWdMpFjvbf_gn7YvadzgxZ9I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('trainings').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Keys for 'trainings' table:", Object.keys(data[0]).join(", "));
    console.log("Sample row:", JSON.stringify(data[0], null, 2));
  } else {
    console.log("No data found in 'trainings' or error occurred.");
    console.log("Error:", error);
  }
}

check();

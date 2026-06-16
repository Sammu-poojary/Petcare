import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qfvtvzlqynovobdtftqs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdnR2emxxeW5vdm9iZHRmdHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzg0MzYsImV4cCI6MjA4MDQxNDQzNn0.ApYdAjE27dNhPPuXYu3DWdMpFjvbf_gn7YvadzgxZ9I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('appointments').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Appointments Keys:", Object.keys(data[0]));
  } else {
    // If no data, we can try to guess from the error or use another way? 
    // Actually, I'll just check orders too.
  }
  const { data: oData } = await supabase.from('orders').select('*').limit(1);
  if (oData && oData.length > 0) {
    console.log("Orders Keys:", Object.keys(oData[0]));
  }
}

check();

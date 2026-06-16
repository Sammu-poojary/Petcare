import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qfvtvzlqynovobdtftqs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdnR2emxxeW5vdm9iZHRmdHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzg0MzYsImV4cCI6MjA4MDQxNDQzNn0.ApYdAjE27dNhPPuXYu3DWdMpFjvbf_gn7YvadzgxZ9I";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const userId = "8b827a7b-345e-4323-924f-d3cda703cb5e"; // From profiles screenshot
  
  console.log("--- Testing 'orders' insert ---");
  const { error: oErr } = await supabase.from('orders').insert({
    user_id: userId,
    service_type: 'Medical Shop',
    item_name: 'Test Item',
    payment_method: 'upi',
    amount: 100
  });
  if (oErr) console.log("Orders Error:", oErr.message); else console.log("Orders success");

  console.log("--- Testing 'appointments' insert ---");
  const { error: aErr } = await supabase.from('appointments').insert({
    pet_name: 'Test Pet',
    service: 'Doctor Consultation (Test)',
    date: new Date().toLocaleDateString(),
    status: 'Pending'
  });
  if (aErr) console.log("Appointments Error:", aErr.message); else console.log("Appointments success");

  console.log("--- Testing 'trainings' insert ---");
  const { error: tErr } = await supabase.from('trainings').insert({
    owner_id: userId,
    pet_name: 'Test Pet',
    training_type: 'Grooming',
    status: 'Pending'
  });
  if (tErr) console.log("Trainings Error:", tErr.message); else console.log("Trainings success");
}

testInsert();

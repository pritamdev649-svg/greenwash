import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdlomaqcpfetmeekujfk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbG9tYXFjcGZldG1lZWt1amZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTgxOTAsImV4cCI6MjA4OTQ5NDE5MH0.tLu913SsjJjISBMNvXKMvr11NSic7ZEn83uHWNSytSU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing customers query...");
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      branch:branches(name),
      orders:orders(total_amount, balance_amount, payment_status)
    `)
    .order('name');
  
  if (error) {
    console.error("Error fetching customers:", error);
  } else {
    console.log("Data fetched successfully. Count:", data.length);
    if (data.length > 0) {
        console.log("First customer:", data[0]);
    }
  }

  console.log("Testing categories query...");
  const catRes = await supabase.from('categories').select('*');
  if (catRes.error) {
      console.error("Error fetching categories:", catRes.error);
  } else {
      console.log("Categories count:", catRes.data.length);
  }
}

test();

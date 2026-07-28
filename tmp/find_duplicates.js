import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdlomaqcpfetmeekujfk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbG9tYXFjcGZldG1lZWt1amZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTgxOTAsImV4cCI6MjA4OTQ5NDE5MH0.tLu913SsjJjISBMNvXKMvr11NSic7ZEn83uHWNSytSU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findDuplicates() {
  console.log("Fetching all customers...");
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, mobile, vendor_id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error);
    return;
  }

  console.log(`Total customers: ${customers.length}`);

  const counts = {};
  customers.forEach(c => {
    const norm = c.mobile ? c.mobile.replace(/\D/g, '') : 'empty';
    if (!counts[norm]) {
      counts[norm] = [];
    }
    counts[norm].push(c);
  });

  console.log("\n--- Grouped Mobile Numbers with >= 2 entries ---");
  let duplicatesCount = 0;
  for (const [mobile, list] of Object.entries(counts)) {
    if (list.length > 1) {
      duplicatesCount++;
      console.log(`Mobile: ${mobile} (Normalized from: ${list.map(x => x.mobile).join(', ')})`);
      list.forEach(c => {
        console.log(`  - ID: ${c.id}, Name: "${c.name}", Vendor: ${c.vendor_id}, Created: ${c.created_at}`);
      });
    }
  }
  console.log(`\nFound ${duplicatesCount} duplicate phone number groups.`);
}

findDuplicates();

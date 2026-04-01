const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './Backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const clothTypes = [
  { name: 'Shirt (Cotton)', wash_price: 15, iron_price: 10, dry_clean_price: 60 },
  { name: 'T-Shirt', wash_price: 10, iron_price: 7, dry_clean_price: 40 },
  { name: 'Jeans / Denims', wash_price: 20, iron_price: 15, dry_clean_price: 80 },
  { name: 'Trouser / Pant', wash_price: 18, iron_price: 12, dry_clean_price: 70 },
  { name: 'Kurta', wash_price: 25, iron_price: 15, dry_clean_price: 90 },
  { name: 'Pyjama', wash_price: 15, iron_price: 8, dry_clean_price: 50 },
  { name: 'Jacket (Light)', wash_price: 45, iron_price: 25, dry_clean_price: 150 },
  { name: 'Sweater / Cardigan', wash_price: 60, iron_price: 20, dry_clean_price: 120 },
  { name: 'Suit (2 Piece)', wash_price: 150, iron_price: 50, dry_clean_price: 350 },
  { name: 'Sherwani', wash_price: 200, iron_price: 100, dry_clean_price: 500 },
  { name: 'Saree (Cotton)', wash_price: 40, iron_price: 30, dry_clean_price: 120 },
  { name: 'Saree (Silk/Work)', wash_price: 80, iron_price: 50, dry_clean_price: 250 },
  { name: 'Blouse', wash_price: 15, iron_price: 10, dry_clean_price: 50 },
  { name: 'Bedsheet (Single)', wash_price: 30, iron_price: 20, dry_clean_price: 100 },
  { name: 'Bedsheet (Double)', wash_price: 50, iron_price: 30, dry_clean_price: 150 },
  { name: 'Pillow Cover', wash_price: 10, iron_price: 5, dry_clean_price: 30 },
  { name: 'Blanket (Single)', wash_price: 120, iron_price: 0, dry_clean_price: 250 },
  { name: 'Blanket (Double)', wash_price: 200, iron_price: 0, dry_clean_price: 400 },
  { name: 'Curtain (Per Panel)', wash_price: 50, iron_price: 30, dry_clean_price: 150 },
  { name: 'Towel (Large)', wash_price: 25, iron_price: 0, dry_clean_price: 60 }
];

async function seed() {
  console.log("Seeding common cloth types with Dry Clean prices...");
  for (const item of clothTypes) {
    const { data, error } = await supabase
      .from('cloth_types')
      .upsert(item, { onConflict: 'name' });
    
    if (error) {
      console.error(`Error seeding ${item.name}:`, error.message);
    } else {
      console.log(`Successfully seeded/updated: ${item.name}`);
    }
  }
}

seed();

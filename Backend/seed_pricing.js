import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pricingData = [
  // Premium Laundry
  { category: 'Premium Laundry', item: 'Bath Towel', price: '39/-' },
  { category: 'Premium Laundry', item: 'Bed Cover S/D', price: '49/89/-' },
  { category: 'Premium Laundry', item: 'Bed Sheet S/D', price: '39/79/-' },
  { category: 'Premium Laundry', item: 'Blouse Plain', price: '29/-' },
  { category: 'Premium Laundry', item: 'Cushion Cover S/B', price: '59/79/-' },
  { category: 'Premium Laundry', item: 'Car Seat Cover/seat', price: '79/-' },
  { category: 'Premium Laundry', item: 'Chair Sheet Cover', price: '49/-' },
  { category: 'Premium Laundry', item: 'Curtain Window/door', price: '69/99/-' },
  { category: 'Premium Laundry', item: 'Dhoti (women)', price: '89/-' },
  { category: 'Premium Laundry', item: 'Dhoti (man)', price: '89/-' },
  { category: 'Premium Laundry', item: 'Dress Cotton-short/long', price: '79/99/-' },
  { category: 'Premium Laundry', item: 'Dupatta', price: '29/-' },
  { category: 'Premium Laundry', item: 'Kurti Plain', price: '49/-' },
  { category: 'Premium Laundry', item: 'Kurta Plain', price: '29/-' },
  { category: 'Premium Laundry', item: 'Face Hand Towel', price: '29/-' },
  { category: 'Premium Laundry', item: 'Gown Plain', price: '109/-' },
  { category: 'Premium Laundry', item: 'Inner Woolen', price: '49/-' },
  { category: 'Premium Laundry', item: 'Jeans', price: '49/-' },
  { category: 'Premium Laundry', item: 'Leggings', price: '49/-' },
  { category: 'Premium Laundry', item: 'Mufler/scarf', price: '49/-' },
  { category: 'Premium Laundry', item: 'Plazo', price: '49/-' },
  { category: 'Premium Laundry', item: 'Pillow Cover', price: '29/-' },
  { category: 'Premium Laundry', item: 'Pajama', price: '49/-' },
  { category: 'Premium Laundry', item: 'Pajama Woolen', price: '49/-' },
  { category: 'Premium Laundry', item: 'Quilt Cover S/D', price: '49/89/-' },
  { category: 'Premium Laundry', item: 'Safari Suit', price: '99/-' },
  { category: 'Premium Laundry', item: 'Shawl Plain', price: '79/-' },
  { category: 'Premium Laundry', item: 'Shirt', price: '39/-' },
  { category: 'Premium Laundry', item: 'Short', price: '29/-' },
  { category: 'Premium Laundry', item: 'Stole', price: '29/-' },
  { category: 'Premium Laundry', item: 'Sweater Half/full', price: '49/79/-' },
  { category: 'Premium Laundry', item: 'T-Shirt', price: '39/-' },
  { category: 'Premium Laundry', item: 'Tie', price: '25/-' },
  { category: 'Premium Laundry', item: 'Top', price: '39/-' },
  { category: 'Premium Laundry', item: 'Trouser/Pant', price: '39/-' },

  // Dry Cleaning
  { category: 'Dry Cleaning', item: 'Achkan', price: '299/-' },
  { category: 'Dry Cleaning', item: 'Bath Towel', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Bed Cover S/D', price: '79/129/-' },
  { category: 'Dry Cleaning', item: 'Bed Sheet S/D', price: '79/119/-' },
  { category: 'Dry Cleaning', item: 'Blanket S/D', price: '249/349/-' },
  { category: 'Dry Cleaning', item: 'Blouse Plain/Embroidery', price: '49/69/-' },
  { category: 'Dry Cleaning', item: 'Blazer', price: '230/-' },
  { category: 'Dry Cleaning', item: 'Car Seat Cover/seat', price: '99/-' },
  { category: 'Dry Cleaning', item: 'Chair Sheet Cover S/D', price: '59/89/-' },
  { category: 'Dry Cleaning', item: 'Curtain Window/door/Heavy', price: '150/200/225/-' },
  { category: 'Dry Cleaning', item: 'Cushion Cover S/B', price: '59/89/-' },
  { category: 'Dry Cleaning', item: 'Cardigan H/F', price: '100/150/-' },
  { category: 'Dry Cleaning', item: 'Dupatta Plain/Embroidery', price: '49/79/-' },
  { category: 'Dry Cleaning', item: 'Dress Plain/Embroidery/Exclusive Designer', price: '150/250/350/-' },
  { category: 'Dry Cleaning', item: 'Face Towel/Hand Towel', price: '39/-' },
  { category: 'Dry Cleaning', item: 'Gown Plain/Embroidery/Heavy', price: '149/249/-' },
  { category: 'Dry Cleaning', item: 'Jacket H/F', price: '150/200/-' },
  { category: 'Dry Cleaning', item: 'Jacket Leather', price: '350/-' },
  { category: 'Dry Cleaning', item: 'Jeans', price: '90/-' },
  { category: 'Dry Cleaning', item: 'Inner Woolen', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Sadri/ Modi Style', price: '149/-' },
  { category: 'Dry Cleaning', item: 'Kurta Plain/Heavy', price: '79/99/-' },
  { category: 'Dry Cleaning', item: 'Kurta Woolen', price: '150/-' },
  { category: 'Dry Cleaning', item: 'Kurti', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Lehenga Plain/Embroidery', price: '250/450/-' },
  { category: 'Dry Cleaning', item: 'Lehenga Exclusive Designer', price: '699/-' },
  { category: 'Dry Cleaning', item: 'Leggings', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Trouser/Pant', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Long Coat/over Coat', price: '299/-' },
  { category: 'Dry Cleaning', item: 'Petticoat', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Pillow Cover', price: '59/-' },
  { category: 'Dry Cleaning', item: 'Plazo', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Pajama Plain/woolen', price: '79/99/-' },
  { category: 'Dry Cleaning', item: 'Quilt S/D', price: '249/349/-' },
  { category: 'Dry Cleaning', item: 'Quilt Cover S/D', price: '99/149/-' },
  { category: 'Dry Cleaning', item: 'Salwar', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Saree Plain/embroidery', price: '149/249/-' },
  { category: 'Dry Cleaning', item: 'Saree Exclusive Designer', price: '349/-' },
  { category: 'Dry Cleaning', item: 'Sherwani Plain/heavy', price: '250/350/-' },
  { category: 'Dry Cleaning', item: 'Sherwani Exclusive Designer', price: '450/-' },
  { category: 'Dry Cleaning', item: 'Shirt', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Short', price: '49/-' },
  { category: 'Dry Cleaning', item: 'Skirt Long/short', price: '79/159/-' },
  { category: 'Dry Cleaning', item: 'Sleeping Bed', price: '349/-' },
  { category: 'Dry Cleaning', item: 'Sofa Cover Small/big', price: '79/99/-' },
  { category: 'Dry Cleaning', item: 'Stole/scarf', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Stuff Toys Small/medium/xl', price: '99/149/299/-' },
  { category: 'Dry Cleaning', item: 'Stuff Toys Large', price: '399/-' },
  { category: 'Dry Cleaning', item: 'Suit 2pc/3pc', price: '279/349/-' },
  { category: 'Dry Cleaning', item: 'Sweater Half/full', price: '89/139/-' },
  { category: 'Dry Cleaning', item: 'Tie', price: '29/-' },
  { category: 'Dry Cleaning', item: 'Top', price: '49/-' },
  { category: 'Dry Cleaning', item: 'Track Suit', price: '199/-' },
  { category: 'Dry Cleaning', item: 'T-shirt', price: '79/-' },
  { category: 'Dry Cleaning', item: 'Mufler/scarf/cap', price: '49/-' },
  { category: 'Dry Cleaning', item: 'Waist Coat', price: '125/-' },

  // Steam Iron
  { category: 'Steam Iron', item: 'Casual/Regular Wear', price: '10/-' },
  { category: 'Steam Iron', item: 'Bed Sheet S/D', price: '20/40/-' },
  { category: 'Steam Iron', item: 'Saree Ladies/Suit/Gown', price: '50/80/110/-' },
  { category: 'Steam Iron', item: 'Suit 2pc/3pc', price: '70/100/-' },

  // Starch
  { category: 'Starch', item: 'Plain Kurta, Pajama, Shirt, Kurti, Salwar & Dupatta', price: '50/-' },
  { category: 'Starch', item: 'Heavy Saree/Dhoti & Cotton Skirt', price: '55/95/-' },

  // Shoe Cleaning
  { category: 'Shoe Cleaning', item: 'Shoe Pair Cleaning', price: '199/-' },
  { category: 'Shoe Cleaning', item: 'Kids Shoe Pair', price: '149/-' },
];

async function seed() {
  try {
    console.log('Deleting existing pricing data...');
    // Delete all rows
    const { error: deleteError } = await supabase.from('pricing').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('Error deleting data:', deleteError);
      return;
    }

    console.log(`Inserting ${pricingData.length} new pricing items...`);
    // Insert in chunks of 50 to avoid any potential payload limits
    for (let i = 0; i < pricingData.length; i += 50) {
      const chunk = pricingData.slice(i, i + 50);
      const { error: insertError } = await supabase.from('pricing').insert(chunk);
      if (insertError) {
        console.error('Error inserting chunk:', insertError);
        return;
      }
    }

    console.log('Successfully seeded pricing data!');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

seed();

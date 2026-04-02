const REST_URL = "https://hdlomaqcpfetmeekujfk.supabase.co/rest/v1";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbG9tYXFjcGZldG1lZWt1amZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTgxOTAsImV4cCI6MjA4OTQ5NDE5MH0.tLu913SsjJjISBMNvXKMvr11NSic7ZEn83uHWNSytSU";

const items_data = {
    "WASH & FOLD": [
        { name: "Shirt", price: 25 }, { name: "T-Shirt", price: 20 }, { name: "Jeans/Trouser", price: 30 },
        { name: "Bed Sheet (S)", price: 50 }, { name: "Towel", price: 15 }
    ],
    "WASH & IRON": [
        { name: "Shirt", price: 45 }, { name: "Trouser", price: 45 }, { name: "Kurta Pyjama", price: 80 },
        { name: "Saree (Cotton)", price: 120 }
    ],
    "IRONING ONLY": [
        { name: "Shirt", price: 15 }, { name: "Trouser", price: 15 }, { name: "Dress", price: 30 }
    ],
    "STEAM IRON": [
        { name: "Blazer", price: 80 }, { name: "Suit (2pc)", price: 150 }, { name: "Saree Silk", price: 100 }
    ],
    "DRY CLEAN": [
        { name: "Suit (3pc)", price: 350 }, { name: "Lehenga", price: 800 }, { name: "Saree Work", price: 450 },
        { name: "Blanket (D)", price: 500 }, { name: "Curtain (per pc)", price: 150 }
    ],
    "PREMIUM LAUNDRY": [
        { name: "Silk Dress", price: 500 }, { name: "Designer Kurta", price: 600 }
    ],
    "PETROL WASH": [
        { name: "Leather Jacket", price: 600 }, { name: "Suede Shoes", price: 400 }
    ],
    "STARCHING": [
        { name: "Cotton Saree", price: 150 }, { name: "White Shirt", price: 60 }
    ],
    "SAREE POLISH": [
        { name: "Saree Roll Press", price: 200 }
    ],
    "SHOE CLEANING": [
        { name: "Sneakers", price: 200 }, { name: "Sports Shoes", price: 250 }
    ],
    "BAG CLEANING": [
        { name: "Backpack", price: 300 }, { name: "Handbag", price: 800 }
    ],
    "CARPET CLEANING": [
        { name: "Carpet (Standard)", price: 500 }
    ],
    "BLANKET CLEAN": [
        { name: "Blanket (Double)", price: 450 }, { name: "Quilt (Rajai)", price: 600 }
    ],
    "DYEING (DYE)": [
        { name: "Jeans Dye", price: 150 }, { name: "Saree Dye", price: 300 }
    ]
};

async function seedItems() {
    console.log("Seeding catalog items one-by-one for safety...");
    try {
        const catRes = await fetch(`${REST_URL}/categories`, {
            headers: { 'apikey': ANON_KEY }
        });
        const categories = await catRes.json();
        const catMap = {};
        categories.forEach(c => catMap[c.name.toUpperCase()] = c.id);

        for (const [catName, items] of Object.entries(items_data)) {
            const catId = catMap[catName];
            if (!catId) continue;

            for (const item of items) {
                // Ensure unique name by appending category if needed (Standard laundry practice)
                // but only if the SQL haven't been run. Actually I'll let the user decide.
                // Let's assume they run SQL and use the pure name. 
                // However, I'll use a SAFE check:
                const nameInDb = `${item.name} (${catName})`;
                
                try {
                    const res = await fetch(`${REST_URL}/cloth_types`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': ANON_KEY,
                            'Authorization': `Bearer ${ANON_KEY}`,
                            // Try Pure Name First
                        },
                        body: JSON.stringify({
                            name: item.name,
                            category_id: catId,
                            wash_price: item.price,
                            iron_price: item.price,
                            dry_clean_price: item.price
                        })
                    });

                    if (res.ok) {
                        console.log(`Added: ${item.name} in ${catName}`);
                    } else {
                        const err = await res.json();
                        if (err.code === '23505') { // Constraint violation
                            // Try with suffix
                            const res2 = await fetch(`${REST_URL}/cloth_types`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': ANON_KEY,
                                    'Authorization': `Bearer ${ANON_KEY}`
                                },
                                body: JSON.stringify({
                                    name: `${item.name} (${catName})`,
                                    category_id: catId,
                                    wash_price: item.price,
                                    iron_price: item.price,
                                    dry_clean_price: item.price
                                })
                            });
                            if (res2.ok) {
                                console.log(`Added (with suffix): ${item.name} in ${catName}`);
                            }
                        }
                    }
                } catch (e) {
                    console.error(`Error for ${item.name}:`, e);
                }
            }
        }
        console.log("Seeding complete!");

    } catch (e) {
        console.error("Fatal error during item seeding:", e);
    }
}

seedItems();

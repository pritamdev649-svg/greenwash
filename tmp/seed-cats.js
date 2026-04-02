const URL = "https://hdlomaqcpfetmeekujfk.supabase.co/rest/v1/categories";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbG9tYXFjcGZldG1lZWt1amZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTgxOTAsImV4cCI6MjA4OTQ5NDE5MH0.tLu913SsjJjISBMNvXKMvr11NSic7ZEn83uHWNSytSU";

const CATEGORIES = [
    "WASH & FOLD", 
    "WASH & IRON", 
    "IRONING ONLY", 
    "STEAM IRON", 
    "DRY CLEAN", 
    "PREMIUM LAUNDRY", 
    "PETROL WASH", 
    "STARCHING", 
    "SAREE POLISH", 
    "SHOE CLEANING", 
    "BAG CLEANING", 
    "CARPET CLEANING", 
    "BLANKET CLEAN", 
    "DYEING (DYE)"
].map(name => ({ name }));

async function seed() {
    console.log("Seeding categories...");
    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`,
                'Prefer': 'resolution=merge-duplicates' // Same as upsert
            },
            body: JSON.stringify(CATEGORIES)
        });

        if (response.ok) {
            console.log("Categories seeded successfully!");
        } else {
            const err = await response.json();
            console.error("Error seeding categories:", err);
            // If table missing, we'll see it here
        }
    } catch (e) {
        console.error("Fatal error during seeding:", e);
    }
}

seed();

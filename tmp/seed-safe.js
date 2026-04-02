const URL = "https://hdlomaqcpfetmeekujfk.supabase.co/rest/v1/categories";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbG9tYXFjcGZldG1lZWt1amZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTgxOTAsImV4cCI6MjA4OTQ5NDE5MH0.tLu913SsjJjISBMNvXKMvr11NSic7ZEn83uHWNSytSU";

const CATEGORIES = [
    "WASH & FOLD", "WASH & IRON", "IRONING ONLY", "STEAM IRON", "DRY CLEAN", 
    "PREMIUM LAUNDRY", "PETROL WASH", "STARCHING", "SAREE POLISH", 
    "SHOE CLEANING", "BAG CLEANING", "CARPET CLEANING", "BLANKET CLEAN", "DYEING (DYE)"
];

async function seed() {
    console.log("Seeding categories one by one...");
    for (const name of CATEGORIES) {
        try {
            const response = await fetch(URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': ANON_KEY,
                    'Authorization': `Bearer ${ANON_KEY}`
                },
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                console.log(`Successfully added: ${name}`);
            } else {
                const err = await response.json();
                if (err.code === '23505') {
                    console.log(`Skipped (Already exists): ${name}`);
                } else {
                    console.error(`Error adding ${name}:`, err);
                }
            }
        } catch (e) {
            console.error(`Fetch error for ${name}:`, e);
        }
    }
    console.log("Done!");
}

seed();

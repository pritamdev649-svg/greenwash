async function get() {
    const r = await fetch('https://hdlomaqcpfetmeekujfk.supabase.co/rest/v1/categories', {
        headers: { 
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbG9tYXFjcGZldG1lZWt1amZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTgxOTAsImV4cCI6MjA4OTQ5NDE5MH0.tLu913SsjJjISBMNvXKMvr11NSic7ZEn83uHWNSytSU' 
        }
    });
    const data = await r.json();
    console.log(JSON.stringify(data, null, 2));
}
get();

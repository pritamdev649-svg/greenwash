import React, { useEffect, useState } from 'react';
import { supabase } from '../Backend/src/config/supabase';

export const DbCheck: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  useEffect(() => {
    const runCheck = async () => {
      addLog('Starting Database Check...');

      const users = [
        { email: 'superadmin@ravi.com', role: 'super_admin', name: 'Super Admin Ravi' },
        { email: 'adminsumit@gmail.com', role: 'admin', name: 'Admin Sumit' },
        { email: 'vendor1@greenwashco.com', role: 'vendor', name: 'Vendor 1' }
      ];

      for (const u of users) {
        addLog(`\nChecking: ${u.email}...`);
        
        // Try to sign up to see if they exist
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: u.email,
          password: 'Password@123' // Default password if creating
        });

        let userId = signUpData?.user?.id;

        if (signUpError && signUpError.message.includes('already registered')) {
          addLog(`✔️ User already exists in auth.users.`);
          // Since they exist, we can't easily get their ID without logging in, 
          // and we don't know their password. But let's try a common one.
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: u.email,
            password: 'Password@123'
          });
          if (signInData?.user) {
            userId = signInData.user.id;
          } else {
            addLog(`⚠️ Cannot check user_profiles because we don't know the password.`);
            continue;
          }
        } else if (signUpError) {
          addLog(`❌ Error checking user: ${signUpError.message}`);
          continue;
        } else if (userId) {
          addLog(`✔️ Created new user in auth.users with password 'Password@123'.`);
        }

        if (userId) {
          // Check user_profiles
          const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
          if (profile) {
            addLog(`✔️ Profile exists with role: ${profile.role}`);
            if (profile.role !== u.role) {
              addLog(`⚠️ Updating role from ${profile.role} to ${u.role}...`);
              await supabase.from('user_profiles').update({ role: u.role }).eq('id', userId);
            }
          } else {
            addLog(`⚠️ Profile missing! Creating profile with role: ${u.role}...`);
            await supabase.from('user_profiles').insert([{
              id: userId,
              role: u.role,
              name: u.name,
              is_active: true
            }]);
            addLog(`✔️ Profile created.`);
          }
        }
      }

      addLog('\nCheck complete! If users were already registered, you must log in with the password you set for them originally.');
      setDone(true);
    };

    runCheck();
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', color: '#0f0', padding: 20, zIndex: 9999, fontFamily: 'monospace', overflowY: 'auto' }}>
      <h2>Database Checker Tool</h2>
      {logs.map((l, i) => <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{l}</div>)}
      {done && (
        <button 
          onClick={() => window.location.reload()}
          style={{ marginTop: 20, padding: '10px 20px', background: '#0f0', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Close & Reload
        </button>
      )}
    </div>
  );
};

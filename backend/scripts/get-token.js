/**
 * Script pour obtenir un token JWT Supabase
 * Usage: node get-token.js <email> <password>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const email = process.argv[2] || 'test@example.com';
const password = process.argv[3] || 'Test123456!';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_ANON_KEY manquants dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getToken() {
  console.log(`🔐 Connexion avec ${email}...`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Erreur:', error.message);
    console.log('');
    console.log('💡 Pour créer un utilisateur de test :');
    console.log('   1. Allez sur https://app.supabase.com');
    console.log('   2. Ouvrez votre projet');
    console.log('   3. Authentication > Users > Add user');
    console.log('   4. Email: test@example.com');
    console.log('   5. Password: Test123456!');
    process.exit(1);
  }

  console.log('✅ Connexion réussie !');
  console.log('');
  console.log('📋 Token JWT:');
  console.log(data.session.access_token);
  console.log('');
  console.log('👤 User ID:', data.user.id);
  console.log('📧 Email:', data.user.email);
  console.log('⏰ Expire:', new Date(data.session.expires_at * 1000).toLocaleString());
  console.log('');
  console.log('🧪 Test avec curl:');
  console.log(`curl -H "Authorization: Bearer ${data.session.access_token}" http://localhost:8080/api/me`);
  console.log('');

  // Sauvegarder dans un fichier
  const fs = require('fs');
  fs.writeFileSync('.token', data.session.access_token);
  console.log('💾 Token sauvegardé dans .token');
}

getToken().catch(console.error);

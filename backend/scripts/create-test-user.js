/**
 * Script pour créer un utilisateur de test via l'API Supabase Admin
 * Usage: node create-test-user.js [email] [password]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const email = process.argv[2] || 'test@example.com';
const password = process.argv[3] || 'Test123456!';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL ou SUPABASE_SERVICE_KEY manquants dans .env');
  process.exit(1);
}

// Utiliser le service_role key pour créer l'utilisateur
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUser() {
  console.log(`Création de l'utilisateur ${email}...`);

  // Créer l'utilisateur via l'API Admin
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirmer l'email
  });

  if (error) {
    console.error('Erreur:', error.message);
    
    // Si l'utilisateur existe déjà, essayer de le récupérer
    if (error.message.includes('already registered')) {
      console.log('');
      console.log('ℹ  L\'utilisateur existe déjà. Utilisez get-token.js pour vous connecter:');
      console.log(`   node scripts/get-token.js ${email} ${password}`);
    }
    
    process.exit(1);
  }

  console.log('Utilisateur créé avec succès !');
  console.log('');
  console.log('User ID:', data.user.id);
  console.log('Email:', data.user.email);
  console.log('');
  console.log('Obtenir un token JWT:');
  console.log(`   node scripts/get-token.js ${email} ${password}`);
  console.log('');
}

createUser();

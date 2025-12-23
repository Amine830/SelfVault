/**
 * Script pour réinitialiser l'utilisateur de test et obtenir un token valide
 */

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const prisma = new PrismaClient();

const testEmail = 'apitest@selfvault.com';
const testPassword = 'TestPassword123!';

async function resetTestUser() {
  try {
    console.log('🔍 Recherche de l\'utilisateur de test...');
    
    // Supprimer l'utilisateur existant s'il existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === testEmail);
    
    if (existingUser) {
      console.log(`🗑️  Suppression de l'utilisateur existant (${existingUser.id})...`);
      
      // Supprimer de la DB Prisma
      await prisma.user.deleteMany({
        where: { id: existingUser.id }
      });
      
      // Supprimer de Supabase Auth
      await supabase.auth.admin.deleteUser(existingUser.id);
    }
    
    // Créer un nouvel utilisateur
    console.log('👤 Création du nouvel utilisateur de test...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: 'API Test User'
      }
    });
    
    if (createError) {
      throw createError;
    }
    
    console.log(`✅ Utilisateur Supabase créé avec succès !`);
    console.log(`   ID: ${newUser.user.id}`);
    console.log(`   Email: ${newUser.user.email}`);
    
    // Créer l'utilisateur dans la DB avec ses settings
    console.log('📝 Création de l\'enregistrement utilisateur dans la DB...');
    await prisma.user.create({
      data: {
        id: newUser.user.id,
        email: newUser.user.email,
        userSettings: {
          create: {}
        }
      }
    });
    
    console.log('✅ Enregistrement utilisateur créé avec settings par défaut !');
    
    // Se connecter pour obtenir un token
    console.log('\n🔑 Génération du token JWT...');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      throw signInError;
    }
    
    const session = data.session;
    
    console.log('\n✅ Token généré avec succès !');
    console.log('\n📋 Informations de test :');
    console.log('━'.repeat(80));
    console.log(`Email:    ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log(`User ID:  ${newUser.user.id}`);
    console.log('\n🎫 JWT Token (valide 1h) :');
    console.log(session.access_token);
    console.log('━'.repeat(80));
    console.log('\n💡 Commande de test :');
    console.log(`curl -X POST http://localhost:8080/api/files/upload \\`);
    console.log(`  -H "Authorization: Bearer ${session.access_token}" \\`);
    console.log(`  -F "file=@test-file.txt" \\`);
    console.log(`  -F "visibility=private"`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resetTestUser();

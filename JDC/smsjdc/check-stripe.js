#!/usr/bin/env node

/**
 * Script de vérification de l'installation Stripe
 * Vérifie que tous les fichiers et configurations sont en place
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Vérification de l\'installation Stripe...\n');

let errors = 0;
let warnings = 0;

// Vérifier les fichiers backend
const backendFiles = [
  'src/services/stripeService.js',
  'src/routes/stripe.js',
  'server.js'
];

console.log('📦 Backend Files:');
backendFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) errors++;
});

// Vérifier les fichiers frontend
const frontendFiles = [
  'public/js/stripe-payment.js',
  'public/css/components/stripe-payment.css',
  'public/payment-success.html',
  'public/payment-cancel.html'
];

console.log('\n🎨 Frontend Files:');
frontendFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) errors++;
});

// Vérifier les packages npm
console.log('\n📚 NPM Packages:');
const packageJson = require('./package.json');
const hasStripe = packageJson.dependencies && packageJson.dependencies.stripe;
console.log(`  ${hasStripe ? '✅' : '❌'} stripe package`);
if (!hasStripe) errors++;

// Vérifier les variables d'environnement
console.log('\n🔐 Environment Variables:');
require('dotenv').config();

const envVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  const isConfigured = value && value.trim() !== '';
  
  if (!isConfigured) {
    console.log(`  ⚠️  ${varName} (non configuré)`);
    warnings++;
  } else {
    // Masquer la clé pour la sécurité
    const masked = value.substring(0, 7) + '...' + value.substring(value.length - 4);
    console.log(`  ✅ ${varName} (${masked})`);
  }
});

// Vérifier la structure des routes dans server.js
console.log('\n🔌 Server Integration:');
const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
const hasStripeImport = serverContent.includes('require(\'./src/routes/stripe\')');
const hasStripeRoute = serverContent.includes('app.use(\'/api/stripe\'');

console.log(`  ${hasStripeImport ? '✅' : '❌'} Stripe routes imported`);
console.log(`  ${hasStripeRoute ? '✅' : '❌'} Stripe routes mounted`);

if (!hasStripeImport || !hasStripeRoute) errors++;

// Vérifier l'intégration frontend dans index.html
console.log('\n🌐 Frontend Integration:');
const indexContent = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');
const hasStripeCSS = indexContent.includes('stripe-payment.css');
const hasStripeJS = indexContent.includes('stripe-payment.js');

console.log(`  ${hasStripeCSS ? '✅' : '❌'} Stripe CSS linked`);
console.log(`  ${hasStripeJS ? '✅' : '❌'} Stripe JS script included`);

if (!hasStripeCSS || !hasStripeJS) errors++;

// Résumé
console.log('\n' + '='.repeat(50));
console.log('📊 Résumé:');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('✅ Installation complète ! Tout est en place.');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Créer un compte Stripe: https://dashboard.stripe.com/register');
  console.log('   2. Récupérer vos clés API de test');
  console.log('   3. Les ajouter dans le fichier .env');
  console.log('   4. Démarrer le serveur: node server.js');
  console.log('   5. Tester avec la carte: 4242 4242 4242 4242');
  process.exit(0);
} else if (errors === 0 && warnings > 0) {
  console.log(`⚠️  Installation complète avec ${warnings} avertissement(s)`);
  console.log('\n⚠️  Clés Stripe non configurées:');
  console.log('   1. Allez sur https://dashboard.stripe.com');
  console.log('   2. Développeurs → Clés API');
  console.log('   3. Copiez la clé publiable (pk_test_...)');
  console.log('   4. Copiez la clé secrète (sk_test_...)');
  console.log('   5. Ajoutez-les dans .env');
  console.log('\n💡 Le serveur peut démarrer mais Stripe ne fonctionnera pas sans les clés.');
  process.exit(1);
} else {
  console.log(`❌ ${errors} erreur(s) trouvée(s)`);
  console.log('\n🔧 Veuillez corriger les erreurs ci-dessus avant de continuer.');
  process.exit(1);
}

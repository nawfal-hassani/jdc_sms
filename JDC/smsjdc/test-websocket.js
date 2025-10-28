#!/usr/bin/env node

/**
 * Script de test pour l'envoi groupé de SMS via WebSocket
 */

const io = require('socket.io-client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Connexion au serveur WebSocket
const socket = io('http://localhost:3030', {
  transports: ['websocket', 'polling']
});

console.log('🔄 Tentative de connexion au serveur...');

// Données de test
const testData = [
  {
    lineNumber: 1,
    phone: '+33612345678',
    message: 'Test WebSocket 1 - Envoi groupé',
    name: 'Jean Dupont',
    status: 'valid'
  },
  {
    lineNumber: 2,
    phone: '+33698765432',
    message: 'Test WebSocket 2 - Suivi temps réel',
    name: 'Marie Martin',
    status: 'valid'
  },
  {
    lineNumber: 3,
    phone: '+33645678901',
    message: 'Test WebSocket 3 - Socket.IO',
    name: 'Pierre Durand',
    status: 'valid'
  }
];

let jobId = null;

// Événements Socket.IO
socket.on('connect_error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
});

socket.on('connect', () => {
  console.log('✅ Connecté au serveur WebSocket');
  console.log('🚀 Démarrage du test d\'envoi groupé...\n');
  
  // Créer le job d'envoi groupé
  createBulkSmsJob();
});

socket.on('disconnect', () => {
  console.log('❌ Déconnecté du serveur WebSocket');
});

socket.on('bulk-sms-update', (data) => {
  console.log(`📨 [${data.type.toUpperCase()}] ${data.message}`);
  
  if (data.job) {
    console.log(`   📊 Progression: ${data.job.processed}/${data.job.total} (${data.job.progress}%)`);
    console.log(`   ✅ Succès: ${data.job.success} | ❌ Échecs: ${data.job.failed}`);
    console.log('');
  }
  
  if (data.type === 'completed' || data.type === 'stopped') {
    console.log('\n🏁 Test terminé !');
    console.log(`⏱️  Durée: ${data.job.duration}s`);
    console.log(`✅ Envoyés: ${data.job.success}`);
    console.log(`❌ Échecs: ${data.job.failed}`);
    
    setTimeout(() => {
      socket.disconnect();
      process.exit(0);
    }, 1000);
  }
});

socket.on('bulk-sms-error', (data) => {
  console.error(`❌ ERREUR: ${data.error}`);
});

// Fonction pour créer le job
async function createBulkSmsJob() {
  try {
    const response = await axios.post('http://localhost:3030/api/bulk-sms/send', {
      recipients: testData,
      delay: 2000 // 2 secondes entre chaque SMS
    });
    
    const data = response.data;
    
    if (data.success) {
      jobId = data.jobId;
      console.log(`✅ Job créé avec succès: ${jobId}`);
      console.log(`📝 ${testData.length} SMS à envoyer\n`);
      
      // Rejoindre la room du job pour recevoir les mises à jour
      socket.emit('join-job', jobId);
      console.log(`🔌 Connecté au job ${jobId}\n`);
      
    } else {
      console.error('❌ Erreur lors de la création du job:', data.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Gestion des erreurs
process.on('uncaughtException', (err) => {
  console.error('❌ Erreur non gérée:', err);
  process.exit(1);
});

// Timeout de sécurité (30 secondes)
setTimeout(() => {
  console.log('\n⏱️  Timeout - Fin du test');
  socket.disconnect();
  process.exit(0);
}, 30000);

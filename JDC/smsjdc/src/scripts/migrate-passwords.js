#!/usr/bin/env node

/**
 * Script de migration pour hasher les mots de passe existants
 * Convertit les mots de passe en clair en hashes bcrypt
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { promisify } = require('util');

const SALT_ROUNDS = 10;
const usersFilePath = path.join(__dirname, '../../data/users.json');

async function migratePasswords() {
  try {
    console.log('🔄 Démarrage de la migration des mots de passe...\n');

    // Lire le fichier des utilisateurs
    const data = await promisify(fs.readFile)(usersFilePath, 'utf8');
    const users = JSON.parse(data);

    console.log(`📋 ${users.length} utilisateur(s) trouvé(s)\n`);

    // Migrer chaque utilisateur
    const migratedUsers = await Promise.all(
      users.map(async (user) => {
        // Vérifier si le mot de passe est déjà hashé (commence par $2b$ ou $2a$)
        if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
          console.log(`✓ ${user.email} - Mot de passe déjà hashé, ignoré`);
          return user;
        }

        // Hasher le mot de passe en clair
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
        console.log(`✓ ${user.email} - Mot de passe hashé avec succès`);

        return {
          ...user,
          password: hashedPassword
        };
      })
    );

    // Sauvegarder les utilisateurs mis à jour
    await promisify(fs.writeFile)(usersFilePath, JSON.stringify(migratedUsers, null, 2), 'utf8');

    console.log('\n✅ Migration terminée avec succès !');
    console.log(`📁 Fichier sauvegardé: ${usersFilePath}`);
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

// Exécuter la migration
migratePasswords();

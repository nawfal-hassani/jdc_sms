# 🗄️ Guide de Persistance des Données sur Render

## ⚠️ Problème : Perte de données au redémarrage

Sur **Render Free Tier**, le système de fichiers est **éphémère** :
- ❌ Tous les fichiers dans `data/` sont **supprimés** à chaque redémarrage
- ❌ Les données disparaissent lors des **redéploiements**
- ❌ Pas de persistance entre les **sessions**

## 🎯 Solutions de Persistance

### Option 1 : PostgreSQL (Recommandé) ✅

#### Avantages
- ✅ Base de données gratuite sur Render (jusqu'à 90 jours d'inactivité)
- ✅ Persistance garantie
- ✅ Performance optimale
- ✅ Sauvegardes automatiques

#### Migration des données JSON vers PostgreSQL

**1. Créer une base de données PostgreSQL sur Render**

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquez sur **"New +"** → **"PostgreSQL"**
3. Configuration :
   - **Name** : `jdc-sms-database`
   - **Region** : Paris (Europe West)
   - **Plan** : Free
4. Cliquez sur **"Create Database"**
5. Une fois créée, copiez l'**Internal Database URL**

**2. Installer les dépendances**

```bash
cd /home/hassani/jdc_test-/JDC/smsjdc
npm install pg sequelize
```

**3. Créer le modèle de base de données**

Créez `src/models/database.js` :

```javascript
const { Sequelize, DataTypes } = require('sequelize');

// Connexion à PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Modèle SMS History
const SmsHistory = sequelize.define('SmsHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cost: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// Modèle Users
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user'
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  subscriptionPlan: {
    type: DataTypes.STRING,
    defaultValue: 'free'
  },
  subscriptionStatus: {
    type: DataTypes.STRING,
    defaultValue: 'inactive'
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Modèle Scheduled Messages
const ScheduledMessage = sequelize.define('ScheduledMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// Initialiser la base de données
async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Tables créées/synchronisées');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  SmsHistory,
  User,
  ScheduledMessage,
  initDatabase
};
```

**4. Migrer le code pour utiliser PostgreSQL**

Créez `src/services/historyService.js` :

```javascript
const { SmsHistory } = require('../models/database');
const { Op } = require('sequelize');

class HistoryService {
  // Ajouter une entrée
  async add(entry) {
    try {
      const created = await SmsHistory.create(entry);
      return created.toJSON();
    } catch (error) {
      console.error('Erreur ajout historique:', error);
      throw error;
    }
  }

  // Récupérer l'historique
  async getAll(userEmail = null, limit = 100) {
    try {
      const where = userEmail ? { userEmail } : {};
      
      const history = await SmsHistory.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit
      });
      
      return history.map(h => h.toJSON());
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      throw error;
    }
  }

  // Supprimer une entrée
  async remove(id) {
    try {
      const deleted = await SmsHistory.destroy({
        where: { id }
      });
      
      return deleted > 0;
    } catch (error) {
      console.error('Erreur suppression historique:', error);
      throw error;
    }
  }

  // Rechercher dans l'historique
  async search(query, userEmail = null) {
    try {
      const where = {
        [Op.or]: [
          { recipient: { [Op.iLike]: `%${query}%` } },
          { message: { [Op.iLike]: `%${query}%` } }
        ]
      };
      
      if (userEmail) {
        where.userEmail = userEmail;
      }
      
      const results = await SmsHistory.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: 50
      });
      
      return results.map(r => r.toJSON());
    } catch (error) {
      console.error('Erreur recherche historique:', error);
      throw error;
    }
  }

  // Statistiques
  async getStats(userEmail = null) {
    try {
      const where = userEmail ? { userEmail } : {};
      
      const total = await SmsHistory.count({ where });
      const sent = await SmsHistory.count({ 
        where: { ...where, status: 'sent' } 
      });
      const failed = await SmsHistory.count({ 
        where: { ...where, status: 'failed' } 
      });
      
      return { total, sent, failed };
    } catch (error) {
      console.error('Erreur stats historique:', error);
      throw error;
    }
  }
}

module.exports = new HistoryService();
```

**5. Modifier server.js pour utiliser PostgreSQL**

Ajoutez au début de `server.js` :

```javascript
const { initDatabase } = require('./src/models/database');
const historyService = require('./src/services/historyService');

// Initialiser la base de données au démarrage
initDatabase().then(success => {
  if (success) {
    console.log('✅ Base de données prête');
  } else {
    console.error('❌ Échec initialisation base de données');
  }
});
```

Remplacez les routes `/api/sms/history/*` par :

```javascript
// GET - Récupérer l'historique
app.get('/api/sms/history', async (req, res) => {
  try {
    const userEmail = req.user?.role === 'admin' ? null : req.user?.email;
    const history = await historyService.getAll(userEmail);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// DELETE - Supprimer une entrée
app.delete('/api/sms/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await historyService.remove(id);
    
    if (success) {
      res.json({ success: true, message: 'Entrée supprimée' });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Entrée non trouvée' 
      });
    }
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// POST - Rechercher dans l'historique
app.post('/api/sms/history/search', async (req, res) => {
  try {
    const { query } = req.body;
    const userEmail = req.user?.role === 'admin' ? null : req.user?.email;
    const results = await historyService.search(query, userEmail);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Erreur recherche:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});
```

**6. Ajouter DATABASE_URL dans render.yaml**

```yaml
services:
  - type: web
    name: jdc-sms-dashboard
    env: node
    buildCommand: cd smsjdc && npm install
    startCommand: cd smsjdc && node server.js
    envVars:
      # ... autres variables ...
      - key: DATABASE_URL
        fromDatabase:
          name: jdc-sms-database
          property: connectionString

databases:
  - name: jdc-sms-database
    databaseName: jdc_sms
    user: jdc_sms_user
    plan: free
```

---

### Option 2 : Render Disks (Payant) 💰

Si vous voulez continuer avec les fichiers JSON :

**Prix** : $0.25/GB/mois (minimum 1 GB = $0.25/mois)

**Configuration render.yaml** :

```yaml
services:
  - type: web
    name: jdc-sms-dashboard
    env: node
    buildCommand: cd smsjdc && npm install
    startCommand: cd smsjdc && node server.js
    disk:
      name: jdc-sms-data
      mountPath: /opt/render/project/src/smsjdc/data
      sizeGB: 1
    envVars:
      # ... vos variables existantes ...
```

**⚠️ Inconvénients** :
- Payant (PostgreSQL Free est gratuit)
- Moins performant pour les recherches
- Pas de requêtes SQL avancées

---

### Option 3 : Supabase (Alternative Gratuite) 🆓

**Avantages** :
- ✅ Gratuit jusqu'à 500 MB
- ✅ PostgreSQL hébergé
- ✅ Interface web pour visualiser les données
- ✅ API REST automatique

**Configuration** :

1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un projet
3. Copiez l'URL de connexion PostgreSQL
4. Utilisez la même configuration que l'Option 1

---

## 📋 Migration des données existantes

Si vous avez déjà des données dans `data/sms-history.json`, créez un script de migration :

**migrate-to-db.js** :

```javascript
const fs = require('fs');
const path = require('path');
const { initDatabase, SmsHistory } = require('./src/models/database');

async function migrate() {
  // Initialiser la base de données
  await initDatabase();
  
  // Lire les données JSON
  const historyPath = path.join(__dirname, 'data', 'sms-history.json');
  
  if (!fs.existsSync(historyPath)) {
    console.log('❌ Fichier sms-history.json introuvable');
    return;
  }
  
  const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  
  // Insérer dans PostgreSQL
  let imported = 0;
  for (const entry of historyData) {
    try {
      await SmsHistory.create(entry);
      imported++;
    } catch (error) {
      console.error('Erreur import:', entry.id, error.message);
    }
  }
  
  console.log(`✅ ${imported}/${historyData.length} entrées migrées`);
  process.exit(0);
}

migrate();
```

**Exécution locale** :

```bash
export DATABASE_URL="your_postgres_url"
node migrate-to-db.js
```

---

## 🚀 Déploiement Final

**1. Créer la base PostgreSQL sur Render**
**2. Installer les dépendances** : `npm install pg sequelize`
**3. Créer les fichiers** : `database.js`, `historyService.js`
**4. Modifier** `server.js` pour utiliser PostgreSQL
**5. Mettre à jour** `render.yaml`
**6. Migrer les données** (si nécessaire)
**7. Commit et push** :

```bash
git add .
git commit -m "feat: Migration vers PostgreSQL pour persistance des données"
git push origin main
```

**8. Sur Render** : Lier la base de données dans Environment Variables

---

## ✅ Vérification

Une fois déployé, testez :

1. ✅ Envoyez un SMS
2. ✅ Vérifiez qu'il apparaît dans l'historique
3. ✅ Supprimez une entrée
4. ✅ Redémarrez le service sur Render
5. ✅ Vérifiez que les données sont toujours présentes

---

## 🆘 Dépannage

### Erreur de connexion PostgreSQL

```
Error: connect ECONNREFUSED
```

**Solution** : Vérifiez que `DATABASE_URL` est bien défini dans les variables d'environnement Render.

### Tables non créées

```javascript
await sequelize.sync({ force: true }); // ⚠️ Supprime et recrée les tables
```

### Données perdues après migration

Vérifiez que le script de migration s'est bien exécuté :

```bash
node migrate-to-db.js
```

---

## 📚 Ressources

- [Render PostgreSQL Documentation](https://render.com/docs/databases)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Supabase Documentation](https://supabase.com/docs)

---

**Recommandation** : Utilisez **PostgreSQL sur Render** (gratuit) pour une solution professionnelle et pérenne. 🎯

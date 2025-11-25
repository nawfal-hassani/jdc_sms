/**
 * Service de gestion de l'historique SMS par utilisateur
 * Chaque utilisateur a son propre fichier d'historique
 */

const fs = require('fs').promises;
const path = require('path');

class UserHistoryService {
  constructor() {
    this.historyDir = path.join(__dirname, '../../data/sms-history');
    this.ensureHistoryDir();
  }

  /**
   * S'assurer que le répertoire d'historique existe
   */
  async ensureHistoryDir() {
    try {
      await fs.mkdir(this.historyDir, { recursive: true });
    } catch (error) {
      console.error('Erreur création répertoire historique:', error);
    }
  }

  /**
   * Obtenir le chemin du fichier d'historique d'un utilisateur
   */
  getUserHistoryPath(userEmail) {
    // Nettoyer l'email pour créer un nom de fichier valide
    const safeEmail = userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_');
    return path.join(this.historyDir, `${safeEmail}.json`);
  }

  /**
   * Charger l'historique d'un utilisateur
   */
  async loadUserHistory(userEmail) {
    try {
      const filePath = this.getUserHistoryPath(userEmail);
      const data = await fs.readFile(filePath, 'utf8');
      const history = JSON.parse(data);
      console.log(`📂 Historique chargé pour ${userEmail}: ${history.length} SMS`);
      return history;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`📂 Nouveau fichier d'historique pour ${userEmail}`);
        return [];
      }
      console.error(`Erreur lecture historique ${userEmail}:`, error);
      return [];
    }
  }

  /**
   * Sauvegarder l'historique d'un utilisateur
   */
  async saveUserHistory(userEmail, history) {
    try {
      const filePath = this.getUserHistoryPath(userEmail);
      await fs.writeFile(filePath, JSON.stringify(history, null, 2), 'utf8');
      console.log(`💾 Historique sauvegardé pour ${userEmail}: ${history.length} SMS`);
      return true;
    } catch (error) {
      console.error(`Erreur sauvegarde historique ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Ajouter un SMS à l'historique d'un utilisateur
   */
  async addSmsToHistory(userEmail, smsData) {
    try {
      const history = await this.loadUserHistory(userEmail);
      
      const smsRecord = {
        id: this.generateId(),
        userEmail: userEmail,
        type: smsData.type || 'SMS',
        to: smsData.to,
        message: smsData.message,
        status: smsData.status || 'pending',
        source: smsData.source || 'dashboard',
        timestamp: new Date().toISOString(),
        ...smsData
      };

      history.unshift(smsRecord); // Ajouter au début
      
      // Limiter l'historique à 1000 entrées par utilisateur
      if (history.length > 1000) {
        history.splice(1000);
      }

      await this.saveUserHistory(userEmail, history);
      console.log(`✅ SMS ajouté à l'historique de ${userEmail}`);
      
      return smsRecord;
    } catch (error) {
      console.error(`Erreur ajout SMS historique ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un SMS de l'historique d'un utilisateur
   */
  async deleteSmsFromHistory(userEmail, smsId) {
    try {
      const history = await this.loadUserHistory(userEmail);
      const filteredHistory = history.filter(sms => sms.id !== smsId);
      
      if (filteredHistory.length === history.length) {
        return { success: false, message: 'SMS non trouvé' };
      }

      await this.saveUserHistory(userEmail, filteredHistory);
      console.log(`🗑️ SMS ${smsId} supprimé de l'historique de ${userEmail}`);
      
      return { success: true, message: 'SMS supprimé' };
    } catch (error) {
      console.error(`Erreur suppression SMS ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'un utilisateur
   */
  async getUserStatistics(userEmail) {
    try {
      const history = await this.loadUserHistory(userEmail);
      
      const stats = {
        total: history.length,
        delivered: history.filter(sms => sms.status === 'delivered' || sms.status === 'success').length,
        failed: history.filter(sms => sms.status === 'failed' || sms.status === 'error').length,
        pending: history.filter(sms => sms.status === 'pending').length,
      };

      stats.successRate = stats.total > 0 
        ? Math.round((stats.delivered / stats.total) * 100) 
        : 0;

      return stats;
    } catch (error) {
      console.error(`Erreur calcul statistiques ${userEmail}:`, error);
      return { total: 0, delivered: 0, failed: 0, pending: 0, successRate: 0 };
    }
  }

  /**
   * Obtenir tous les historiques (pour admin)
   */
  async getAllHistories() {
    try {
      const files = await fs.readdir(this.historyDir);
      const histories = {};

      for (const file of files) {
        if (file.endsWith('.json')) {
          const userEmail = file.replace('.json', '').replace(/_/g, '.');
          histories[userEmail] = await this.loadUserHistory(userEmail);
        }
      }

      return histories;
    } catch (error) {
      console.error('Erreur chargement tous les historiques:', error);
      return {};
    }
  }

  /**
   * Vider l'historique d'un utilisateur
   */
  async clearUserHistory(userEmail) {
    try {
      await this.saveUserHistory(userEmail, []);
      console.log(`🧹 Historique vidé pour ${userEmail}`);
      return { success: true, message: 'Historique vidé' };
    } catch (error) {
      console.error(`Erreur vidage historique ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * Générer un ID unique
   */
  generateId() {
    return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Exporter l'historique d'un utilisateur en CSV
   */
  async exportUserHistoryToCsv(userEmail) {
    try {
      const history = await this.loadUserHistory(userEmail);
      
      if (history.length === 0) {
        return '';
      }

      // En-têtes CSV
      const headers = ['Date', 'Type', 'Destinataire', 'Message', 'Statut'];
      let csv = headers.join(',') + '\n';

      // Lignes de données
      history.forEach(sms => {
        const date = new Date(sms.timestamp).toLocaleString('fr-FR');
        const type = sms.type || 'SMS';
        const to = sms.to || '';
        const message = (sms.message || '').replace(/"/g, '""'); // Échapper les guillemets
        const status = sms.status || 'unknown';

        csv += `"${date}","${type}","${to}","${message}","${status}"\n`;
      });

      return csv;
    } catch (error) {
      console.error(`Erreur export CSV ${userEmail}:`, error);
      throw error;
    }
  }
}

// Singleton
const userHistoryService = new UserHistoryService();

module.exports = userHistoryService;

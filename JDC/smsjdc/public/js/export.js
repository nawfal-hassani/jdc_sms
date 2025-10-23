// FRONTEND
/**
 * Module d'exportation de données pour le Dashboard JDC
 */

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
  // Référence aux boutons d'exportation
  setupExportButtons();
  
  // Exposer les fonctions pour d'autres modules
  window.exportModule = {
    exportHistory: exportHistory,
    exportDashboardData: exportDashboardData
  };
  
  // Configurer les boutons d'exportation
  function setupExportButtons() {
    // Bouton d'exportation sur le dashboard
    const dashboardExportBtn = document.getElementById('dashboard-export-btn');
    if (dashboardExportBtn) {
      dashboardExportBtn.addEventListener('click', exportDashboardData);
    }
    
    // Bouton d'exportation dans l'historique
    const historyExportBtn = document.getElementById('history-export-btn');
    if (historyExportBtn) {
      historyExportBtn.addEventListener('click', exportHistory);
    }
  }
  
  // Exporter les données du dashboard
  function exportDashboardData() {
    // Récupérer le bouton et ajouter l'animation de chargement
    const exportBtn = document.getElementById('dashboard-export-btn');
    if (exportBtn) {
      exportBtn.classList.add('export-btn-loading');
      exportBtn.disabled = true;
    }
    
    // Vérifier si Chart.js est disponible
    if (!window.Chart) {
      showNotification('Impossible d\'exporter les données: Chart.js n\'est pas chargé', 'danger');
      if (exportBtn) {
        exportBtn.classList.remove('export-btn-loading');
        exportBtn.disabled = false;
      }
      return;
    }
    
    try {
      // Récupérer les graphiques
      const dailyChart = Chart.getChart('chart-daily');
      const typesChart = Chart.getChart('chart-types');
      const successChart = Chart.getChart('chart-success');
      
      if (!dailyChart && !typesChart && !successChart) {
        showNotification('Aucun graphique à exporter', 'warning');
        return;
      }
      
      // Créer un objet pour stocker les données
      const exportData = {
        timestamp: new Date().toISOString(),
        stats: {
          totalSent: document.getElementById('stat-total')?.textContent || '0',
          successful: document.getElementById('stat-success')?.textContent || '0',
          failed: document.getElementById('stat-failed')?.textContent || '0',
          rate: document.getElementById('stat-rate')?.textContent || '0%'
        },
        charts: {}
      };
      
      // Ajouter les données des graphiques si disponibles
      if (dailyChart) {
        exportData.charts.daily = {
          labels: dailyChart.data.labels,
          data: dailyChart.data.datasets[0].data
        };
      }
      
      if (typesChart) {
        exportData.charts.types = {
          labels: typesChart.data.labels,
          data: typesChart.data.datasets[0].data
        };
      }
      
      if (successChart) {
        exportData.charts.success = {
          labels: successChart.data.labels,
          success: successChart.data.datasets[0].data,
          failures: successChart.data.datasets[1].data
        };
      }
      
      // Convertir en CSV
      let csv = 'Date d\'exportation: ' + new Date().toLocaleString('fr-FR') + '\n\n';
      
      // Ajouter les statistiques
      csv += 'STATISTIQUES\n';
      csv += 'Total SMS envoyés:,' + exportData.stats.totalSent + '\n';
      csv += 'SMS délivrés:,' + exportData.stats.successful + '\n';
      csv += 'SMS échoués:,' + exportData.stats.failed + '\n';
      csv += 'Taux de réussite:,' + exportData.stats.rate + '\n\n';
      
      // Ajouter les données quotidiennes si disponibles
      if (exportData.charts.daily) {
        csv += 'SMS ENVOYÉS (7 DERNIERS JOURS)\n';
        csv += 'Jour,Nombre de SMS\n';
        exportData.charts.daily.labels.forEach((label, index) => {
          csv += label + ',' + exportData.charts.daily.data[index] + '\n';
        });
        csv += '\n';
      }
      
      // Ajouter les types si disponibles
      if (exportData.charts.types) {
        csv += 'TYPES DE SMS\n';
        csv += 'Type,Nombre\n';
        exportData.charts.types.labels.forEach((label, index) => {
          csv += label + ',' + exportData.charts.types.data[index] + '\n';
        });
        csv += '\n';
      }
      
      // Ajouter les taux de succès si disponibles
      if (exportData.charts.success) {
        csv += 'TAUX DE SUCCÈS (PAR JOUR)\n';
        csv += 'Jour,Succès,Échecs\n';
        exportData.charts.success.labels.forEach((label, index) => {
          csv += label + ',' + exportData.charts.success.success[index] + ',' + exportData.charts.success.failures[index] + '\n';
        });
      }
      
      // Télécharger le fichier
      downloadCSV(csv, 'dashboard_export_' + formatDateForFilename(new Date()) + '.csv');
      
      // Afficher une notification
      showNotification('Exportation des données du dashboard réussie', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données du dashboard:', error);
      showNotification('Erreur lors de l\'exportation des données: ' + error.message, 'danger');
    } finally {
      // Restaurer le bouton à son état normal
      const exportBtn = document.getElementById('dashboard-export-btn');
      if (exportBtn) {
        exportBtn.classList.remove('export-btn-loading');
        exportBtn.disabled = false;
      }
    }
  }
  
  // Exporter l'historique
  function exportHistory() {
    try {
      // Récupérer le bouton et ajouter l'animation de chargement
      const exportBtn = document.getElementById('history-export-btn');
      if (exportBtn) {
        exportBtn.classList.add('export-btn-loading');
        exportBtn.disabled = true;
      }
      
      // Afficher une notification de chargement
      showNotification('Exportation de l\'historique en cours...', 'info');
      
      // Appeler l'API d'exportation
      fetch('/api/sms/history/export')
        .then(response => {
          // Vérifier si la réponse est OK
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          
          // Vérifier le type de contenu
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            // Si la réponse est du JSON, c'est probablement une erreur
            return response.json().then(data => {
              throw new Error(data.message || 'Erreur lors de l\'exportation');
            });
          }
          
          // Récupérer le nom du fichier depuis les en-têtes si disponible
          let filename = 'historique_sms.csv';
          const disposition = response.headers.get('content-disposition');
          if (disposition && disposition.includes('filename=')) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches && matches[1]) {
              filename = matches[1].replace(/['"]/g, '');
            }
          } else {
            // Générer un nom de fichier avec la date actuelle
            filename = 'historique_sms_' + formatDateForFilename(new Date()) + '.csv';
          }
          
          // Récupérer le contenu CSV
          return response.text().then(csv => {
            // Télécharger le fichier
            downloadCSV(csv, filename);
            
            // Afficher une notification de succès
            showNotification('Exportation de l\'historique réussie', 'success');
          })
          .finally(() => {
            // Restaurer le bouton à son état normal
            resetExportButton('history-export-btn');
          });
        })
        .catch(error => {
          console.error('Erreur lors de l\'exportation de l\'historique:', error);
          showNotification('Erreur lors de l\'exportation: ' + error.message, 'danger');
          
          // Tentative de repli: exportation côté client
          fallbackHistoryExport();
          
          // Restaurer le bouton à son état normal
          resetExportButton('history-export-btn');
        });
    } catch (error) {
      console.error('Erreur lors de l\'exportation de l\'historique:', error);
      showNotification('Erreur lors de l\'exportation: ' + error.message, 'danger');
      
      // Tentative de repli
      fallbackHistoryExport();
      
      // Restaurer le bouton à son état normal
      resetExportButton('history-export-btn');
    }
  }
  
  // Exportation de l'historique en mode repli (côté client)
  function fallbackHistoryExport() {
    try {
      // Vérifier si le module d'historique est disponible
      if (!window.historyModule || !window.historyModule.getFullHistoryData) {
        showNotification('Impossible d\'exporter l\'historique: données non disponibles', 'danger');
        return;
      }
      
      // Récupérer les données d'historique
      const historyData = window.historyModule.getFullHistoryData();
      
      if (!historyData || !historyData.length) {
        showNotification('Aucune donnée d\'historique à exporter', 'warning');
        return;
      }
      
      // Convertir en CSV
      let csv = 'Date,Type,Destinataire,Contenu,Statut\n';
      
      // Ajouter chaque entrée
      historyData.forEach(entry => {
        const timestamp = entry.timestamp || entry.date || entry.createdAt || new Date().toISOString();
        const type = entry.type || (entry.message && entry.message.includes('code') ? 'Token' : 'SMS');
        const recipient = entry.to || entry.recipient || entry.phoneNumber || '';
        const content = entry.message || entry.body || entry.content || '';
        const status = entry.status || 'pending';
        
        // Échapper les virgules et les guillemets dans le contenu
        const escapedContent = content.replace(/"/g, '""');
        
        // Ajouter la ligne au CSV
        csv += `${formatDate(timestamp)},"${type}","${recipient}","${escapedContent}","${status}"\n`;
      });
      
      // Télécharger le fichier
      downloadCSV(csv, 'historique_sms_' + formatDateForFilename(new Date()) + '.csv');
      
      // Afficher une notification
      showNotification('Exportation de l\'historique réussie (mode local)', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'exportation locale de l\'historique:', error);
      showNotification('Erreur lors de l\'exportation locale: ' + error.message, 'danger');
    } finally {
      // Restaurer le bouton à son état normal
      resetExportButton('history-export-btn');
    }
  }
  
  // Fonction utilitaire pour télécharger un CSV
  function downloadCSV(csvContent, filename) {
    // Ajouter le BOM pour l'encodage UTF-8 correct dans Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    
    // Vérifier la prise en charge du téléchargement direct
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      // Pour Internet Explorer
      window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      // Pour les autres navigateurs
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }
  }
  
  // Fonction utilitaire pour formater une date pour un nom de fichier
  function formatDateForFilename(date) {
    return date.toISOString().slice(0, 10).replace(/-/g, '') + 
           '_' + 
           date.toTimeString().slice(0, 8).replace(/:/g, '');
  }
  
  // Fonction utilitaire pour formater une date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
  }
  
  // Fonction pour réinitialiser un bouton d'exportation
  function resetExportButton(buttonId) {
    const exportBtn = document.getElementById(buttonId);
    if (exportBtn) {
      exportBtn.classList.remove('export-btn-loading');
      exportBtn.disabled = false;
    }
  }
  
  // Fonction pour afficher une notification
  function showNotification(message, type = 'info') {
    // Vérifier si la fonction globale existe
    if (window.showNotification) {
      window.showNotification(message, type);
      return;
    }
    
    // Sinon, implémentation locale
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) {
      console.log(`Notification (${type}):`, message);
      return;
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}
      <button class="alert-dismiss"><i class="fas fa-times"></i></button>
    `;
    
    // Ajouter un bouton pour fermer l'alerte
    const dismissBtn = alert.querySelector('.alert-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function() {
        alert.remove();
      });
    }
    
    // Ajouter l'alerte au conteneur
    alertsContainer.appendChild(alert);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }
});
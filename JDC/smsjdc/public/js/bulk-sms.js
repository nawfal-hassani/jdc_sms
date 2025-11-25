// FRONTEND
/**
 * Module d'envoi groupé de SMS pour le Dashboard JDC
 * Gère l'upload de fichiers CSV/Excel et l'envoi en masse de SMS
 */

document.addEventListener('DOMContentLoaded', function() {
  // Éléments du DOM
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const downloadTemplate = document.getElementById('download-template');
  const cancelUpload = document.getElementById('cancel-upload');
  const startBulkSend = document.getElementById('start-bulk-send');
  const pauseBulkSend = document.getElementById('pause-bulk-send');
  const stopBulkSend = document.getElementById('stop-bulk-send');
  const newBulkSend = document.getElementById('new-bulk-send');
  const exportResults = document.getElementById('export-results');
  
  // Sections
  const uploadSection = document.querySelector('.upload-section');
  const previewSection = document.getElementById('preview-section');
  const progressSection = document.getElementById('progress-section');
  const resultsSection = document.getElementById('results-section');
  
  // Variables d'état
  let parsedData = [];
  let validData = [];
  let invalidData = [];
  let sendQueue = [];
  let currentIndex = 0;
  let isPaused = false;
  let isStopped = false;
  let startTime = null;
  let results = {
    success: 0,
    failed: 0,
    total: 0
  };
  
  // ==== Gestion du drag & drop ====
  
  if (uploadZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadZone.addEventListener(eventName, () => {
        uploadZone.classList.add('drag-over');
      }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, () => {
        uploadZone.classList.remove('drag-over');
      }, false);
    });
    
    uploadZone.addEventListener('drop', handleDrop, false);
    uploadZone.addEventListener('click', () => fileInput.click());
  }
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }
  
  // ==== Gestion de la sélection de fichier ====
  
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      handleFiles(e.target.files);
    });
  }
  
  async function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      showNotification('Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)', 'danger');
      return;
    }
    
    showNotification('Chargement du fichier...', 'info');
    
    try {
      let data;
      if (fileExtension === 'csv') {
        data = await parseCSV(file);
      } else {
        data = await parseExcel(file);
      }
      
      processData(data, file.name);
    } catch (error) {
      console.error('Erreur lors du parsing du fichier:', error);
      showNotification('Erreur lors de la lecture du fichier: ' + error.message, 'danger');
    }
  }
  
  // ==== Parsing CSV ====
  
  function parseCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('Le fichier CSV est vide ou ne contient pas de données'));
            return;
          }
          
          // Parser les en-têtes
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          // Parser les données
          const data = [];
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;
            
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] ? values[index].trim() : '';
            });
            data.push(row);
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  }
  
  // Parser une ligne CSV en tenant compte des guillemets
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
  
  // ==== Parsing Excel ====
  
  function parseExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Prendre la première feuille
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          // Normaliser les clés en minuscules
          const normalizedData = jsonData.map(row => {
            const normalized = {};
            Object.keys(row).forEach(key => {
              normalized[key.toLowerCase().trim()] = row[key];
            });
            return normalized;
          });
          
          resolve(normalizedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  // ==== Traitement et validation des données ====
  
  function processData(data, filename) {
    parsedData = data;
    validData = [];
    invalidData = [];
    
    // Valider chaque entrée
    data.forEach((row, index) => {
      const validation = validateRow(row, index + 1);
      if (validation.valid) {
        validData.push(validation.data);
      } else {
        invalidData.push(validation.data);
      }
    });
    
    // Afficher les statistiques
    document.getElementById('file-name').textContent = filename;
    document.getElementById('valid-count').textContent = validData.length;
    document.getElementById('invalid-count').textContent = invalidData.length;
    document.getElementById('total-count').textContent = data.length;
    document.getElementById('send-count').textContent = validData.length;
    
    // Activer/désactiver le bouton d'envoi
    if (startBulkSend) {
      startBulkSend.disabled = validData.length === 0;
    }
    
    // Afficher la prévisualisation
    displayPreview();
    
    // Masquer la section d'upload et afficher la prévisualisation
    if (uploadSection) uploadSection.style.display = 'none';
    if (previewSection) previewSection.style.display = 'block';
    
    showNotification(`Fichier chargé: ${validData.length} entrée(s) valide(s), ${invalidData.length} invalide(s)`, 'success');
  }
  
  function validateRow(row, lineNumber) {
    const errors = [];
    
    // Trouver le numéro de téléphone
    const phone = row.phone || row.telephone || row.tel || row.numero || row.number || '';
    
    // Trouver le message
    const message = row.message || row.texte || row.text || row.sms || row.contenu || '';
    
    // Trouver le nom (optionnel)
    const name = row.name || row.nom || row.prenom || row.firstname || '';
    
    // Validation du téléphone
    if (!phone) {
      errors.push('Numéro de téléphone manquant');
    } else {
      const cleanPhone = phone.toString().replace(/\s+/g, '');
      if (!/^\+?[1-9]\d{1,14}$/.test(cleanPhone)) {
        errors.push('Numéro de téléphone invalide');
      }
    }
    
    // Validation du message
    if (!message) {
      errors.push('Message manquant');
    } else if (message.length > 160) {
      errors.push('Message trop long (max 160 caractères)');
    }
    
    return {
      valid: errors.length === 0,
      data: {
        lineNumber,
        phone: phone.toString(),
        message: message.toString(),
        name: name.toString(),
        errors: errors.join(', '),
        status: errors.length === 0 ? 'valid' : 'invalid'
      }
    };
  }
  
  function displayPreview() {
    const tbody = document.getElementById('preview-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Afficher toutes les données (valides et invalides)
    const allData = [...validData, ...invalidData];
    
    allData.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = item.status === 'valid' ? 'row-valid' : 'row-invalid';
      
      tr.innerHTML = `
        <td>
          <i class="fas ${item.status === 'valid' ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'} status-icon"></i>
        </td>
        <td>${item.name || '-'}</td>
        <td>${item.phone}</td>
        <td>${item.message.substring(0, 50)}${item.message.length > 50 ? '...' : ''}</td>
        <td class="error-message">${item.errors || '-'}</td>
      `;
      
      tbody.appendChild(tr);
    });
  }
  
  // ==== Téléchargement du template ====
  
  if (downloadTemplate) {
    downloadTemplate.addEventListener('click', function(e) {
      e.preventDefault();
      
      const csvContent = 'phone,message,name\n+33612345678,"Bonjour, ceci est un test",Jean Dupont\n+33698765432,"Deuxième message de test",Marie Martin';
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'template_envoi_groupe.csv');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('Modèle CSV téléchargé', 'success');
    });
  }
  
  // ==== Annulation de l'upload ====
  
  if (cancelUpload) {
    cancelUpload.addEventListener('click', resetUpload);
  }
  
  function resetUpload() {
    parsedData = [];
    validData = [];
    invalidData = [];
    
    if (fileInput) fileInput.value = '';
    if (uploadSection) uploadSection.style.display = 'grid';
    if (previewSection) previewSection.style.display = 'none';
    if (progressSection) progressSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';
  }
  
  // ==== Démarrage de l'envoi groupé ====
  
  if (startBulkSend) {
    startBulkSend.addEventListener('click', startBulkSending);
  }
  
  async function startBulkSending() {
    const skipInvalid = document.getElementById('skip-invalid').checked;
    
    if (!skipInvalid && invalidData.length > 0) {
      const confirmed = confirm(`${invalidData.length} entrée(s) invalide(s) détectée(s). Voulez-vous continuer en les ignorant?`);
      if (!confirmed) return;
    }
    
    // Préparer la file d'envoi
    sendQueue = [...validData];
    currentIndex = 0;
    isPaused = false;
    isStopped = false;
    startTime = new Date();
    results = {
      success: 0,
      failed: 0,
      total: sendQueue.length
    };
    
    // Masquer la prévisualisation et afficher la progression
    if (previewSection) previewSection.style.display = 'none';
    if (progressSection) progressSection.style.display = 'block';
    
    // Initialiser l'affichage de la progression
    updateProgressDisplay();
    
    // Démarrer l'envoi
    processSendQueue();
  }
  
  async function processSendQueue() {
    if (isStopped) {
      finishBulkSending();
      return;
    }
    
    if (isPaused) {
      setTimeout(processSendQueue, 1000);
      return;
    }
    
    if (currentIndex >= sendQueue.length) {
      finishBulkSending();
      return;
    }
    
    const item = sendQueue[currentIndex];
    const delay = parseInt(document.getElementById('batch-delay').value) || 1000;
    
    try {
      addLog(`Envoi vers ${item.phone}...`, 'info');
      
      // 🔑 Récupérer le token d'authentification
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        addLog('✗ Erreur: Token d\'authentification non trouvé. Veuillez vous reconnecter.', 'error');
        stopSending();
        return;
      }
      
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: item.phone,
          message: item.message
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        results.success++;
        addLog(`✓ SMS envoyé avec succès vers ${item.phone}`, 'success');
      } else {
        results.failed++;
        addLog(`✗ Échec de l'envoi vers ${item.phone}: ${data.message || data.error}`, 'error');
      }
    } catch (error) {
      results.failed++;
      addLog(`✗ Erreur lors de l'envoi vers ${item.phone}: ${error.message}`, 'error');
    }
    
    currentIndex++;
    updateProgressDisplay();
    
    // Attendre avant le prochain envoi
    setTimeout(processSendQueue, delay);
  }
  
  function updateProgressDisplay() {
    const percent = Math.round((currentIndex / results.total) * 100);
    
    document.getElementById('progress-bar-fill').style.width = percent + '%';
    document.getElementById('progress-current').textContent = currentIndex;
    document.getElementById('progress-total').textContent = results.total;
    document.getElementById('progress-percent').textContent = percent;
    document.getElementById('sent-success').textContent = results.success;
    document.getElementById('sent-failed').textContent = results.failed;
    
    // Calcul du temps écoulé et restant
    if (startTime) {
      const elapsed = Math.floor((new Date() - startTime) / 1000);
      document.getElementById('time-elapsed').textContent = formatTime(elapsed);
      
      if (currentIndex > 0) {
        const avgTime = elapsed / currentIndex;
        const remaining = Math.floor(avgTime * (results.total - currentIndex));
        document.getElementById('time-remaining').textContent = formatTime(remaining);
      }
    }
  }
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  function addLog(message, type = 'info') {
    const logContent = document.getElementById('progress-log-content');
    if (!logContent) return;
    
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${message}`;
    
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
  }
  
  // ==== Pause/Reprise ====
  
  if (pauseBulkSend) {
    pauseBulkSend.addEventListener('click', function() {
      isPaused = !isPaused;
      
      if (isPaused) {
        this.innerHTML = '<i class="fas fa-play"></i> Reprendre';
        this.classList.remove('btn-warning');
        this.classList.add('btn-success');
        addLog('Envoi en pause', 'info');
      } else {
        this.innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.classList.remove('btn-success');
        this.classList.add('btn-warning');
        addLog('Envoi repris', 'info');
      }
    });
  }
  
  // ==== Arrêt ====
  
  if (stopBulkSend) {
    stopBulkSend.addEventListener('click', function() {
      const confirmed = confirm('Êtes-vous sûr de vouloir arrêter l\'envoi en cours?');
      if (confirmed) {
        isStopped = true;
        addLog('Envoi arrêté par l\'utilisateur', 'error');
      }
    });
  }
  
  // ==== Fin de l'envoi ====
  
  function finishBulkSending() {
    const duration = Math.floor((new Date() - startTime) / 1000);
    
    // Masquer la progression et afficher les résultats
    if (progressSection) progressSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'block';
    
    // Afficher les statistiques finales
    document.getElementById('result-success').textContent = results.success;
    document.getElementById('result-failed').textContent = results.failed;
    document.getElementById('result-duration').textContent = formatTime(duration);
    
    showNotification(`Envoi groupé terminé: ${results.success} réussi(s), ${results.failed} échec(s)`, 'success');
  }
  
  // ==== Nouvel envoi ====
  
  if (newBulkSend) {
    newBulkSend.addEventListener('click', resetUpload);
  }
  
  // ==== Export des résultats ====
  
  if (exportResults) {
    exportResults.addEventListener('click', function() {
      const csvContent = generateResultsCSV();
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('href', url);
      link.setAttribute('download', `rapport_envoi_groupe_${timestamp}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('Rapport exporté avec succès', 'success');
    });
  }
  
  function generateResultsCSV() {
    let csv = 'Ligne,Téléphone,Message,Nom,Statut\n';
    
    sendQueue.forEach((item, index) => {
      const status = index < currentIndex ? 
        (results.success > 0 && results.failed === 0 ? 'Envoyé' : 
         results.failed > 0 && results.success === 0 ? 'Échec' : 
         'Envoyé/Échec') : 
        'Non envoyé';
      
      csv += `${item.lineNumber},"${item.phone}","${item.message}","${item.name}","${status}"\n`;
    });
    
    return csv;
  }
  
  // Fonction pour afficher une notification
  function showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
});

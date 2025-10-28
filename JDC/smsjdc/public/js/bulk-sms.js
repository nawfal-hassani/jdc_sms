/**
 * Module d'envoi groupé de SMS pour le Dashboard JDC avec WebSocket
 * Gère l'upload de fichiers CSV/Excel et l'envoi en masse de SMS avec suivi en temps réel
 */

document.addEventListener('DOMContentLoaded', function() {
  // Connexion Socket.IO
  const socket = io();
  let currentJobId = null;
  
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
  let startTime = null;
  let results = {
    success: 0,
    failed: 0,
    total: 0
  };
  
  // ==== Gestion Socket.IO ====
  
  socket.on('connect', () => {
    console.log('✅ Connecté au serveur WebSocket');
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Déconnecté du serveur WebSocket');
  });
  
  socket.on('bulk-sms-update', (data) => {
    handleBulkSmsUpdate(data);
  });
  
  socket.on('bulk-sms-error', (data) => {
    console.error('Erreur WebSocket:', data);
    showNotification(`Erreur: ${data.error}`, 'danger');
  });
  
  function handleBulkSmsUpdate(data) {
    console.log('📨 Mise à jour reçue:', data.type, data);
    
    switch (data.type) {
      case 'started':
        showNotification(data.message, 'info');
        updateProgressDisplay(data.job);
        break;
        
      case 'processing':
        addLog(data.message, 'info');
        break;
        
      case 'success':
        results.success++;
        addLog(data.message, 'success');
        updateProgressDisplay(data.job);
        break;
        
      case 'error':
        results.failed++;
        addLog(data.message, 'error');
        updateProgressDisplay(data.job);
        break;
        
      case 'paused':
        showNotification(data.message, 'warning');
        if (pauseBulkSend) {
          pauseBulkSend.innerHTML = '<i class="fas fa-play"></i> Reprendre';
          pauseBulkSend.classList.remove('btn-warning');
          pauseBulkSend.classList.add('btn-success');
        }
        break;
        
      case 'resumed':
        showNotification(data.message, 'info');
        if (pauseBulkSend) {
          pauseBulkSend.innerHTML = '<i class="fas fa-pause"></i> Pause';
          pauseBulkSend.classList.remove('btn-success');
          pauseBulkSend.classList.add('btn-warning');
        }
        break;
        
      case 'stopped':
        showNotification(data.message, 'warning');
        finishBulkSending(data.job);
        break;
        
      case 'completed':
        showNotification(data.message, 'success');
        finishBulkSending(data.job);
        break;
    }
  }
  
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
          
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
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
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
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
    
    data.forEach((row, index) => {
      const validation = validateRow(row, index + 1);
      if (validation.valid) {
        validData.push(validation.data);
      } else {
        invalidData.push(validation.data);
      }
    });
    
    document.getElementById('file-name').textContent = filename;
    document.getElementById('valid-count').textContent = validData.length;
    document.getElementById('invalid-count').textContent = invalidData.length;
    document.getElementById('total-count').textContent = data.length;
    document.getElementById('send-count').textContent = validData.length;
    
    if (startBulkSend) {
      startBulkSend.disabled = validData.length === 0;
    }
    
    displayPreview();
    
    if (uploadSection) uploadSection.style.display = 'none';
    if (previewSection) previewSection.style.display = 'block';
    
    showNotification(`Fichier chargé: ${validData.length} entrée(s) valide(s), ${invalidData.length} invalide(s)`, 'success');
  }
  
  function validateRow(row, lineNumber) {
    const errors = [];
    const phone = row.phone || row.telephone || row.tel || row.numero || row.number || '';
    const message = row.message || row.texte || row.text || row.sms || row.contenu || '';
    const name = row.name || row.nom || row.prenom || row.firstname || '';
    
    if (!phone) {
      errors.push('Numéro de téléphone manquant');
    } else {
      const cleanPhone = phone.toString().replace(/\s+/g, '');
      if (!/^\+?[1-9]\d{1,14}$/.test(cleanPhone)) {
        errors.push('Numéro de téléphone invalide');
      }
    }
    
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
    console.log('✅ Bouton download-template trouvé');
    downloadTemplate.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('📥 Téléchargement du modèle CSV...');
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
  } else {
    console.error('❌ Bouton download-template NON trouvé');
  }
  
  // ==== Annulation de l'upload ====
  
  if (cancelUpload) {
    cancelUpload.addEventListener('click', resetUpload);
  }
  
  function resetUpload() {
    // Quitter le job actuel si présent
    if (currentJobId) {
      socket.emit('leave-job', currentJobId);
      currentJobId = null;
    }
    
    parsedData = [];
    validData = [];
    invalidData = [];
    results = { success: 0, failed: 0, total: 0 };
    
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
    
    const delay = parseInt(document.getElementById('batch-delay').value) || 1000;
    
    try {
      // Créer le job sur le serveur
      const response = await fetch('/api/bulk-sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: validData,
          delay: delay
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        showNotification('Erreur lors de la création du job: ' + data.message, 'danger');
        return;
      }
      
      // Stocker le jobId et rejoindre la room
      currentJobId = data.jobId;
      socket.emit('join-job', currentJobId);
      
      // Initialiser les résultats
      results = {
        success: 0,
        failed: 0,
        total: validData.length
      };
      
      startTime = new Date();
      
      // Masquer la prévisualisation et afficher la progression
      if (previewSection) previewSection.style.display = 'none';
      if (progressSection) progressSection.style.display = 'block';
      
      // Réinitialiser l'affichage
      updateProgressDisplay({
        processed: 0,
        success: 0,
        failed: 0,
        total: validData.length,
        progress: 0
      });
      
      // Réinitialiser les logs
      const logContent = document.getElementById('progress-log-content');
      if (logContent) logContent.innerHTML = '';
      
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'envoi:', error);
      showNotification('Erreur lors du démarrage de l\'envoi: ' + error.message, 'danger');
    }
  }
  
  function updateProgressDisplay(job) {
    const percent = job.progress || 0;
    
    document.getElementById('progress-bar-fill').style.width = percent + '%';
    document.getElementById('progress-current').textContent = job.processed || 0;
    document.getElementById('progress-total').textContent = job.total || 0;
    document.getElementById('progress-percent').textContent = percent;
    document.getElementById('sent-success').textContent = job.success || 0;
    document.getElementById('sent-failed').textContent = job.failed || 0;
    
    if (job.duration !== undefined) {
      document.getElementById('time-elapsed').textContent = formatTime(job.duration);
    }
    
    if (job.remaining !== undefined) {
      document.getElementById('time-remaining').textContent = formatTime(job.remaining);
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
      if (!currentJobId) return;
      
      const isPaused = this.innerHTML.includes('fa-play');
      
      if (isPaused) {
        socket.emit('resume-job', currentJobId);
      } else {
        socket.emit('pause-job', currentJobId);
      }
    });
  }
  
  // ==== Arrêt ====
  
  if (stopBulkSend) {
    stopBulkSend.addEventListener('click', function() {
      if (!currentJobId) return;
      
      const confirmed = confirm('Êtes-vous sûr de vouloir arrêter l\'envoi en cours?');
      if (confirmed) {
        socket.emit('stop-job', currentJobId);
      }
    });
  }
  
  // ==== Fin de l'envoi ====
  
  function finishBulkSending(job) {
    const duration = job.duration || 0;
    
    // Masquer la progression et afficher les résultats
    if (progressSection) progressSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'block';
    
    // Afficher les statistiques finales
    document.getElementById('result-success').textContent = job.success || 0;
    document.getElementById('result-failed').textContent = job.failed || 0;
    document.getElementById('result-duration').textContent = formatTime(duration);
    
    // Quitter le job
    if (currentJobId) {
      socket.emit('leave-job', currentJobId);
    }
  }
  
  // ==== Nouvel envoi ====
  
  if (newBulkSend) {
    newBulkSend.addEventListener('click', resetUpload);
  }
  
  // ==== Export des résultats ====
  
  if (exportResults) {
    exportResults.addEventListener('click', function() {
      if (!currentJobId) return;
      
      // Demander les résultats au serveur
      socket.emit('get-job-results', currentJobId);
      
      // Écouter la réponse
      socket.once('job-results', (data) => {
        const csvContent = generateResultsCSV(data.results);
        
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
    });
  }
  
  function generateResultsCSV(jobResults) {
    if (!jobResults || !jobResults.results) return '';
    
    let csv = 'Date,Téléphone,Message,Nom,Statut,Erreur\n';
    
    jobResults.results.forEach(item => {
      const date = item.timestamp ? new Date(item.timestamp).toLocaleString('fr-FR') : '';
      const status = item.status === 'success' ? 'Envoyé' : 'Échec';
      const error = item.error || '';
      
      csv += `"${date}","${item.phone}","${item.message}","${item.name || ''}","${status}","${error}"\n`;
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

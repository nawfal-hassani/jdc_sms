/**
 * Version simplifiée du module d'envoi groupé
 */

console.log('🚀 bulk-sms-simple.js chargé');

// Attendre que le DOM soit chargé
window.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DOM chargé, initialisation...');
  
  const uploadBtn = document.getElementById('upload-btn');
  const fileInput = document.getElementById('file-input');
  const cancelUpload = document.getElementById('cancel-upload');
  
  console.log('Bouton upload:', uploadBtn ? 'trouvé' : 'NON trouvé');
  console.log('Input fichier:', fileInput ? 'trouvé' : 'NON trouvé');
  console.log('Bouton annuler:', cancelUpload ? 'trouvé' : 'NON trouvé');
  
  // Gérer le bouton annuler
  if (cancelUpload) {
    cancelUpload.addEventListener('click', function() {
      console.log('🔙 Annulation');
      resetUpload();
    });
  }
  
  function resetUpload() {
    // Réinitialiser le formulaire
    if (fileInput) fileInput.value = '';
    
    // Masquer les sections
    const uploadSection = document.querySelector('.upload-section');
    const previewSection = document.getElementById('preview-section');
    const progressSection = document.getElementById('progress-section');
    const resultsSection = document.getElementById('results-section');
    
    if (uploadSection) uploadSection.style.display = 'grid';
    if (previewSection) previewSection.style.display = 'none';
    if (progressSection) progressSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';
  }
  
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', async function() {
      console.log('📤 Clic sur le bouton upload');
      
      const file = fileInput.files[0];
      
      if (!file) {
        alert('Veuillez choisir un fichier');
        return;
      }
      
      console.log('📁 Fichier sélectionné:', file.name);
      
      // Créer le FormData
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        // Afficher un message de chargement
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Upload en cours...';
        
        console.log('🌐 Envoi vers /api/bulk-sms/upload...');
        
        // Envoyer le fichier
        const response = await fetch('/api/bulk-sms/upload', {
          method: 'POST',
          body: formData
        });
        
        console.log('📡 Réponse reçue, status:', response.status);
        
        const result = await response.json();
        console.log('✅ Résultat:', result);
        console.log('📊 Stats:', result.stats);
        console.log('📋 Données:', result.data);
        
        if (result.success) {
          const validCount = result.stats.valid;
          const invalidCount = result.stats.invalid;
          const totalCount = result.stats.total;
          
          console.log(`✅ Valid: ${validCount}, ❌ Invalid: ${invalidCount}, 📊 Total: ${totalCount}`);
          
          if (validCount === 0) {
            alert(`Fichier analysé mais aucun SMS valide trouvé!\n\nTotal: ${totalCount}\nValides: ${validCount}\nInvalides: ${invalidCount}\n\nVérifiez le format de votre fichier.`);
            
            // Afficher quand même les données pour debug
            if (result.data && result.data.length > 0) {
              console.log('❌ Erreurs trouvées:');
              result.data.forEach(item => {
                if (!item.valid) {
                  console.log(`Ligne ${item.lineNumber}: ${item.errors.join(', ')}`);
                }
              });
            }
          } else {
            alert(`Fichier analysé avec succès!\n\nTotal: ${totalCount}\nValides: ${validCount}\nInvalides: ${invalidCount}`);
            
            // Afficher le résultat
            displayResults(result.data);
          }
        } else {
          alert('Erreur: ' + result.message);
        }
        
      } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur lors de l\'upload: ' + error.message);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Uploader et analyser le fichier';
      }
    });
  }
  
  function displayResults(data) {
    console.log('📺 Affichage des résultats, nombre de lignes:', data.length);
    
    const previewSection = document.getElementById('preview-section');
    if (!previewSection) {
      console.error('❌ preview-section non trouvé');
      return;
    }
    
    // Afficher la section de prévisualisation
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) uploadSection.style.display = 'none';
    previewSection.style.display = 'block';
    
    console.log('✅ Sections affichées/masquées');
    
    // Remplir le tableau
    const tbody = document.querySelector('#preview-table tbody');
    if (!tbody) {
      console.error('❌ Tableau preview-table tbody non trouvé');
      return;
    }
    
    console.log('📋 Remplissage du tableau...');
    tbody.innerHTML = '';
    
    data.forEach((item, index) => {
      console.log(`Ligne ${index + 1}:`, item);
      const row = tbody.insertRow();
      row.className = item.valid ? 'valid' : 'invalid';
      
      row.innerHTML = `
        <td>${item.lineNumber}</td>
        <td>${item.phone}</td>
        <td>${item.message.substring(0, 50)}${item.message.length > 50 ? '...' : ''}</td>
        <td>${item.name || '-'}</td>
        <td>${item.valid ? '<span class="badge success">✓ Valide</span>' : '<span class="badge error">✗ Invalide</span>'}</td>
        <td>${item.errors.join(', ') || '-'}</td>
      `;
    });
    
    // Mettre à jour les statistiques
    document.getElementById('preview-total').textContent = data.length;
    document.getElementById('preview-valid').textContent = data.filter(d => d.valid).length;
    document.getElementById('preview-invalid').textContent = data.filter(d => !d.valid).length;
    
    // Configurer le bouton d'envoi
    const startBtn = document.getElementById('start-bulk-send');
    if (startBtn) {
      startBtn.onclick = function() {
        startBulkSending(data.filter(d => d.valid));
      };
    }
  }
  
  async function startBulkSending(validData) {
    if (!confirm(`Voulez-vous envoyer ${validData.length} SMS ?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/bulk-sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: validData,
          delay: 2000
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Job d'envoi créé avec succès!\nJob ID: ${result.jobId}\n\nL'envoi va démarrer. Consultez les logs pour suivre la progression.`);
        
        // Afficher la section de progression
        document.getElementById('preview-section').style.display = 'none';
        document.getElementById('progress-section').style.display = 'block';
      } else {
        alert('Erreur: ' + result.message);
      }
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du démarrage de l\'envoi: ' + error.message);
    }
  }
});

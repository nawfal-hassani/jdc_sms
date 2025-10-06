/**
 * Système de filtrage pour l'historique des SMS
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialiser le système de filtrage
  initFilterSystem();
  
  // Écouter l'événement history-loaded pour appliquer les filtres après le chargement
  document.addEventListener('history-loaded', function() {
    // Appliquer les filtres si nécessaire
    const filterPanel = document.getElementById('filter-panel');
    if (filterPanel && filterPanel.style.display !== 'none') {
      // Simuler un clic sur le bouton "Appliquer"
      const applyFiltersBtn = document.getElementById('apply-filters');
      if (applyFiltersBtn) {
        applyFiltersBtn.click();
      }
    }
  });
  
  function initFilterSystem() {
    // Références aux éléments DOM
    const filterButton = document.getElementById('filter-button');
    const filterPanel = document.getElementById('filter-panel');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    
    // Références aux champs de filtrage
    const filterType = document.getElementById('filter-type');
    const filterStatus = document.getElementById('filter-status');
    const filterPhone = document.getElementById('filter-phone');
    const filterContent = document.getElementById('filter-content');
    
    if (!filterButton || !filterPanel) {
      console.error('Éléments de filtrage non trouvés dans le DOM');
      return;
    }
    
    // Filtres actifs
    let activeFilters = {
      type: '',
      status: '',
      phone: '',
      content: ''
    };
    
    // Basculer la visibilité du panneau de filtres
    filterButton.addEventListener('click', function() {
      const isVisible = filterPanel.style.display !== 'none';
      filterPanel.style.display = isVisible ? 'none' : 'block';
      
      // Mettre à jour l'icône du bouton
      filterButton.innerHTML = isVisible 
        ? '<i class="fas fa-filter"></i> Filtrer' 
        : '<i class="fas fa-times"></i> Masquer les filtres';
    });
    
    // Appliquer les filtres
    applyFiltersBtn.addEventListener('click', function() {
      // Récupérer les valeurs des filtres
      activeFilters = {
        type: filterType ? filterType.value : '',
        status: filterStatus ? filterStatus.value : '',
        phone: filterPhone ? filterPhone.value.toLowerCase() : '',
        content: filterContent ? filterContent.value.toLowerCase() : ''
      };
      
      // Appliquer les filtres
      applyFilters();
      
      // Mettre à jour l'apparence du bouton de filtre
      updateFilterButtonAppearance();
    });
    
    // Réinitialiser les filtres
    resetFiltersBtn.addEventListener('click', function() {
      // Réinitialiser les valeurs des champs
      if (filterType) filterType.value = '';
      if (filterStatus) filterStatus.value = '';
      if (filterPhone) filterPhone.value = '';
      if (filterContent) filterContent.value = '';
      
      // Réinitialiser les filtres actifs
      activeFilters = {
        type: '',
        status: '',
        phone: '',
        content: ''
      };
      
      // Appliquer les filtres réinitialisés
      applyFilters();
      
      // Mettre à jour l'apparence du bouton de filtre
      updateFilterButtonAppearance();
    });
    
    // Fonction pour appliquer les filtres
    function applyFilters() {
      // Récupérer toutes les lignes de l'historique
      const historyTable = document.getElementById('history-table');
      if (!historyTable) return;
      
      const rows = historyTable.querySelectorAll('tbody tr');
      if (!rows.length) return;
      
      // Vérifier si au moins un filtre est actif
      const hasActiveFilters = Object.values(activeFilters).some(value => value !== '');
      
      // Parcourir chaque ligne et appliquer les filtres
      rows.forEach(row => {
        // Si la ligne est un message d'information (pas de données), l'afficher uniquement s'il n'y a pas de filtres
        if (row.cells.length === 1 && row.cells[0].colSpan > 1) {
          row.style.display = hasActiveFilters ? 'none' : '';
          return;
        }
        
        // Récupérer les valeurs des cellules
        const type = row.cells[1]?.textContent || '';
        const phone = row.cells[2]?.textContent || '';
        const content = row.cells[3]?.textContent || '';
        const status = row.cells[4]?.textContent || '';
        
        // Appliquer les filtres
        let showRow = true;
        
        // Filtre par type
        if (activeFilters.type && type.toLowerCase() !== activeFilters.type.toLowerCase()) {
          showRow = false;
        }
        
        // Filtre par statut
        if (activeFilters.status && !status.toLowerCase().includes(activeFilters.status.toLowerCase())) {
          showRow = false;
        }
        
        // Filtre par numéro de téléphone
        if (activeFilters.phone && !phone.toLowerCase().includes(activeFilters.phone.toLowerCase())) {
          showRow = false;
        }
        
        // Filtre par contenu
        if (activeFilters.content && !content.toLowerCase().includes(activeFilters.content.toLowerCase())) {
          showRow = false;
        }
        
        // Afficher ou masquer la ligne
        row.style.display = showRow ? '' : 'none';
      });
      
      // Vérifier si toutes les lignes sont masquées
      let allHidden = true;
      rows.forEach(row => {
        if (row.style.display !== 'none' && row.cells.length > 1) {
          allHidden = false;
        }
      });
      
      // Si toutes les lignes sont masquées, afficher un message
      if (allHidden && hasActiveFilters) {
        // Vérifier si le message existe déjà
        let noResultsRow = historyTable.querySelector('tbody tr.no-results');
        
        if (!noResultsRow) {
          noResultsRow = document.createElement('tr');
          noResultsRow.className = 'no-results';
          noResultsRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 20px;">
              <i class="fas fa-search"></i> Aucun résultat ne correspond à vos critères de recherche.
            </td>
          `;
          historyTable.querySelector('tbody').appendChild(noResultsRow);
        } else {
          noResultsRow.style.display = '';
        }
      } else {
        // Masquer le message s'il existe
        const noResultsRow = historyTable.querySelector('tbody tr.no-results');
        if (noResultsRow) {
          noResultsRow.style.display = 'none';
        }
      }
      
      // Mettre à jour le nombre d'éléments filtrés dans le titre de la carte
      updateFilteredCount();
    }
    
    // Fonction pour mettre à jour le nombre d'éléments filtrés dans le titre
    function updateFilteredCount() {
      const historyTable = document.getElementById('history-table');
      if (!historyTable) return;
      
      // Compter les lignes visibles (qui ne sont pas des messages d'information)
      const rows = historyTable.querySelectorAll('tbody tr');
      let visibleCount = 0;
      let totalCount = 0;
      
      rows.forEach(row => {
        // Ignorer les lignes de message (qui ont colspan)
        if (row.cells.length === 1 && row.cells[0].colSpan > 1) return;
        
        totalCount++;
        if (row.style.display !== 'none') {
          visibleCount++;
        }
      });
      
      // Mettre à jour le titre de la carte avec le nombre d'éléments filtrés
      const cardTitle = document.querySelector('#history-tab .card-title');
      if (cardTitle) {
        if (visibleCount < totalCount) {
          cardTitle.textContent = `Historique des envois (${visibleCount}/${totalCount})`;
        } else {
          cardTitle.textContent = 'Historique des envois';
        }
      }
    }
    
    // Fonction pour mettre à jour l'apparence du bouton de filtre
    function updateFilterButtonAppearance() {
      // Vérifier si au moins un filtre est actif
      const hasActiveFilters = Object.values(activeFilters).some(value => value !== '');
      
      // Mettre à jour l'apparence du bouton de filtre
      if (hasActiveFilters) {
        filterButton.innerHTML = '<i class="fas fa-filter"></i> Filtres actifs';
        filterButton.classList.add('active');
      } else {
        filterButton.innerHTML = '<i class="fas fa-filter"></i> Filtrer';
        filterButton.classList.remove('active');
      }
    }
    
    // Initialiser l'état initial
    updateFilterButtonAppearance();
  }
});
// FRONTEND
/**
 * Système de filtrage pour l'historique des SMS
 * Permet de filtrer les données par type, statut, numéro et contenu
 * Affiche les filtres actifs sous forme de badges pour une meilleure UX
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
        // Afficher les badges de filtres actifs
        displayActiveFilters();
      } else {
        filterButton.innerHTML = '<i class="fas fa-filter"></i> Filtrer';
        filterButton.classList.remove('active');
        // Supprimer les badges de filtres actifs
        removeActiveFilters();
      }
    }
    
    // Fonction pour afficher les badges de filtres actifs
    function displayActiveFilters() {
      // Supprimer les badges existants
      removeActiveFilters();
      
      // Créer un conteneur pour les badges s'il n'existe pas déjà
      let filterBadgesContainer = document.getElementById('active-filters-container');
      if (!filterBadgesContainer) {
        filterBadgesContainer = document.createElement('div');
        filterBadgesContainer.id = 'active-filters-container';
        filterBadgesContainer.className = 'active-filters-container';
        filterBadgesContainer.style.margin = '10px 0';
        filterBadgesContainer.style.display = 'flex';
        filterBadgesContainer.style.flexWrap = 'wrap';
        filterBadgesContainer.style.gap = '5px';
        
        // Insérer le conteneur avant le tableau d'historique
        const historyTable = document.getElementById('history-table');
        if (historyTable) {
          historyTable.parentNode.insertBefore(filterBadgesContainer, historyTable);
        }
      }
      
      // Ajouter un label pour les filtres actifs
      const filterLabel = document.createElement('span');
      filterLabel.textContent = 'Filtres actifs: ';
      filterLabel.style.marginRight = '10px';
      filterLabel.style.alignSelf = 'center';
      filterBadgesContainer.appendChild(filterLabel);
      
      // Créer un badge pour chaque filtre actif
      let filterCount = 0;
      
      // Badge pour le type
      if (activeFilters.type) {
        createFilterBadge('Type: ' + activeFilters.type, 'type', filterBadgesContainer);
        filterCount++;
      }
      
      // Badge pour le statut
      if (activeFilters.status) {
        let statusLabel;
        switch(activeFilters.status.toLowerCase()) {
          case 'delivered': statusLabel = 'Délivré'; break;
          case 'failed': statusLabel = 'Échoué'; break;
          case 'pending': statusLabel = 'En attente'; break;
          default: statusLabel = activeFilters.status;
        }
        createFilterBadge('Statut: ' + statusLabel, 'status', filterBadgesContainer);
        filterCount++;
      }
      
      // Badge pour le numéro de téléphone
      if (activeFilters.phone) {
        createFilterBadge('Tél: ' + activeFilters.phone, 'phone', filterBadgesContainer);
        filterCount++;
      }
      
      // Badge pour le contenu
      if (activeFilters.content) {
        createFilterBadge('Contenu: ' + activeFilters.content, 'content', filterBadgesContainer);
        filterCount++;
      }
      
      // Si aucun filtre actif, masquer le conteneur
      if (filterCount === 0) {
        filterBadgesContainer.style.display = 'none';
      } else {
        filterBadgesContainer.style.display = 'flex';
        
        // Ajouter un bouton "Réinitialiser tous les filtres"
        const resetAllButton = document.createElement('button');
        resetAllButton.className = 'filter-badge reset-all';
        resetAllButton.innerHTML = '<i class="fas fa-times"></i> Tout réinitialiser';
        resetAllButton.style.marginLeft = 'auto';
        resetAllButton.addEventListener('click', function() {
          // Simuler un clic sur le bouton de réinitialisation
          document.getElementById('reset-filters').click();
        });
        filterBadgesContainer.appendChild(resetAllButton);
      }
    }
    
    // Fonction pour créer un badge de filtre avec bouton de suppression
    function createFilterBadge(text, filterKey, container) {
      const badge = document.createElement('div');
      badge.className = 'filter-badge';
      badge.dataset.filterKey = filterKey;
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
      badge.style.padding = '3px 8px';
      badge.style.borderRadius = '15px';
      badge.style.fontSize = '0.9em';
      badge.innerHTML = `
        ${text} 
        <button class="filter-badge-remove" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0 0 0 5px;">
          <i class="fas fa-times-circle"></i>
        </button>
      `;
      
      // Ajouter l'événement pour supprimer ce filtre spécifique
      badge.querySelector('.filter-badge-remove').addEventListener('click', function() {
        // Réinitialiser ce filtre spécifique
        if (filterKey === 'type') document.getElementById('filter-type').value = '';
        if (filterKey === 'status') document.getElementById('filter-status').value = '';
        if (filterKey === 'phone') document.getElementById('filter-phone').value = '';
        if (filterKey === 'content') document.getElementById('filter-content').value = '';
        
        // Mettre à jour les filtres actifs
        activeFilters[filterKey] = '';
        
        // Appliquer les filtres
        applyFilters();
        
        // Mettre à jour l'apparence du bouton et les badges
        updateFilterButtonAppearance();
      });
      
      container.appendChild(badge);
    }
    
    // Fonction pour supprimer tous les badges de filtres actifs
    function removeActiveFilters() {
      const filterBadgesContainer = document.getElementById('active-filters-container');
      if (filterBadgesContainer) {
        filterBadgesContainer.innerHTML = '';
      }
    }

    // Initialiser l'état initial
    updateFilterButtonAppearance();
  }
});
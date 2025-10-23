// FRONTEND
/**
 * Gestion de la planification des SMS pour le Dashboard JDC
 */

document.addEventListener('DOMContentLoaded', function() {
  // Charger le contenu de l'onglet depuis le template
  loadScheduleTabContent();
  
  // Variables globales
  let scheduledMessages = [];
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  
  // Référence aux éléments du DOM (initialisées après le chargement du template)
  let scheduleTab, scheduleForm, schedulePhone, scheduleMessage, scheduleDate;
  let recurringTypeRadios, recurrenceDetails, monthlyDaySelect;
  let calendarView, listView, calendarGrid, scheduledTable;
  let viewCalendarBtn, viewListBtn, refreshScheduledBtn;
  let prevMonthBtn, nextMonthBtn, currentMonthDisplay;
  
  // Fonction pour charger le contenu de l'onglet depuis le template
  function loadScheduleTabContent() {
    fetch('/templates/schedule-tab.html')
      .then(response => response.text())
      .then(html => {
        // Insérer le template dans le DOM
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          mainContent.insertAdjacentHTML('beforeend', html);
          
          // Initialiser les références aux éléments du DOM
          initDOMReferences();
          
          // Configurer les événements
          setupEventListeners();
          
          // Charger les données
          loadScheduledMessages();
        }
      })
      .catch(error => {
        console.error('Erreur lors du chargement du template de planification:', error);
      });
  }
  
  // Initialiser les références aux éléments du DOM
  function initDOMReferences() {
    scheduleTab = document.getElementById('schedule-tab');
    scheduleForm = document.getElementById('schedule-form');
    schedulePhone = document.getElementById('schedule-phone');
    scheduleMessage = document.getElementById('schedule-message');
    scheduleDate = document.getElementById('schedule-date');
    
    recurringTypeRadios = document.getElementsByName('recurrence-type');
    recurrenceDetails = document.getElementById('recurrence-details');
    monthlyDaySelect = document.getElementById('monthly-day');
    
    calendarView = document.getElementById('calendar-view');
    listView = document.getElementById('list-view');
    calendarGrid = document.getElementById('calendar-grid');
    scheduledTable = document.getElementById('scheduled-table');
    
    viewCalendarBtn = document.getElementById('view-calendar-btn');
    viewListBtn = document.getElementById('view-list-btn');
    refreshScheduledBtn = document.getElementById('refresh-scheduled');
    
    prevMonthBtn = document.getElementById('prev-month');
    nextMonthBtn = document.getElementById('next-month');
    currentMonthDisplay = document.getElementById('current-month');
    
    // Générer les options pour les jours du mois
    if (monthlyDaySelect) {
      for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        monthlyDaySelect.appendChild(option);
      }
    }
    
    // Configurer la date par défaut pour le formulaire (demain)
    if (scheduleDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      scheduleDate.value = formatDateTimeForInput(tomorrow);
    }
  }
  
  // Configurer les écouteurs d'événements
  function setupEventListeners() {
    // Écouteur pour le formulaire de planification
    if (scheduleForm) {
      scheduleForm.addEventListener('submit', handleScheduleFormSubmit);
    }
    
    // Écouteurs pour les options de récurrence
    if (recurringTypeRadios) {
      for (const radio of recurringTypeRadios) {
        radio.addEventListener('change', handleRecurrenceTypeChange);
      }
    }
    
    // Écouteurs pour le compteur de caractères
    if (scheduleMessage) {
      scheduleMessage.addEventListener('input', updateCharCounter);
      scheduleMessage.addEventListener('input', updatePreview);
    }
    
    // Écouteurs pour les boutons de vue
    if (viewCalendarBtn) {
      viewCalendarBtn.addEventListener('click', () => {
        listView.style.display = 'none';
        calendarView.style.display = 'block';
        renderCalendar();
      });
    }
    
    if (viewListBtn) {
      viewListBtn.addEventListener('click', () => {
        calendarView.style.display = 'none';
        listView.style.display = 'block';
      });
    }
    
    // Écouteur pour le bouton de rafraîchissement
    if (refreshScheduledBtn) {
      refreshScheduledBtn.addEventListener('click', loadScheduledMessages);
    }
    
    // Écouteurs pour la navigation du calendrier
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        renderCalendar();
      });
    }
    
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        renderCalendar();
      });
    }
    
    // Écouteur pour l'activation de l'onglet
    const scheduleTabLink = document.querySelector('.nav-link[data-tab="schedule-tab"]');
    if (scheduleTabLink) {
      scheduleTabLink.addEventListener('click', function() {
        setTimeout(() => {
          if (scheduleTab.style.display !== 'none') {
            loadScheduledMessages();
          }
        }, 100);
      });
    }
  }
  
  // Gestionnaire de l'événement de changement de type de récurrence
  function handleRecurrenceTypeChange(event) {
    const recurringType = event.target.value;
    
    // Afficher ou masquer les détails de récurrence
    if (recurrenceDetails) {
      if (recurringType === 'none') {
        recurrenceDetails.style.display = 'none';
      } else {
        recurrenceDetails.style.display = 'block';
        
        // Afficher ou masquer les options spécifiques
        const weeklyOptions = document.querySelector('.weekly-options');
        const monthlyOptions = document.querySelector('.monthly-options');
        
        if (weeklyOptions) weeklyOptions.style.display = recurringType === 'weekly' ? 'block' : 'none';
        if (monthlyOptions) monthlyOptions.style.display = recurringType === 'monthly' ? 'block' : 'none';
      }
    }
  }
  
  // Gestionnaire de soumission du formulaire de planification
  function handleScheduleFormSubmit(event) {
    event.preventDefault();
    
    // Récupérer les valeurs du formulaire
    const phoneNumber = schedulePhone.value;
    const message = scheduleMessage.value;
    const scheduledDate = new Date(scheduleDate.value);
    
    // Récupérer le type de récurrence
    let recurringType = 'none';
    for (const radio of recurringTypeRadios) {
      if (radio.checked) {
        recurringType = radio.value;
        break;
      }
    }
    
    // Récupérer les détails de récurrence
    let recurringDetails = {};
    if (recurringType !== 'none') {
      // Date de fin (optionnelle)
      const endDateInput = document.getElementById('end-date');
      if (endDateInput && endDateInput.value) {
        recurringDetails.endDate = endDateInput.value;
      }
      
      // Détails spécifiques au type de récurrence
      if (recurringType === 'weekly') {
        // Jours de la semaine
        const selectedDays = [];
        const weekdayCheckboxes = document.querySelectorAll('.weekday-checkbox input:checked');
        weekdayCheckboxes.forEach(checkbox => {
          selectedDays.push(parseInt(checkbox.value));
        });
        recurringDetails.days = selectedDays.length > 0 ? selectedDays : [scheduledDate.getDay()];
      } else if (recurringType === 'monthly') {
        // Jour du mois
        recurringDetails.day = parseInt(monthlyDaySelect.value) || scheduledDate.getDate();
      }
      
      // Heure de la journée (conservée de la date sélectionnée)
      recurringDetails.time = `${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Créer l'objet de message planifié
    const scheduledMessage = {
      id: `sch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      to: phoneNumber,
      message: message,
      type: 'SMS',
      status: 'pending',
      scheduledDate: scheduledDate.toISOString(),
      recurringType: recurringType,
      recurringDetails: recurringType !== 'none' ? recurringDetails : null,
      createdAt: new Date().toISOString()
    };
    
    // Appeler l'API pour enregistrer le message planifié
    saveScheduledMessage(scheduledMessage);
  }
  
  // Fonction pour enregistrer un message planifié
  function saveScheduledMessage(messageData) {
    // Afficher un indicateur de chargement
    const resultDiv = document.getElementById('schedule-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="loading-indicator">
          <div class="loader"></div>
          <p>Enregistrement de la planification...</p>
        </div>
      `;
    }
    
    // Appeler l'API
    fetch('/api/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Afficher un message de succès
        if (resultDiv) {
          resultDiv.innerHTML = `
            <div class="alert alert-success">
              <i class="fas fa-check-circle"></i> SMS planifié avec succès pour le ${formatDate(messageData.scheduledDate)}
            </div>
          `;
        }
        
        // Réinitialiser le formulaire
        scheduleForm.reset();
        
        // Rafraîchir les données
        loadScheduledMessages();
        
        // Réinitialiser la date par défaut
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        scheduleDate.value = formatDateTimeForInput(tomorrow);
      } else {
        // Afficher un message d'erreur
        if (resultDiv) {
          resultDiv.innerHTML = `
            <div class="alert alert-danger">
              <i class="fas fa-exclamation-circle"></i> Erreur lors de la planification: ${data.error || 'Une erreur est survenue'}
            </div>
          `;
        }
      }
    })
    .catch(error => {
      console.error('Erreur lors de l\'enregistrement de la planification:', error);
      
      // Afficher un message d'erreur
      if (resultDiv) {
        resultDiv.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle"></i> Erreur: ${error.message}
          </div>
        `;
      }
      
      // Simuler un succès pour la démo
      simulateSuccessfulScheduling(messageData);
    });
  }
  
  // Fonction pour charger les messages planifiés
  function loadScheduledMessages() {
    // Afficher un indicateur de chargement dans le tableau
    if (scheduledTable) {
      const tbody = scheduledTable.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 20px;">
              <div class="loader" style="margin-bottom: 10px;"></div>
              <p>Chargement des SMS planifiés...</p>
            </td>
          </tr>
        `;
      }
    }
    
    // Appeler l'API pour récupérer les messages planifiés
    fetch('/api/schedule')
      .then(response => response.json())
      .then(data => {
        scheduledMessages = data;
        renderScheduledTable();
        renderCalendar();
      })
      .catch(error => {
        console.error('Erreur lors du chargement des messages planifiés:', error);
        
        // Simuler des données pour la démo
        simulateScheduledMessages();
      });
  }
  
  // Fonction pour simuler des messages planifiés (pour la démo)
  function simulateScheduledMessages() {
    // Créer des exemples de messages planifiés
    const today = new Date();
    
    scheduledMessages = [
      {
        id: 'sch-1697896500123',
        to: '+33612345678',
        message: 'Rappel : Votre rendez-vous est demain à 14h',
        type: 'SMS',
        status: 'pending',
        scheduledDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0).toISOString(),
        recurringType: 'none',
        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString()
      },
      {
        id: 'sch-1697896601234',
        to: '+33698765432',
        message: 'N\'oubliez pas de renouveler votre abonnement',
        type: 'SMS',
        status: 'pending',
        scheduledDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 8, 0).toISOString(),
        recurringType: 'monthly',
        recurringDetails: {
          day: 25,
          time: '08:00'
        },
        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString()
      },
      {
        id: 'sch-1697896702345',
        to: '+33634567890',
        message: 'Votre facture est disponible en ligne',
        type: 'SMS',
        status: 'pending',
        scheduledDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 9, 30).toISOString(),
        recurringType: 'weekly',
        recurringDetails: {
          days: [1, 3, 5], // Lundi, Mercredi, Vendredi
          time: '09:30'
        },
        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString()
      }
    ];
    
    // Rendre les données simulées
    renderScheduledTable();
    renderCalendar();
  }
  
  // Fonction pour simuler un succès lors de la planification (pour la démo)
  function simulateSuccessfulScheduling(messageData) {
    // Ajouter le message à la liste locale
    scheduledMessages.push(messageData);
    
    // Afficher un message de succès
    const resultDiv = document.getElementById('schedule-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i> SMS planifié avec succès pour le ${formatDate(messageData.scheduledDate)}
        </div>
      `;
    }
    
    // Réinitialiser le formulaire
    scheduleForm.reset();
    
    // Rafraîchir les vues
    renderScheduledTable();
    renderCalendar();
    
    // Réinitialiser la date par défaut
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    scheduleDate.value = formatDateTimeForInput(tomorrow);
  }
  
  // Fonction pour afficher le tableau des messages planifiés
  function renderScheduledTable() {
    if (!scheduledTable) return;
    
    const tbody = scheduledTable.querySelector('tbody');
    if (!tbody) return;
    
    // Vider le tableau
    tbody.innerHTML = '';
    
    // Si aucun message planifié
    if (!scheduledMessages || scheduledMessages.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 20px;">
            <i class="fas fa-info-circle"></i> Aucun SMS planifié.
          </td>
        </tr>
      `;
      return;
    }
    
    // Trier par date planifiée (du plus proche au plus lointain)
    const sortedMessages = [...scheduledMessages].sort((a, b) => {
      return new Date(a.scheduledDate) - new Date(b.scheduledDate);
    });
    
    // Remplir le tableau avec les messages planifiés
    sortedMessages.forEach(message => {
      const row = document.createElement('tr');
      
      // Formater la récurrence pour l'affichage
      let recurrenceDisplay = 'Non';
      if (message.recurringType === 'daily') {
        recurrenceDisplay = 'Quotidien';
      } else if (message.recurringType === 'weekly') {
        recurrenceDisplay = 'Hebdomadaire';
        if (message.recurringDetails && message.recurringDetails.days) {
          const days = message.recurringDetails.days.map(d => {
            const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            return dayNames[d];
          }).join(', ');
          recurrenceDisplay += ` (${days})`;
        }
      } else if (message.recurringType === 'monthly') {
        recurrenceDisplay = 'Mensuel';
        if (message.recurringDetails && message.recurringDetails.day) {
          recurrenceDisplay += ` (jour ${message.recurringDetails.day})`;
        }
      }
      
      row.innerHTML = `
        <td>${formatDate(message.scheduledDate)}</td>
        <td>${message.to}</td>
        <td>${message.message.length > 30 ? message.message.substring(0, 27) + '...' : message.message}</td>
        <td>${recurrenceDisplay}</td>
        <td><span class="status ${getStatusClass(message.status)}">${message.status}</span></td>
        <td class="actions">
          <button class="btn-edit" title="Modifier cette planification">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-delete" title="Supprimer cette planification">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      `;
      
      // Ajouter un titre au survol pour le contenu complet
      if (message.message.length > 30) {
        row.querySelector('td:nth-child(3)').title = message.message;
      }
      
      // Ajouter les écouteurs d'événements pour les boutons d'action
      const editBtn = row.querySelector('.btn-edit');
      if (editBtn) {
        editBtn.addEventListener('click', () => editScheduledMessage(message));
      }
      
      const deleteBtn = row.querySelector('.btn-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteScheduledMessage(message.id, row));
      }
      
      tbody.appendChild(row);
    });
  }
  
  // Fonction pour rendre le calendrier
  function renderCalendar() {
    if (!calendarGrid) return;
    
    // Mettre à jour l'affichage du mois actuel
    if (currentMonthDisplay) {
      const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      currentMonthDisplay.textContent = `${months[currentMonth]} ${currentYear}`;
    }
    
    // Vider la grille
    calendarGrid.innerHTML = '';
    
    // Obtenir le premier jour du mois
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    let startDay = firstDayOfMonth.getDay();
    // Ajuster pour que la semaine commence le lundi (0 = lundi, 6 = dimanche)
    startDay = startDay === 0 ? 6 : startDay - 1;
    
    // Obtenir le nombre de jours dans le mois
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Obtenir le nombre de jours du mois précédent
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Date actuelle pour mettre en évidence le jour actuel
    const today = new Date();
    
    // Calculer le nombre total de cellules nécessaires (lignes complètes de 7 jours)
    const totalDays = Math.ceil((startDay + daysInMonth) / 7) * 7;
    
    // Créer les cellules du calendrier
    for (let i = 0; i < totalDays; i++) {
      // Calculer le jour à afficher
      let dayNumber, isCurrentMonth;
      
      if (i < startDay) {
        // Jours du mois précédent
        dayNumber = daysInPrevMonth - startDay + i + 1;
        isCurrentMonth = false;
      } else if (i < startDay + daysInMonth) {
        // Jours du mois actuel
        dayNumber = i - startDay + 1;
        isCurrentMonth = true;
      } else {
        // Jours du mois suivant
        dayNumber = i - startDay - daysInMonth + 1;
        isCurrentMonth = false;
      }
      
      // Créer la cellule du jour
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';
      if (!isCurrentMonth) {
        dayCell.classList.add('other-month');
      }
      
      // Vérifier si c'est aujourd'hui
      if (isCurrentMonth && dayNumber === today.getDate() && 
          currentMonth === today.getMonth() && 
          currentYear === today.getFullYear()) {
        dayCell.classList.add('today');
      }
      
      // Créer l'en-tête du jour
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-day-header';
      dayHeader.textContent = dayNumber;
      dayCell.appendChild(dayHeader);
      
      // Calculer la date complète pour cette cellule
      const cellDate = new Date(
        isCurrentMonth ? currentYear : (currentMonth === 0 ? currentYear - 1 : currentYear),
        isCurrentMonth ? currentMonth : (currentMonth === 0 ? 11 : currentMonth - 1),
        dayNumber
      );
      
      // Ajouter les événements pour ce jour
      const cellEvents = getEventsForDay(cellDate);
      cellEvents.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'calendar-event';
        if (event.recurringType !== 'none') {
          eventDiv.classList.add('recurring');
        }
        eventDiv.textContent = `${event.to.substring(0, 5)}... - ${event.message.substring(0, 15)}${event.message.length > 15 ? '...' : ''}`;
        eventDiv.title = `${formatTime(event.scheduledDate)} - ${event.to} - ${event.message}`;
        
        // Ajouter un écouteur d'événement pour afficher les détails
        eventDiv.addEventListener('click', () => showEventDetails(event));
        
        dayCell.appendChild(eventDiv);
      });
      
      // Ajouter la cellule à la grille
      calendarGrid.appendChild(dayCell);
    }
  }
  
  // Fonction pour obtenir les événements pour un jour spécifique
  function getEventsForDay(date) {
    if (!scheduledMessages || scheduledMessages.length === 0) {
      return [];
    }
    
    const events = [];
    
    // Normaliser la date pour comparer uniquement les jours
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    scheduledMessages.forEach(message => {
      let shouldInclude = false;
      
      // Vérifier les messages ponctuels
      if (message.recurringType === 'none') {
        const msgDate = new Date(message.scheduledDate);
        const normalizedMsgDate = new Date(msgDate);
        normalizedMsgDate.setHours(0, 0, 0, 0);
        
        if (normalizedMsgDate.getTime() === normalizedDate.getTime()) {
          shouldInclude = true;
        }
      } 
      // Vérifier les messages récurrents
      else {
        const msgDate = new Date(message.scheduledDate);
        
        switch(message.recurringType) {
          case 'daily':
            shouldInclude = true;
            break;
            
          case 'weekly':
            if (message.recurringDetails && message.recurringDetails.days) {
              // 0 = dimanche, 1 = lundi, etc.
              const dayOfWeek = date.getDay();
              shouldInclude = message.recurringDetails.days.includes(dayOfWeek);
            }
            break;
            
          case 'monthly':
            if (message.recurringDetails && message.recurringDetails.day) {
              shouldInclude = date.getDate() === message.recurringDetails.day;
            }
            break;
        }
      }
      
      if (shouldInclude) {
        events.push(message);
      }
    });
    
    return events;
  }
  
  // Fonction pour afficher les détails d'un événement
  function showEventDetails(event) {
    // Créer un modal pour afficher les détails
    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    
    // Formater la récurrence pour l'affichage
    let recurrenceDisplay = 'Aucune (envoi unique)';
    if (event.recurringType === 'daily') {
      recurrenceDisplay = 'Quotidien';
    } else if (event.recurringType === 'weekly') {
      recurrenceDisplay = 'Hebdomadaire';
      if (event.recurringDetails && event.recurringDetails.days) {
        const days = event.recurringDetails.days.map(d => {
          const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
          return dayNames[d];
        }).join(', ');
        recurrenceDisplay += ` (${days})`;
      }
    } else if (event.recurringType === 'monthly') {
      recurrenceDisplay = 'Mensuel';
      if (event.recurringDetails && event.recurringDetails.day) {
        recurrenceDisplay += ` (jour ${event.recurringDetails.day})`;
      }
    }
    
    modal.innerHTML = `
      <div class="schedule-modal-content">
        <div class="schedule-modal-header">
          <h3>Détails du SMS planifié</h3>
          <button class="schedule-modal-close">&times;</button>
        </div>
        <div class="schedule-modal-body">
          <table class="table">
            <tbody>
              <tr>
                <td><strong>Destinataire</strong></td>
                <td>${event.to}</td>
              </tr>
              <tr>
                <td><strong>Message</strong></td>
                <td>${event.message}</td>
              </tr>
              <tr>
                <td><strong>Date planifiée</strong></td>
                <td>${formatDate(event.scheduledDate)}</td>
              </tr>
              <tr>
                <td><strong>Récurrence</strong></td>
                <td>${recurrenceDisplay}</td>
              </tr>
              <tr>
                <td><strong>Statut</strong></td>
                <td><span class="status ${getStatusClass(event.status)}">${event.status}</span></td>
              </tr>
              <tr>
                <td><strong>Créé le</strong></td>
                <td>${formatDate(event.createdAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="schedule-modal-footer">
          <button class="btn btn-secondary modal-close">Fermer</button>
          <button class="btn btn-primary modal-edit">Modifier</button>
          <button class="btn btn-danger modal-delete">Supprimer</button>
        </div>
      </div>
    `;
    
    // Ajouter le modal au DOM
    document.body.appendChild(modal);
    
    // Configurer les écouteurs d'événements
    const closeBtn = modal.querySelector('.schedule-modal-close');
    const closeButton = modal.querySelector('.modal-close');
    const editButton = modal.querySelector('.modal-edit');
    const deleteButton = modal.querySelector('.modal-delete');
    
    // Fermer le modal
    const closeModal = () => {
      modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    closeButton.addEventListener('click', closeModal);
    
    // Éditer l'événement
    editButton.addEventListener('click', () => {
      closeModal();
      editScheduledMessage(event);
    });
    
    // Supprimer l'événement
    deleteButton.addEventListener('click', () => {
      closeModal();
      deleteScheduledMessage(event.id);
    });
    
    // Fermer le modal en cliquant en dehors
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
  
  // Fonction pour éditer un message planifié
  function editScheduledMessage(message) {
    // Pour la démo, simplement défiler vers le formulaire
    scheduleTab.scrollIntoView({ behavior: 'smooth' });
    
    // Pré-remplir le formulaire avec les données du message
    schedulePhone.value = message.to;
    scheduleMessage.value = message.message;
    
    // Formater la date pour l'input datetime-local
    scheduleDate.value = formatDateTimeForInput(new Date(message.scheduledDate));
    
    // Sélectionner le type de récurrence
    for (const radio of recurringTypeRadios) {
      if (radio.value === message.recurringType) {
        radio.checked = true;
        
        // Déclencher l'événement de changement pour afficher les options appropriées
        const event = new Event('change');
        radio.dispatchEvent(event);
        break;
      }
    }
    
    // Pré-remplir les détails de récurrence si nécessaire
    if (message.recurringType !== 'none' && message.recurringDetails) {
      if (message.recurringType === 'weekly' && message.recurringDetails.days) {
        // Cocher les jours de la semaine
        const checkboxes = document.querySelectorAll('.weekday-checkbox input');
        checkboxes.forEach(checkbox => {
          checkbox.checked = message.recurringDetails.days.includes(parseInt(checkbox.value));
        });
      } else if (message.recurringType === 'monthly' && message.recurringDetails.day) {
        // Sélectionner le jour du mois
        monthlyDaySelect.value = message.recurringDetails.day;
      }
      
      // Pré-remplir la date de fin si elle existe
      if (message.recurringDetails.endDate) {
        document.getElementById('end-date').value = message.recurringDetails.endDate;
      }
    }
    
    // Mettre à jour les compteurs et aperçus
    updateCharCounter();
    updatePreview();
    
    // Afficher un message pour indiquer que c'est une modification
    const resultDiv = document.getElementById('schedule-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i> Modification d'un SMS planifié (ID: ${message.id})
          <br>
          <small>Modifiez les détails et soumettez le formulaire pour mettre à jour la planification.</small>
        </div>
      `;
    }
  }
  
  // Fonction pour supprimer un message planifié
  function deleteScheduledMessage(id, rowElement) {
    // Demander confirmation avant de supprimer
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette planification ?')) {
      return;
    }
    
    // Appliquer une classe visuelle si l'élément de ligne est fourni
    if (rowElement) {
      rowElement.classList.add('deleting');
    }
    
    // Appeler l'API pour supprimer la planification
    fetch(`/api/schedule/${id}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
      // Afficher une notification de succès
      if (window.showNotification) {
        window.showNotification('Planification supprimée avec succès', 'success');
      }
      
      // Mettre à jour la liste locale
      scheduledMessages = scheduledMessages.filter(msg => msg.id !== id);
      
      // Mettre à jour les vues
      renderScheduledTable();
      renderCalendar();
    })
    .catch(error => {
      console.error('Erreur lors de la suppression:', error);
      
      // Afficher une notification d'erreur
      if (window.showNotification) {
        window.showNotification('Erreur lors de la suppression: ' + error.message, 'danger');
      }
      
      // Simuler un succès pour la démo
      scheduledMessages = scheduledMessages.filter(msg => msg.id !== id);
      renderScheduledTable();
      renderCalendar();
    });
  }
  
  // Fonction pour mettre à jour le compteur de caractères
  function updateCharCounter() {
    const charCounter = document.getElementById('schedule-char-counter');
    if (!charCounter || !scheduleMessage) return;
    
    const messageLength = scheduleMessage.value.length;
    const smsCount = Math.ceil(messageLength / 160);
    
    charCounter.textContent = `${messageLength} caractères (${smsCount} SMS)`;
  }
  
  // Fonction pour mettre à jour l'aperçu du message
  function updatePreview() {
    const previewText = document.getElementById('schedule-preview-text');
    if (!previewText || !scheduleMessage) return;
    
    previewText.textContent = scheduleMessage.value || 'Votre message s\'affichera ici...';
  }
  
  // Fonction utilitaire pour formater une date pour l'affichage
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Fonction utilitaire pour extraire l'heure d'une date
  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Fonction utilitaire pour formater une date pour les inputs datetime-local
  function formatDateTimeForInput(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  
  // Fonction utilitaire pour obtenir la classe CSS d'un statut
  function getStatusClass(status) {
    switch(status ? status.toLowerCase() : '') {
      case 'delivered':
      case 'success':
      case 'livré':
        return 'success';
      case 'failed':
      case 'échec':
      case 'error':
        return 'danger';
      case 'pending':
      case 'en attente':
        return 'warning';
      default:
        return '';
    }
  }
});
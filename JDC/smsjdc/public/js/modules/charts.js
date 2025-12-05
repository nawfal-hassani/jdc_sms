// FRONTEND
/**
 * Module de gestion des graphiques pour le dashboard
 */

// Initialiser les graphiques avec Chart.js
window.initCharts = function() {
  console.log("Initialisation des graphiques...");
  
  // Graphique des SMS envoyés (par jour)
  const ctxDaily = document.getElementById('chart-daily');
  if (ctxDaily) {
    const dailyChart = new Chart(ctxDaily, {
      type: 'line',
      data: {
        labels: getLast7Days(),
        datasets: [{
          label: 'SMS envoyés',
          data: [0, 0, 0, 0, 0, 0, 0],
          fill: true,
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderColor: '#3498db',
          tension: 0.4,
          pointBackgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
    
    // Charger les vraies données
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('/api/sms/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (!Array.isArray(data)) return;
          
          // Compter les SMS par jour sur les 7 derniers jours
          const dailyCounts = [0, 0, 0, 0, 0, 0, 0];
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          data.forEach(item => {
            const itemDate = new Date(item.timestamp);
            itemDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0 && diffDays < 7) {
              dailyCounts[6 - diffDays]++;
            }
          });
          
          console.log('📊 SMS par jour:', dailyCounts);
          
          // Mettre à jour avec les vraies données
          dailyChart.data.datasets[0].data = dailyCounts;
          dailyChart.update();
        })
        .catch(error => {
          console.error('Erreur chargement données graphique Daily:', error);
        });
    }
  } else {
    console.error("Élément canvas 'chart-daily' non trouvé");
  }
  
  // Graphique des types de SMS
  const ctxTypes = document.getElementById('chart-types');
  if (ctxTypes) {
    const typesChart = new Chart(ctxTypes, {
      type: 'doughnut',
      data: {
        labels: ['SMS Simple', 'Token'],
        datasets: [{
          data: [0, 0],
          backgroundColor: [
            '#3498db',
            '#2ecc71'
          ],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          }
        },
        cutout: '70%'
      }
    });
    
    // Charger les vraies données depuis l'historique
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('/api/sms/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (!Array.isArray(data)) return;
          
          let smsCount = 0;
          let tokenCount = 0;
          
          data.forEach(item => {
            const type = item.type || 'SMS';
            if (type === 'Token') {
              tokenCount++;
            } else {
              smsCount++;
            }
          });
          
          console.log(`📊 Types de SMS: ${smsCount} SMS, ${tokenCount} Tokens`);
          
          // Mettre à jour avec les vraies données
          typesChart.data.datasets[0].data = [smsCount, tokenCount];
          typesChart.update();
        })
        .catch(error => {
          console.error('Erreur chargement données graphique Types:', error);
          // Données par défaut en cas d'erreur
          typesChart.data.datasets[0].data = [1, 1];
          typesChart.update();
        });
    } else {
      console.warn('Pas de token d\'authentification pour charger les données du graphique');
      typesChart.data.datasets[0].data = [1, 1];
      typesChart.update();
    }
  } else {
    console.error("Élément canvas 'chart-types' non trouvé");
  }
  
  // Graphique des taux de succès
  const ctxSuccess = document.getElementById('chart-success');
  if (ctxSuccess) {
    const successChart = new Chart(ctxSuccess, {
      type: 'bar',
      data: {
        labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
        datasets: [{
          label: 'Succès',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: '#2ecc71'
        }, {
          label: 'Échecs',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: '#e74c3c'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y || 0;
                return label + ': ' + value + '%';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            stacked: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          },
          x: {
            stacked: true
          }
        }
      }
    });
    
    // Charger les vraies données
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('/api/sms/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => response.json())
        .then(data => {
          if (!Array.isArray(data)) return;
          
          // Calculer les taux de succès par jour de la semaine sur les 7 derniers jours
          const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
          const successByDay = [0, 0, 0, 0, 0, 0, 0]; // Lun à Dim
          const failureByDay = [0, 0, 0, 0, 0, 0, 0];
          const totalByDay = [0, 0, 0, 0, 0, 0, 0];
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          data.forEach(item => {
            const itemDate = new Date(item.timestamp);
            const diffDays = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));
            
            // Seulement les 7 derniers jours
            if (diffDays >= 0 && diffDays < 7) {
              const dayOfWeek = itemDate.getDay(); // 0=Dimanche, 1=Lundi, etc.
              const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir en index Lundi=0
              
              totalByDay[dayIndex]++;
              
              if (item.status === 'delivered' || item.status === 'success') {
                successByDay[dayIndex]++;
              } else if (item.status === 'failed' || item.status === 'error') {
                failureByDay[dayIndex]++;
              }
            }
          });
          
          // Calculer les pourcentages
          const successPercent = totalByDay.map((total, i) => 
            total > 0 ? Math.round((successByDay[i] / total) * 100) : 0
          );
          const failurePercent = totalByDay.map((total, i) => 
            total > 0 ? Math.round((failureByDay[i] / total) * 100) : 0
          );
          
          console.log('📊 Taux de succès par jour:', successPercent);
          console.log('📊 Taux d\'échec par jour:', failurePercent);
          
          // Mettre à jour avec les vraies données
          successChart.data.datasets[0].data = successPercent;
          successChart.data.datasets[1].data = failurePercent;
          successChart.update();
        })
        .catch(error => {
          console.error('Erreur chargement données graphique Success:', error);
        });
    }
  } else {
    console.error("Élément canvas 'chart-success' non trouvé");
  }
  
  console.log("Graphiques initialisés avec succès");
}

// Obtenir les 7 derniers jours pour les graphiques
function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
  }
  return days;
}
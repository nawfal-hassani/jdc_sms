// FRONTEND
/**
 * Module de gestion des graphiques pour le dashboard
 */

// Initialiser les graphiques avec Chart.js
export function initCharts() {
  console.log("Initialisation des graphiques...");
  
  // Graphique des SMS envoyés (par jour)
  const ctxDaily = document.getElementById('chart-daily');
  if (ctxDaily) {
    new Chart(ctxDaily, {
      type: 'line',
      data: {
        labels: getLast7Days(),
        datasets: [{
          label: 'SMS envoyés',
          data: [12, 19, 8, 15, 20, 14, 18],
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
  } else {
    console.error("Élément canvas 'chart-daily' non trouvé");
  }
  
  // Graphique des types de SMS
  const ctxTypes = document.getElementById('chart-types');
  if (ctxTypes) {
    new Chart(ctxTypes, {
      type: 'doughnut',
      data: {
        labels: ['SMS Simple', 'Tokens', 'Notifications'],
        datasets: [{
          data: [65, 25, 10],
          backgroundColor: [
            '#3498db',
            '#2ecc71',
            '#f39c12'
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
  } else {
    console.error("Élément canvas 'chart-types' non trouvé");
  }
  
  // Graphique des taux de succès
  const ctxSuccess = document.getElementById('chart-success');
  if (ctxSuccess) {
    new Chart(ctxSuccess, {
      type: 'bar',
      data: {
        labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
        datasets: [{
          label: 'Succès',
          data: [95, 98, 92, 97, 99, 96, 94],
          backgroundColor: '#2ecc71'
        }, {
          label: 'Échecs',
          data: [5, 2, 8, 3, 1, 4, 6],
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
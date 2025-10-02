# =========================
# JDC SMS PROJECT
# =========================

MAKEFLAGS        += -sB

# =========================
# VARIABLES
# =========================

# Directories
API_DIR          = sms-api
DASHBOARD_DIR    = smsjdc

# Ports
API_PORT         = 3000
DASHBOARD_PORT   = 3030

# Colors for prettier output
GREEN            = \033[32m
RED              = \033[31m
RESET            = \033[0m

# Log file
LOG_FILE         = jdc_sms_services.log

# =========================
# RÈGLES ESSENTIELLES
# =========================

# Installation de tous les modules
install: 
	@echo "Installation des dépendances..."
	cd $(API_DIR) && npm install
	cd $(DASHBOARD_DIR) && npm install
	@echo "$(GREEN)Installation terminée.$(RESET)"

# Vérification des fichiers .env
check-env:
	@if [ ! -f "$(API_DIR)/.env" ]; then \
		cp $(API_DIR)/.env.example $(API_DIR)/.env; \
		echo "$(GREEN)Fichier .env créé pour l'API.$(RESET)"; \
	fi
	@if [ ! -f "$(DASHBOARD_DIR)/.env" ]; then \
		cp $(DASHBOARD_DIR)/.env.example $(DASHBOARD_DIR)/.env; \
		echo "$(GREEN)Fichier .env créé pour le Dashboard.$(RESET)"; \
	fi

# Démarrer tous les services
run: check-env kill-services
	@echo "$(GREEN)Démarrage des services JDC SMS...$(RESET)"
	cd $(API_DIR) && npm start > ../$(LOG_FILE) 2>&1 & echo $$! > ../api.pid
	@sleep 1
	cd $(DASHBOARD_DIR) && npm start >> ../$(LOG_FILE) 2>&1 & echo $$! > ../dashboard.pid
	@echo "$(GREEN)Services démarrés!$(RESET)"
	@echo "Dashboard: http://localhost:$(DASHBOARD_PORT)"
	@(which xdg-open > /dev/null && xdg-open http://localhost:$(DASHBOARD_PORT)) || \
	 (which open > /dev/null && open http://localhost:$(DASHBOARD_PORT)) || \
	 (which explorer > /dev/null && explorer http://localhost:$(DASHBOARD_PORT)) || \
	 echo "Veuillez ouvrir http://localhost:$(DASHBOARD_PORT) dans votre navigateur."

# Arrêter les services
stop:
	@if [ -f api.pid ]; then \
		kill $$(cat api.pid) 2>/dev/null || true; \
		rm api.pid; \
	fi
	@if [ -f dashboard.pid ]; then \
		kill $$(cat dashboard.pid) 2>/dev/null || true; \
		rm dashboard.pid; \
	fi
	@echo "$(GREEN)Services arrêtés.$(RESET)"

# Arrêter les services (pour usage interne)
kill-services:
	@if [ -f api.pid ]; then \
		kill $$(cat api.pid) 2>/dev/null || true; \
		rm api.pid; \
	fi
	@if [ -f dashboard.pid ]; then \
		kill $$(cat dashboard.pid) 2>/dev/null || true; \
		rm dashboard.pid; \
	fi

# Afficher les logs
logs:
	@if [ -f $(LOG_FILE) ]; then \
		tail -f $(LOG_FILE); \
	else \
		echo "$(RED)Fichier de log non trouvé.$(RESET)"; \
	fi

# Déployer en production
deploy:
	cd $(API_DIR) && ./deploy.sh
	@echo "$(GREEN)Déploiement terminé.$(RESET)"

# Afficher l'aide	
help:
	@echo "$(GREEN)Commandes disponibles:$(RESET)"
	@echo "  make install   - Installer les dépendances"
	@echo "  make run       - Démarrer les services et ouvrir le dashboard"
	@echo "  make stop      - Arrêter tous les services"
	@echo "  make logs      - Afficher les logs"
	@echo "  make deploy    - Déployer en production"

.PHONY: install check-env run stop kill-services logs deploy help
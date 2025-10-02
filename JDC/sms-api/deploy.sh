#!/usr/bin/env bash
# Script de déploiement pour l'API SMS
# Usage: ./deploy.sh [target]
# où [target] est 'railway', 'render', 'heroku' ou 'all'

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que git est installé
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Vérifier si le dossier est un repo git
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Ce dossier n'est pas un dépôt git. Initialisation...${NC}"
    git init
    git add .
    git commit -m "Initial commit"
fi

# Vérifier que tout est commité
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}Il y a des modifications non commitées. Voulez-vous les commiter? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        git add .
        echo -e "${BLUE}Entrez un message de commit:${NC}"
        read -r commit_message
        git commit -m "$commit_message"
    else
        echo -e "${YELLOW}Déploiement avec des modifications non commitées...${NC}"
    fi
fi

# Fonction pour déployer sur Railway
deploy_railway() {
    echo -e "${BLUE}Déploiement sur Railway...${NC}"
    
    # Vérifier que Railway CLI est installé
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}Railway CLI n'est pas installé. Installation...${NC}"
        npm i -g @railway/cli
    fi
    
    # Vérifier l'authentification Railway
    railway status &> /dev/null
    if [ $? -ne 0 ]; then
        echo -e "${BLUE}Authentification Railway requise:${NC}"
        railway login
    fi
    
    # Déploiement
    railway up
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Déploiement sur Railway réussi!${NC}"
    else
        echo -e "${RED}❌ Échec du déploiement sur Railway.${NC}"
    fi
}

# Fonction pour déployer sur Render
deploy_render() {
    echo -e "${BLUE}Déploiement sur Render...${NC}"
    echo -e "${YELLOW}Pour déployer sur Render:${NC}"
    echo -e "${BLUE}1. Connectez-vous à votre compte Render (https://dashboard.render.com)${NC}"
    echo -e "${BLUE}2. Créez un nouveau Web Service${NC}"
    echo -e "${BLUE}3. Connectez votre dépôt GitHub${NC}"
    echo -e "${BLUE}4. Configurez les variables d'environnement${NC}"
    echo -e "${BLUE}5. Déployez!${NC}"
    echo -e "${GREEN}✅ Instructions pour Render affichées!${NC}"
}

# Fonction pour déployer sur Heroku
deploy_heroku() {
    echo -e "${BLUE}Déploiement sur Heroku...${NC}"
    
    # Vérifier que Heroku CLI est installé
    if ! command -v heroku &> /dev/null; then
        echo -e "${YELLOW}Heroku CLI n'est pas installé. Veuillez l'installer:${NC}"
        echo -e "${BLUE}https://devcenter.heroku.com/articles/heroku-cli${NC}"
        return 1
    fi
    
    # Vérifier l'authentification Heroku
    heroku whoami &> /dev/null
    if [ $? -ne 0 ]; then
        echo -e "${BLUE}Authentification Heroku requise:${NC}"
        heroku login
    fi
    
    # Vérifier si l'app existe
    heroku apps:info sms-api &> /dev/null
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}L'application Heroku 'sms-api' n'existe pas. Création...${NC}"
        heroku create sms-api
    fi
    
    # Configurer les variables d'environnement
    echo -e "${BLUE}Voulez-vous configurer les variables d'environnement? (y/n)${NC}"
    read -r config_env
    if [[ "$config_env" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${BLUE}Configuration des variables d'environnement...${NC}"
        # Charger depuis .env si existant
        if [ -f ".env" ]; then
            while IFS= read -r line || [[ -n "$line" ]]; do
                # Ignorer les lignes vides ou commentées
                if [[ ! "$line" =~ ^# && -n "$line" ]]; then
                    heroku config:set "$line" --app sms-api
                fi
            done < .env
        else
            echo -e "${YELLOW}Fichier .env non trouvé. Configuration manuelle:${NC}"
            echo -e "${BLUE}TWILIO_SID:${NC}"
            read -r twilio_sid
            [ -z "$twilio_sid" ] && twilio_sid="ACac14b925b6b77bec40a578c4dcfef095"
            heroku config:set TWILIO_SID="$twilio_sid" --app sms-api
            
            echo -e "${BLUE}TWILIO_TOKEN:${NC}"
            read -r twilio_token
            [ -z "$twilio_token" ] && twilio_token="c71c857624bd97f7d93f281cab987719"
            heroku config:set TWILIO_TOKEN="$twilio_token" --app sms-api
            
            echo -e "${BLUE}TWILIO_PHONE:${NC}"
            read -r twilio_phone
            [ -z "$twilio_phone" ] && twilio_phone="+19514717077"
            heroku config:set TWILIO_PHONE="$twilio_phone" --app sms-api
        fi
    fi
    
    # Déploiement
    git push heroku main || git push heroku master
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Déploiement sur Heroku réussi!${NC}"
        echo -e "${BLUE}URL de l'application: $(heroku apps:info --json | grep web_url | cut -d'"' -f4)${NC}"
    else
        echo -e "${RED}❌ Échec du déploiement sur Heroku.${NC}"
    fi
}

# Traiter l'argument de ligne de commande
target=${1:-"all"}
case "$target" in
    railway)
        deploy_railway
        ;;
    render)
        deploy_render
        ;;
    heroku)
        deploy_heroku
        ;;
    all)
        echo -e "${BLUE}Déploiement sur toutes les plateformes...${NC}"
        deploy_railway
        echo ""
        deploy_render
        echo ""
        deploy_heroku
        ;;
    *)
        echo -e "${RED}Cible de déploiement non reconnue: $target${NC}"
        echo -e "${BLUE}Options valides: railway, render, heroku, all${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Script de déploiement terminé!${NC}"
exit 0
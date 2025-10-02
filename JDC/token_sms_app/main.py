#!/usr/bin/env python3
"""
JDC Token SMS Sender

Génère un token de sécurité et l'envoie par SMS via l'API JDC.
"""

import os
import requests
import random
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

def generate_token():
    """
    Génère un token numérique à 6 chiffres
    """
    return str(random.randint(100000, 999999))

def send_token_sms(api_url, phone_number, token):
    """
    Envoie un token par SMS via l'API JDC
    
    Args:
        api_url: URL de l'API SMS JDC
        phone_number: Numéro du destinataire
        token: Token à envoyer
        
    Returns:
        bool: True si l'envoi a réussi
    """
    payload = {
        'phoneNumber': phone_number
    }
    
    try:
        response = requests.post(f"{api_url}/send-token-by-sms", json=payload)
        response.raise_for_status()
        print(f"✓ Token envoyé avec succès à {phone_number}")
        return True
    except Exception as e:
        print(f"✗ Erreur: {e}")
        return False

def main():
    # Configuration
    API_URL = os.getenv('API_URL', 'http://localhost:3000/api')
    PHONE_NUMBER = os.getenv('PHONE_NUMBER')
    
    # Vérification du numéro de téléphone
    if not PHONE_NUMBER:
        PHONE_NUMBER = input("Entrez le numéro de téléphone (format international, ex: +33612345678): ")
        
    # Génération et envoi du token
    token = generate_token()
    print(f"Token généré: {token}")
    
    # Envoi par SMS via l'API JDC
    print(f"Envoi du token à {PHONE_NUMBER}...")
    send_token_sms(API_URL, PHONE_NUMBER, token)

if __name__ == "__main__":
    main()

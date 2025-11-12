/**
 * Scripts pour la page de connexion
 * Gestion des onglets, validation des formulaires, et authentification
 */

// Service d'authentification
const authService = {
    login: async function(email, password, remember) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, remember })
            });

            const data = await response.json();

            if (data.success && data.token) {
                // Stocker le token dans localStorage ou sessionStorage
                const storage = remember ? localStorage : sessionStorage;
                storage.setItem('authToken', data.token);
                storage.setItem('user', JSON.stringify(data.user));S
            }

            return data;
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return {
                success: false,
                message: 'Erreur de connexion au serveur'
            };
        }
    },
    
    requestSmsCode: async function(phone) {
        try {
            const response = await fetch('/api/auth/request-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone })
            });

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la demande de code SMS:', error);
            return {
                success: false,
                message: 'Erreur de connexion au serveur'
            };
        }
    },
    
    verifySmsCode: async function(phone, code) {
        try {
            const response = await fetch('/api/auth/verify-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, code })
            });

            const data = await response.json();

            if (data.success && data.token) {
                // Stocker le token
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            console.error('Erreur lors de la vérification du code:', error);
            return {
                success: false,
                message: 'Erreur de connexion au serveur'
            };
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Références des éléments
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    const togglePassword = document.querySelectorAll('.toggle-password');
    const emailLoginForm = document.getElementById('email-login-form');
    const smsLoginForm = document.getElementById('sms-login-form');
    const smsRequestForm = document.getElementById('sms-request-form');
    const smsVerifyForm = document.getElementById('sms-verify-form');
    const phoneInput = document.getElementById('phone');
    const codeInputs = document.querySelectorAll('.code-input');
    const resendBtn = document.getElementById('resend-code');
    const timerElement = document.getElementById('timer');

    // Gestion des onglets d'authentification
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Retirer la classe active de tous les onglets et formulaires
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            // Ajouter la classe active à l'onglet cliqué et au formulaire associé
            this.classList.add('active');
            const targetFormId = this.getAttribute('data-form');
            document.getElementById(targetFormId).classList.add('active');
        });
    });

    // Gestion de l'affichage/masquage du mot de passe
    togglePassword.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Changer l'icône selon l'état
            if (type === 'text') {
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });

    // Validation du formulaire de connexion par email
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember').checked;
            
            // Validation
            if (!validateEmail(email)) {
                showError('email', 'Veuillez saisir une adresse email valide');
                return;
            }
            
            if (password.length < 6) {
                showError('password', 'Le mot de passe doit contenir au moins 6 caractères');
                return;
            }
            
            // Appel au service d'authentification
            showLoader();
            
            try {
                const response = await authService.login(email, password, rememberMe);
                
                if (response.success) {
                    // Redirection vers la page principale
                    window.location.href = 'index.html';
                } else {
                    // Afficher l'erreur
                    showError('password', response.message || 'Identifiants invalides');
                }
            } catch (error) {
                console.error('Erreur de connexion:', error);
                showError('password', 'Une erreur est survenue lors de la connexion');
            } finally {
                hideLoader();
            }
        });
    }

    // Gestion du formulaire de demande de SMS
    if (smsRequestForm) {
        smsRequestForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const phone = phoneInput.value.trim();
            
            // Validation simple du numéro de téléphone
            if (!validatePhone(phone)) {
                showError('phone', 'Veuillez saisir un numéro de téléphone valide');
                return;
            }
            
            // Appel au service d'authentification pour demander un code SMS
            showLoader();
            
            try {
                const response = await authService.requestSmsCode(phone);
                
                if (response.success) {
                    // Masquer le formulaire de demande et afficher le formulaire de vérification
                    smsRequestForm.style.display = 'none';
                    smsVerifyForm.style.display = 'block';
                    
                    // Afficher le numéro masqué
                    const maskedPhone = maskPhone(phone);
                    document.getElementById('masked-phone').textContent = maskedPhone;
                    
                    // Stocker le numéro de téléphone pour la vérification
                    smsVerifyForm.dataset.phone = phone;
                    
                    // Démarrer le compte à rebours
                    startResendTimer(response.expiresIn || 300);
                    
                    // Focus sur le premier champ de code
                    codeInputs[0].focus();
                } else {
                    // Afficher l'erreur
                    showError('phone', response.message || 'Numéro de téléphone non reconnu');
                }
            } catch (error) {
                console.error('Erreur lors de la demande de code SMS:', error);
                showError('phone', 'Une erreur est survenue lors de l\'envoi du SMS');
            } finally {
                hideLoader();
            }
        });
    }

    // Gestion des champs de code de vérification
    if (codeInputs && codeInputs.length) {
        codeInputs.forEach((input, index) => {
            // Avancer automatiquement au champ suivant après la saisie
            input.addEventListener('input', function(e) {
                if (this.value.length === 1) {
                    if (index < codeInputs.length - 1) {
                        codeInputs[index + 1].focus();
                    }
                }
            });
            
            // Gérer les touches spéciales (retour arrière, suppression)
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    if (this.value === '' && index > 0) {
                        codeInputs[index - 1].focus();
                    }
                }
            });
        });
    }

    // Gestion du formulaire de vérification de SMS
    if (smsVerifyForm) {
        smsVerifyForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            let code = '';
            codeInputs.forEach(input => {
                code += input.value;
            });
            
            // Vérification de la longueur du code
            if (code.length !== codeInputs.length) {
                alert('Veuillez saisir le code complet');
                return;
            }
            
            // Récupérer le numéro de téléphone stocké
            const phone = this.dataset.phone;
            
            if (!phone) {
                showError('', 'Une erreur est survenue. Veuillez réessayer.');
                return;
            }
            
            // Appel au service d'authentification pour vérifier le code
            showLoader();
            
            try {
                const response = await authService.verifySmsCode(phone, code);
                
                if (response.success) {
                    // Redirection vers la page principale
                    window.location.href = 'index.html';
                } else {
                    // Afficher l'erreur
                    // Si des tentatives restantes sont indiquées, les afficher
                    const errorMsg = response.attemptsLeft 
                        ? `Code incorrect. Tentatives restantes : ${response.attemptsLeft}`
                        : response.message || 'Code incorrect';
                        
                    alert(errorMsg);
                    
                    // Vider les champs de code
                    codeInputs.forEach(input => {
                        input.value = '';
                    });
                    
                    // Focus sur le premier champ
                    codeInputs[0].focus();
                }
            } catch (error) {
                console.error('Erreur lors de la vérification du code:', error);
                alert('Une erreur est survenue lors de la vérification du code');
            } finally {
                hideLoader();
            }
        });
    }

    // Gestion du bouton de renvoi de code
    if (resendBtn) {
        resendBtn.addEventListener('click', async function(event) {
            event.preventDefault();
            
            // Ne rien faire si le bouton est désactivé
            if (this.classList.contains('disabled')) {
                return;
            }
            
            // Récupérer le numéro de téléphone stocké
            const phone = smsVerifyForm.dataset.phone;
            
            if (!phone) {
                alert('Une erreur est survenue. Veuillez réessayer.');
                return;
            }
            
            // Appel au service d'authentification pour demander un nouveau code
            showLoader();
            
            try {
                const response = await authService.requestSmsCode(phone);
                
                if (response.success) {
                    // Réinitialiser les champs de code
                    codeInputs.forEach(input => {
                        input.value = '';
                    });
                    
                    // Redémarrer le compte à rebours
                    startResendTimer(response.expiresIn || 300);
                    
                    // Focus sur le premier champ
                    codeInputs[0].focus();
                    
                    // Afficher un message de confirmation
                    alert('Un nouveau code a été envoyé');
                } else {
                    // Afficher l'erreur
                    alert(response.message || 'Erreur lors de l\'envoi du code');
                }
            } catch (error) {
                console.error('Erreur lors du renvoi de code:', error);
                alert('Une erreur est survenue lors du renvoi du code');
            } finally {
                hideLoader();
            }
        });
    }

    // Fonctions utilitaires
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validatePhone(phone) {
        // Validation simple: au moins 10 chiffres
        return phone.replace(/\D/g, '').length >= 10;
    }
    
    function maskPhone(phone) {
        // Masquer tous les chiffres sauf les 2 derniers
        const cleaned = phone.replace(/\D/g, '');
        const lastDigits = cleaned.slice(-2);
        const masked = '*'.repeat(cleaned.length - 2) + lastDigits;
        return masked;
    }
    
    function startResendTimer(seconds) {
        if (!timerElement || !resendBtn) return;
        
        // Désactiver le bouton de renvoi
        resendBtn.classList.add('disabled');
        
        let timeLeft = seconds;
        timerElement.textContent = `(${timeLeft}s)`;
        
        const interval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = `(${timeLeft}s)`;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                timerElement.textContent = '';
                resendBtn.classList.remove('disabled');
            }
        }, 1000);
    }
    
    function showError(inputId, message) {
        const input = document.getElementById(inputId);
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Supprimer tout message d'erreur existant
        const existingError = input.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Ajouter la classe d'erreur et le message
        input.classList.add('error');
        input.parentElement.appendChild(errorElement);
        
        // Supprimer l'erreur après modification du champ
        input.addEventListener('input', function() {
            this.classList.remove('error');
            const error = this.parentElement.querySelector('.error-message');
            if (error) error.remove();
        }, { once: true });
    }
    
    function showLoader() {
        // Créer un élément loader s'il n'existe pas déjà
        if (!document.querySelector('.loader-overlay')) {
            const loader = document.createElement('div');
            loader.className = 'loader-overlay';
            loader.innerHTML = '<div class="loader"></div>';
            document.body.appendChild(loader);
        }
    }
    
    function hideLoader() {
        const loader = document.querySelector('.loader-overlay');
        if (loader) {
            loader.remove();
        }
    }
    
    // Initialisation: activer le premier onglet
    if (authTabs.length > 0) {
        authTabs[0].click();
    }
});
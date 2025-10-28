/**
 * Contrôleur d'authentification pour le JDC SMS Dashboard
 * Gestion de l'authentification par email/mot de passe et vérification SMS
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { promisify } = require('util');

// Chemin vers le fichier des utilisateurs
const usersFilePath = path.join(__dirname, '../../data/users.json');
const SALT_ROUNDS = 10;

// Générer un jeton aléatoire
function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

// Générer un code SMS à 6 chiffres
function generateSmsCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Créer ou récupérer le fichier des utilisateurs
async function getUsers() {
    try {
        // Vérifier si le fichier existe
        try {
            await promisify(fs.access)(usersFilePath);
        } catch (error) {
            // Si le fichier n'existe pas, créer un fichier avec des utilisateurs par défaut
            // Hashage des mots de passe par défaut
            const defaultUsers = [
                {
                    id: '1',
                    email: 'admin@jdc.fr',
                    password: await bcrypt.hash('admin123', SALT_ROUNDS),
                    name: 'Administrateur',
                    role: 'admin',
                    phone: '+33612345678'
                },
                {
                    id: '2',
                    email: 'user@jdc.fr',
                    password: await bcrypt.hash('user123', SALT_ROUNDS),
                    name: 'Utilisateur',
                    role: 'user',
                    phone: '+33687654321'
                }
            ];

            await promisify(fs.writeFile)(usersFilePath, JSON.stringify(defaultUsers, null, 2));
            return defaultUsers;
        }

        // Lire le fichier des utilisateurs
        const data = await promisify(fs.readFile)(usersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors de la lecture des utilisateurs:', error);
        return [];
    }
}

// Stocker les sessions et codes SMS (dans un environnement de production, utilisez Redis)
const sessions = {};
const smsCodes = {};

// Contrôleur d'authentification
const authController = {
    /**
     * Authentification par email/mot de passe
     */
    async login(req, res) {
        try {
            const { email, password, remember } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email et mot de passe requis'
                });
            }

            // Récupérer les utilisateurs
            const users = await getUsers();

            // Rechercher l'utilisateur
            const user = users.find(u => u.email === email);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Identifiants invalides'
                });
            }

            // Vérifier le mot de passe avec bcrypt
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Identifiants invalides'
                });
            }

            // Générer un token d'authentification
            const token = generateToken();
            const expiresIn = remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7 jours ou 1 jour
            const expiryDate = new Date(Date.now() + expiresIn);

            // Stocker la session
            sessions[token] = {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                expires: expiryDate
            };

            // Envoyer la réponse avec le token
            return res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                expiresIn
            });
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de l\'authentification'
            });
        }
    },

    /**
     * Demande de code SMS pour authentification
     */
    async requestSmsCode(req, res) {
        try {
            const { phone } = req.body;

            if (!phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Numéro de téléphone requis'
                });
            }

            // Récupérer les utilisateurs
            const users = await getUsers();

            // Vérifier si le numéro de téléphone existe
            const user = users.find(u => u.phone === phone);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Numéro de téléphone non reconnu'
                });
            }

            // Générer un code SMS
            const smsCode = generateSmsCode();
            
            // Stocker le code avec une expiration (5 minutes)
            smsCodes[phone] = {
                code: smsCode,
                userId: user.id,
                attempts: 0,
                expires: new Date(Date.now() + 5 * 60 * 1000)
            };

            // Dans un environnement de production, envoyez réellement le SMS ici
            console.log(`[SMS ENVOYÉ] Code ${smsCode} envoyé au numéro ${phone}`);

            // Envoyer une réponse de succès
            return res.json({
                success: true,
                message: 'Code SMS envoyé avec succès',
                expiresIn: 5 * 60 // 5 minutes en secondes
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du code SMS:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de l\'envoi du code SMS'
            });
        }
    },

    /**
     * Vérification du code SMS et authentification
     */
    async verifySmsCode(req, res) {
        try {
            const { phone, code } = req.body;

            if (!phone || !code) {
                return res.status(400).json({
                    success: false,
                    message: 'Numéro de téléphone et code requis'
                });
            }

            // Vérifier si un code existe pour ce numéro
            const smsData = smsCodes[phone];

            if (!smsData) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun code demandé pour ce numéro'
                });
            }

            // Vérifier si le code a expiré
            if (new Date() > smsData.expires) {
                delete smsCodes[phone];
                return res.status(400).json({
                    success: false,
                    message: 'Le code a expiré, veuillez demander un nouveau code'
                });
            }

            // Vérifier si trop de tentatives
            if (smsData.attempts >= 3) {
                delete smsCodes[phone];
                return res.status(400).json({
                    success: false,
                    message: 'Trop de tentatives incorrectes, veuillez demander un nouveau code'
                });
            }

            // Vérifier le code
            if (smsData.code !== code) {
                smsData.attempts += 1;
                return res.status(401).json({
                    success: false,
                    message: 'Code incorrect',
                    attemptsLeft: 3 - smsData.attempts
                });
            }

            // Récupérer les utilisateurs
            const users = await getUsers();
            const user = users.find(u => u.id === smsData.userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }

            // Supprimer le code SMS (il a été utilisé avec succès)
            delete smsCodes[phone];

            // Générer un token d'authentification
            const token = generateToken();
            const expiresIn = 24 * 60 * 60 * 1000; // 1 jour
            const expiryDate = new Date(Date.now() + expiresIn);

            // Stocker la session
            sessions[token] = {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                expires: expiryDate
            };

            // Envoyer la réponse avec le token
            return res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                expiresIn: expiresIn
            });
        } catch (error) {
            console.error('Erreur lors de la vérification du code SMS:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la vérification du code'
            });
        }
    },

    /**
     * Vérification du token d'authentification
     */
    async verifyToken(req, res) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token requis'
                });
            }

            // Vérifier si la session existe
            const session = sessions[token];

            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: 'Session invalide ou expirée'
                });
            }

            // Vérifier si la session a expiré
            if (new Date() > new Date(session.expires)) {
                delete sessions[token];
                return res.status(401).json({
                    success: false,
                    message: 'Session expirée'
                });
            }

            // Session valide, renvoyer les infos utilisateur
            return res.json({
                success: true,
                user: {
                    id: session.userId,
                    email: session.email,
                    name: session.name,
                    role: session.role
                }
            });
        } catch (error) {
            console.error('Erreur lors de la vérification du token:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la vérification du token'
            });
        }
    },

    /**
     * Déconnexion (invalidation du token)
     */
    logout(req, res) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token requis'
                });
            }

            // Supprimer la session
            delete sessions[token];

            return res.json({
                success: true,
                message: 'Déconnexion réussie'
            });
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la déconnexion'
            });
        }
    },
    
    /**
     * Créer un nouvel utilisateur
     */
    async createUser(req, res) {
        try {
            const { email, password, name, phone, role } = req.body;
            
            // Validation des données
            if (!email || !password || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, mot de passe et nom requis'
                });
            }
            
            // Récupérer les utilisateurs existants
            const users = await getUsers();
            
            // Vérifier si l'email existe déjà
            if (users.some(user => user.email === email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }
            
            // Vérifier si le téléphone existe déjà
            if (phone && users.some(user => user.phone === phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Ce numéro de téléphone est déjà utilisé'
                });
            }
            
            // Créer un nouvel ID
            const newId = String(Math.max(...users.map(user => parseInt(user.id)), 0) + 1);
            
            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            
            // Créer le nouvel utilisateur
            const newUser = {
                id: newId,
                email,
                password: hashedPassword,
                name,
                role: role || 'user',
                phone: phone || ''
            };
            
            // Ajouter l'utilisateur à la liste
            users.push(newUser);
            
            // Sauvegarder la liste mise à jour
            await promisify(fs.writeFile)(usersFilePath, JSON.stringify(users, null, 2));
            
            return res.status(201).json({
                success: true,
                message: 'Utilisateur créé avec succès',
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role
                }
            });
        } catch (error) {
            console.error('Erreur lors de la création d\'utilisateur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la création d\'utilisateur'
            });
        }
    },
    
    /**
     * Récupérer la liste des utilisateurs
     */
    async getUsers(req, res) {
        try {
            const users = await getUsers();
            
            // Ne pas renvoyer les mots de passe
            const safeUsers = users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }));
            
            return res.json({
                success: true,
                users: safeUsers
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la récupération des utilisateurs'
            });
        }
    },
    
    /**
     * Mettre à jour un utilisateur
     */
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { email, password, name, phone, role } = req.body;
            
            // Récupérer les utilisateurs
            const users = await getUsers();
            
            // Trouver l'utilisateur à mettre à jour
            const userIndex = users.findIndex(user => user.id === id);
            
            if (userIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }
            
            const user = users[userIndex];
            
            // Vérifier si l'email est déjà utilisé par un autre utilisateur
            if (email && email !== user.email && users.some(u => u.email === email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }
            
            // Vérifier si le téléphone est déjà utilisé par un autre utilisateur
            if (phone && phone !== user.phone && users.some(u => u.phone === phone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Ce numéro de téléphone est déjà utilisé'
                });
            }
            
            // Mettre à jour l'utilisateur
            const updatedUser = {
                ...user,
                name: name || user.name,
                email: email || user.email,
                phone: phone !== undefined ? phone : user.phone,
                role: role || user.role
            };
            
            // Hasher le nouveau mot de passe si fourni
            if (password) {
                updatedUser.password = await bcrypt.hash(password, SALT_ROUNDS);
            }
            
            users[userIndex] = updatedUser;
            
            // Sauvegarder la liste mise à jour
            await promisify(fs.writeFile)(usersFilePath, JSON.stringify(users, null, 2));
            
            return res.json({
                success: true,
                message: 'Utilisateur mis à jour avec succès',
                user: {
                    id: users[userIndex].id,
                    name: users[userIndex].name,
                    email: users[userIndex].email,
                    phone: users[userIndex].phone,
                    role: users[userIndex].role
                }
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la mise à jour de l\'utilisateur'
            });
        }
    },
    
    /**
     * Supprimer un utilisateur
     */
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            
            // Récupérer les utilisateurs
            const users = await getUsers();
            
            // Vérifier si l'utilisateur existe
            if (!users.some(user => user.id === id)) {
                return res.status(404).json({
                    success: false,
                    message: 'Utilisateur non trouvé'
                });
            }
            
            // Filtrer pour supprimer l'utilisateur
            const updatedUsers = users.filter(user => user.id !== id);
            
            // Sauvegarder la liste mise à jour
            await promisify(fs.writeFile)(usersFilePath, JSON.stringify(updatedUsers, null, 2));
            
            return res.json({
                success: true,
                message: 'Utilisateur supprimé avec succès'
            });
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de la suppression de l\'utilisateur'
            });
        }
    },

    /**
     * Middleware de vérification d'authentification
     */
    authenticate(req, res, next) {
        try {
            // Récupérer le token d'autorisation
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'Token d\'authentification requis'
                });
            }

            // Extraire le token
            const token = authHeader.split(' ')[1];

            // Vérifier si la session existe
            const session = sessions[token];

            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: 'Session invalide ou expirée'
                });
            }

            // Vérifier si la session a expiré
            if (new Date() > new Date(session.expires)) {
                delete sessions[token];
                return res.status(401).json({
                    success: false,
                    message: 'Session expirée'
                });
            }

            // Ajouter les informations de l'utilisateur à la requête
            req.user = {
                id: session.userId,
                email: session.email,
                name: session.name,
                role: session.role
            };

            // Continuer avec la requête
            next();
        } catch (error) {
            console.error('Erreur dans le middleware d\'authentification:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de l\'authentification'
            });
        }
    }
};

module.exports = authController;
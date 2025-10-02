import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SMS API Documentation",
      version: "1.0.0",
      description: "Documentation de l'API pour l'envoi de SMS et la gestion de tokens",
      contact: {
        name: "Support",
        email: "support@exemple.com"
      },
      license: {
        name: "ISC"
      }
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Serveur local de développement"
      },
      {
        url: "https://api-sms.exemple.com",
        description: "Serveur de production (exemple)"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key"
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false
            },
            error: {
              type: "string",
              example: "Description de l'erreur"
            }
          }
        },
        SendSmsRequest: {
          type: "object",
          required: ["to", "message"],
          properties: {
            to: {
              type: "string",
              description: "Numéro de téléphone au format international",
              example: "+33612345678"
            },
            message: {
              type: "string",
              description: "Contenu du message à envoyer",
              example: "Votre message ici"
            }
          }
        },
        GetTokenRequest: {
          type: "object",
          properties: {
            apiUrl: {
              type: "string",
              description: "URL de l'API d'authentification (optionnel)",
              example: "https://api.exemple.com/auth"
            },
            username: {
              type: "string",
              description: "Nom d'utilisateur",
              example: "user123"
            },
            password: {
              type: "string",
              description: "Mot de passe",
              example: "password123"
            }
          }
        },
        SendTokenBySmsRequest: {
          type: "object",
          required: ["phoneNumber"],
          properties: {
            phoneNumber: {
              type: "string",
              description: "Numéro de téléphone au format international",
              example: "+33612345678"
            },
            apiUrl: {
              type: "string",
              description: "URL de l'API d'authentification (optionnel)",
              example: "https://api.exemple.com/auth"
            },
            credentials: {
              type: "object",
              description: "Identifiants pour l'API d'authentification",
              properties: {
                username: {
                  type: "string",
                  example: "user123"
                },
                password: {
                  type: "string",
                  example: "password123"
                }
              }
            },
            messagePrefix: {
              type: "string",
              description: "Préfixe du message avant le token",
              example: "Votre code est: "
            },
            hideToken: {
              type: "boolean",
              description: "Masquer le token dans la réponse API",
              example: true
            }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: {
              type: "string",
              description: "Nom d'utilisateur",
              example: "admin"
            },
            password: {
              type: "string",
              description: "Mot de passe",
              example: "securepassword"
            }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.js"], // Chemins des fichiers contenant les commentaires JSDoc
};

export const specs = swaggerJsdoc(options);
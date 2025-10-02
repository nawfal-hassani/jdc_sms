import request from "supertest";
import app from "../src/app.js";
import jwt from "jsonwebtoken";

// Configuration pour les tests
process.env.TEST_MODE = "true";
process.env.JWT_SECRET = "test_secret";
process.env.AUTH_USERNAME = "testuser";
process.env.AUTH_PASSWORD = "testpassword";
process.env.API_KEY = "test_api_key";

describe("Routes API", () => {
  // Token JWT de test
  const testToken = jwt.sign({ id: 1, username: "testuser" }, process.env.JWT_SECRET);
  
  describe("Route Statut", () => {
    it("GET /api/status devrait retourner le statut de l'API", async () => {
      const res = await request(app).get("/api/status");
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("status", "online");
      expect(res.body).toHaveProperty("service");
      expect(res.body).toHaveProperty("version");
      expect(res.body).toHaveProperty("timestamp");
    });
  });
  
  describe("Routes d'authentification", () => {
    it("POST /api/auth/login devrait générer un token JWT avec identifiants valides", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          username: "testuser",
          password: "testpassword"
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("token");
      expect(typeof res.body.token).toBe("string");
    });
    
    it("POST /api/auth/login devrait rejeter des identifiants invalides", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          username: "wronguser",
          password: "wrongpassword"
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("error");
    });
    
    it("POST /api/auth/verify devrait valider un token JWT valide", async () => {
      const res = await request(app)
        .post("/api/auth/verify")
        .send({ token: testToken });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("valid", true);
      expect(res.body).toHaveProperty("user");
    });
    
    it("POST /api/auth/verify devrait rejeter un token JWT invalide", async () => {
      const res = await request(app)
        .post("/api/auth/verify")
        .send({ token: "invalid_token" });
      
      expect(res.statusCode).toEqual(200); // C'est toujours 200 mais valid: false
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("valid", false);
    });
  });
  
  describe("Routes protégées", () => {
    it("POST /api/send-sms devrait être refusé sans authentification", async () => {
      const res = await request(app)
        .post("/api/send-sms")
        .send({
          to: "+33612345678",
          message: "Test message"
        });
      
      expect(res.statusCode).toEqual(401);
    });
    
    it("POST /api/send-sms devrait être accepté avec un token JWT", async () => {
      const res = await request(app)
        .post("/api/send-sms")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          to: "+33612345678",
          message: "Test message"
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
    });
    
    it("POST /api/send-sms devrait être accepté avec une API key", async () => {
      const res = await request(app)
        .post("/api/send-sms")
        .set("X-API-Key", process.env.API_KEY)
        .send({
          to: "+33612345678",
          message: "Test message"
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("success", true);
    });
    
    it("POST /api/send-sms devrait rejeter les paramètres manquants", async () => {
      const res = await request(app)
        .post("/api/send-sms")
        .set("Authorization", `Bearer ${testToken}`)
        .send({
          // Paramètres manquants
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty("success", false);
    });
  });
});
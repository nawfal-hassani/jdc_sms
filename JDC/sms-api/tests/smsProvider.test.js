import { sendSms, getTokenFromApi, sendTokenBySms } from "../src/services/smsProvider.js";

// Mocks pour éviter les appels réseau réels pendant les tests
jest.mock("axios");
jest.mock("twilio", () => {
  return () => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: "test-sid-123",
        status: "sent"
      })
    }
  });
});

// Configuration pour forcer le mode test
process.env.TEST_MODE = "true";

describe("Service SMS Provider", () => {
  
  describe("sendSms", () => {
    it("devrait envoyer un SMS avec succès en mode test", async () => {
      const result = await sendSms("+33612345678", "Test message");
      
      // Vérifier que la fonction retourne un résultat attendu
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.provider).toBe("test-mode");
      expect(result.to).toBe("+33612345678");
      expect(result.message).toBe("Test message");
    });
    
    it("devrait rejeter les numéros de téléphone invalides", async () => {
      await expect(sendSms("invalid", "Test message")).rejects.toThrow("Numéro de téléphone invalide");
      await expect(sendSms(null, "Test message")).rejects.toThrow("Numéro de téléphone invalide");
      await expect(sendSms(123, "Test message")).rejects.toThrow("Numéro de téléphone invalide");
    });
  });
  
  describe("getTokenFromApi", () => {
    it("devrait générer un token en mode test", async () => {
      const token = await getTokenFromApi();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });
  });
  
  describe("sendTokenBySms", () => {
    it("devrait récupérer un token et l'envoyer par SMS", async () => {
      const result = await sendTokenBySms("+33612345678");
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.sms).toBeDefined();
      expect(result.sms.success).toBe(true);
      expect(result.sms.to).toBe("+33612345678");
    });
    
    it("devrait masquer le token si hideToken=true", async () => {
      const result = await sendTokenBySms("+33612345678", { hideToken: true });
      
      expect(result).toBeDefined();
      expect(result.token).toBe("********");
    });
  });
});
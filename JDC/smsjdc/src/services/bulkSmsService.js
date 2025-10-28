/**
 * Service de gestion des envois groupés de SMS avec WebSocket
 * Gère la file d'attente, le traitement asynchrone et les notifications en temps réel
 */

const axios = require('axios');
const EventEmitter = require('events');

class BulkSmsService extends EventEmitter {
  constructor() {
    super();
    this.activeJobs = new Map(); // Map<jobId, JobData>
    this.SMS_API_URL = process.env.SMS_API_URL || 'http://localhost:3000/api';
  }

  /**
   * Créer un nouveau job d'envoi groupé
   * @param {Array} recipients - Liste des destinataires
   * @param {Object} options - Options d'envoi (delay, etc.)
   * @returns {string} - ID du job créé
   */
  createJob(recipients, options = {}) {
    const jobId = this.generateJobId();
    const validRecipients = recipients.filter(r => r.valid);

    const job = {
      id: jobId,
      recipients: validRecipients,
      total: validRecipients.length,
      processed: 0,
      success: 0,
      failed: 0,
      status: 'pending', // pending, running, paused, stopped, completed
      startTime: null,
      endTime: null,
      options: {
        delay: options.delay || 1000,
        retryOnError: options.retryOnError || false,
        maxRetries: options.maxRetries || 3
      },
      results: [],
      errors: []
    };

    this.activeJobs.set(jobId, job);
    return jobId;
  }

  /**
   * Démarrer un job d'envoi groupé
   * @param {string} jobId - ID du job à démarrer
   * @param {Object} io - Instance Socket.IO pour les notifications
   */
  async startJob(jobId, io) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'running') {
      throw new Error(`Job ${jobId} is already running`);
    }

    job.status = 'running';
    job.startTime = new Date();
    
    // Émettre un événement de démarrage
    this.emitJobUpdate(io, jobId, {
      type: 'started',
      message: `Démarrage de l'envoi de ${job.total} SMS`,
      job: this.getJobStatus(jobId)
    });

    // Traiter la file d'attente
    await this.processQueue(jobId, io);
  }

  /**
   * Traiter la file d'attente d'un job
   * @param {string} jobId - ID du job
   * @param {Object} io - Instance Socket.IO
   */
  async processQueue(jobId, io) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) return;

    for (let i = 0; i < job.recipients.length; i++) {
      // Vérifier si le job est en pause ou arrêté
      if (job.status === 'paused') {
        this.emitJobUpdate(io, jobId, {
          type: 'paused',
          message: 'Envoi en pause',
          job: this.getJobStatus(jobId)
        });
        
        // Attendre que le job soit repris
        await this.waitForResume(jobId);
        
        this.emitJobUpdate(io, jobId, {
          type: 'resumed',
          message: 'Envoi repris',
          job: this.getJobStatus(jobId)
        });
      }

      if (job.status === 'stopped') {
        this.emitJobUpdate(io, jobId, {
          type: 'stopped',
          message: 'Envoi arrêté par l\'utilisateur',
          job: this.getJobStatus(jobId)
        });
        break;
      }

      const recipient = job.recipients[i];
      
      try {
        // Émettre un événement de traitement en cours
        this.emitJobUpdate(io, jobId, {
          type: 'processing',
          message: `Envoi vers ${recipient.phone}...`,
          recipient: recipient,
          current: i + 1,
          total: job.total
        });

        // Envoyer le SMS
        const result = await this.sendSms(recipient);

        job.processed++;
        
        if (result.success) {
          job.success++;
          job.results.push({
            ...recipient,
            status: 'success',
            timestamp: new Date()
          });

          this.emitJobUpdate(io, jobId, {
            type: 'success',
            message: `✓ SMS envoyé avec succès vers ${recipient.phone}`,
            recipient: recipient,
            job: this.getJobStatus(jobId)
          });
        } else {
          job.failed++;
          job.results.push({
            ...recipient,
            status: 'failed',
            error: result.error,
            timestamp: new Date()
          });
          job.errors.push({
            recipient: recipient,
            error: result.error,
            timestamp: new Date()
          });

          this.emitJobUpdate(io, jobId, {
            type: 'error',
            message: `✗ Échec de l'envoi vers ${recipient.phone}: ${result.error}`,
            recipient: recipient,
            error: result.error,
            job: this.getJobStatus(jobId)
          });
        }

        // Attendre le délai configuré avant le prochain envoi
        if (i < job.recipients.length - 1) {
          await this.sleep(job.options.delay);
        }

      } catch (error) {
        job.failed++;
        job.processed++;
        job.errors.push({
          recipient: recipient,
          error: error.message,
          timestamp: new Date()
        });

        this.emitJobUpdate(io, jobId, {
          type: 'error',
          message: `✗ Erreur lors de l'envoi vers ${recipient.phone}: ${error.message}`,
          recipient: recipient,
          error: error.message,
          job: this.getJobStatus(jobId)
        });

        // Attendre avant de continuer en cas d'erreur
        await this.sleep(job.options.delay);
      }
    }

    // Terminer le job
    await this.completeJob(jobId, io);
  }

  /**
   * Envoyer un SMS via l'API
   * @param {Object} recipient - Destinataire
   * @returns {Object} - Résultat de l'envoi
   */
  async sendSms(recipient) {
    try {
      const response = await axios.post(`${this.SMS_API_URL}/send-sms`, {
        to: recipient.phone,
        message: recipient.message
      }, {
        timeout: 30000 // 30 secondes de timeout
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: response.data.message || response.data.error || 'Erreur inconnue'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur de connexion à l\'API'
      };
    }
  }

  /**
   * Mettre en pause un job
   * @param {string} jobId - ID du job
   */
  pauseJob(jobId) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== 'running') {
      throw new Error(`Cannot pause job ${jobId}: current status is ${job.status}`);
    }

    job.status = 'paused';
    return this.getJobStatus(jobId);
  }

  /**
   * Reprendre un job en pause
   * @param {string} jobId - ID du job
   */
  resumeJob(jobId) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== 'paused') {
      throw new Error(`Cannot resume job ${jobId}: current status is ${job.status}`);
    }

    job.status = 'running';
    return this.getJobStatus(jobId);
  }

  /**
   * Arrêter un job
   * @param {string} jobId - ID du job
   */
  stopJob(jobId) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'completed' || job.status === 'stopped') {
      throw new Error(`Job ${jobId} is already ${job.status}`);
    }

    job.status = 'stopped';
    job.endTime = new Date();
    return this.getJobStatus(jobId);
  }

  /**
   * Compléter un job
   * @param {string} jobId - ID du job
   * @param {Object} io - Instance Socket.IO
   */
  async completeJob(jobId, io) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) return;

    if (job.status !== 'stopped') {
      job.status = 'completed';
    }
    
    job.endTime = new Date();

    const duration = Math.floor((job.endTime - job.startTime) / 1000);

    this.emitJobUpdate(io, jobId, {
      type: 'completed',
      message: `Envoi terminé: ${job.success} réussi(s), ${job.failed} échec(s)`,
      job: this.getJobStatus(jobId),
      duration: duration
    });

    // Garder le job pendant 1 heure pour consultation
    setTimeout(() => {
      this.activeJobs.delete(jobId);
    }, 3600000);
  }

  /**
   * Obtenir le statut d'un job
   * @param {string} jobId - ID du job
   * @returns {Object} - Statut du job
   */
  getJobStatus(jobId) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      return null;
    }

    const duration = job.endTime 
      ? Math.floor((job.endTime - job.startTime) / 1000)
      : job.startTime 
        ? Math.floor((new Date() - job.startTime) / 1000)
        : 0;

    const progress = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;

    // Estimation du temps restant
    const avgTimePerSms = job.processed > 0 ? duration / job.processed : 0;
    const remaining = job.processed > 0 
      ? Math.floor(avgTimePerSms * (job.total - job.processed))
      : 0;

    return {
      id: job.id,
      status: job.status,
      total: job.total,
      processed: job.processed,
      success: job.success,
      failed: job.failed,
      progress: progress,
      duration: duration,
      remaining: remaining,
      startTime: job.startTime,
      endTime: job.endTime
    };
  }

  /**
   * Obtenir les résultats d'un job
   * @param {string} jobId - ID du job
   * @returns {Object} - Résultats du job
   */
  getJobResults(jobId) {
    const job = this.activeJobs.get(jobId);
    
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      status: this.getJobStatus(jobId),
      results: job.results,
      errors: job.errors
    };
  }

  /**
   * Émettre une mise à jour du job via WebSocket
   * @param {Object} io - Instance Socket.IO
   * @param {string} jobId - ID du job
   * @param {Object} data - Données à émettre
   */
  emitJobUpdate(io, jobId, data) {
    io.to(`job:${jobId}`).emit('bulk-sms-update', {
      jobId: jobId,
      timestamp: new Date(),
      ...data
    });
  }

  /**
   * Attendre que le job soit repris
   * @param {string} jobId - ID du job
   */
  async waitForResume(jobId) {
    const job = this.activeJobs.get(jobId);
    
    while (job && job.status === 'paused') {
      await this.sleep(1000);
    }
  }

  /**
   * Attendre un certain temps
   * @param {number} ms - Millisecondes à attendre
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Générer un ID unique pour un job
   * @returns {string} - ID du job
   */
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtenir tous les jobs actifs
   * @returns {Array} - Liste des jobs actifs
   */
  getAllJobs() {
    const jobs = [];
    
    for (const [jobId, job] of this.activeJobs.entries()) {
      jobs.push(this.getJobStatus(jobId));
    }
    
    return jobs;
  }
}

// Singleton
const bulkSmsService = new BulkSmsService();

module.exports = bulkSmsService;

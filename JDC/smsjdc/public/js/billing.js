/*
  Refactored Billing front-end module
  - Dynamic rendering of packs/subscriptions/invoices
  - Uses correct backend fields (current_balance, low_balance_threshold, etc.)
  - Exposes the same global functions used by HTML (showBillingTab, purchasePack, subscribe, applyPromoCode)
  - Better error handling and loading states
*/

(function(){
  'use strict';

  // API Configuration - billing endpoints are on the dashboard server (same origin)
  const API_URL = window.location.origin; // e.g., http://localhost:3030

  // State
  let currentUser = null;
  let currentPromo = null; // { code, discount }
  let billingPeriod = 'monthly';
  let selectedPack = null;

  // Local promo map (kept in sync with backend example)
  const PROMOS = {
    'BIENVENUE': 10,  // -10%
    'SEB': 5          // -5%
  };

  // Helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  function fmtPrice(v){
    return (typeof v === 'number' ? v : parseFloat(v || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
  function fmtSms(n){
    return (n || 0).toLocaleString('fr-FR') + ' SMS';
  }

  async function fetchJSON(url, opts){
    try{
      const r = await fetch(url, opts);
      const j = await r.json();
      return j;
    }catch(e){
      console.error('fetchJSON error', url, e);
      throw e;
    }
  }

  function showNotice(container, message, type='info'){
    if(!container) return;
    container.innerHTML = `<div class="alert alert-${type}" style="margin-top:10px">${message}</div>`;
  }

  // --- Rendering ---
  function renderPacks(packs){
    const grid = $('#sms-packs-grid');
    if(!grid) return;
    if(!packs || packs.length === 0){
      grid.innerHTML = '<div class="info-card">Aucun pack disponible pour le moment.</div>';
      return;
    }

    const html = packs.map(pack => {
      const popularBadge = pack.popular ? '<div class="badge" style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#667eea;color:#fff;padding:6px 12px;border-radius:16px;font-weight:600">POPULAIRE</div>' : '';
      return `
        <div class="pack-card" data-pack-id="${pack.id}" role="button" style="border:2px solid ${pack.popular ? '#667eea' : '#ddd'};border-radius:8px;padding:18px;position:relative;transition:all .25s;cursor:pointer;">
          ${popularBadge}
          <div style="text-align:center">
            <div style="font-size:30px;font-weight:700">${(pack.quantity||0).toLocaleString('fr-FR')}</div>
            <div style="color:#666;margin:6px 0">SMS</div>
            <div style="font-size:24px;color:#667eea;margin:12px 0;font-weight:700">${fmtPrice(pack.price)}</div>
            <div style="color:#888;font-size:13px">${(pack.price_per_sms||0).toFixed(3)} € / SMS</div>
            ${pack.discount && pack.discount > 0 ? `<div style="margin-top:8px;background:#28a745;color:#fff;padding:4px 10px;border-radius:14px;display:inline-block;font-weight:600">-${pack.discount}%</div>` : ''}
            <div style="margin-top:12px">
              <button class="btn btn-primary select-pack-btn" data-pack-id="${pack.id}">Sélectionner</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = html;
  }

  function renderSubscriptions(subs){
    const grid = $('#subscriptions-grid');
    if(!grid) return;
    if(!subs || subs.length === 0){
      grid.innerHTML = '<div class="info-card">Aucun abonnement disponible.</div>';
      return;
    }

    grid.innerHTML = subs.map(s => {
      const price = billingPeriod === 'monthly' ? s.price_monthly : s.price_yearly;
      const savings = billingPeriod === 'yearly' ? Math.round((1 - (s.price_yearly / (s.price_monthly * 12))) * 100) : 0;
      return `
        <div class="sub-card" style="border:2px solid ${s.popular ? '#667eea' : '#ddd'};border-radius:8px;padding:18px;">
          ${s.popular ? '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:6px 14px;border-radius:20px;font-weight:700">RECOMMANDÉ</div>' : ''}
          <div style="text-align:center">
            <h3 style="margin:8px 0">${s.name}</h3>
            <div style="font-size:28px;color:#667eea;font-weight:700">${price.toFixed(2)}€</div>
            <div style="color:#888;font-size:13px;margin-bottom:10px">${billingPeriod === 'monthly' ? '/ mois' : '/ an'}</div>
            ${s.features ? `<div style="text-align:left;margin-top:12px">${s.features.map(f=>`<div style="padding:6px 0"><i class="fas fa-check" style="color:#28a745;margin-right:8px"></i>${f}</div>`).join('')}</div>` : ''}
            <div style="margin-top:12px">
              <button class="btn ${s.popular ? 'btn-primary' : 'btn-secondary'}" data-plan-id="${s.id}">
                S'abonner
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderInvoices(invoices){
    const tbody = $('#invoices-tbody');
    if(!tbody) return;
    if(!invoices || invoices.length === 0){
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;padding:30px">Aucune facture disponible</td></tr>`;
      return;
    }

    tbody.innerHTML = invoices.map(inv => {
      const statusColors = { 'paid':'#28a745','pending':'#ffc107','failed':'#dc3545' };
      const labels = { 'paid':'Payée','pending':'En attente','failed':'Échouée' };
      const desc = inv.type === 'sms_pack' ? `Pack ${inv.quantity} SMS` : `Abonnement ${inv.plan_id || ''}`;
      return `
        <tr>
          <td><strong>${inv.id}</strong></td>
          <td>${new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
          <td>${desc} ${inv.promo_code ? `<span style="background:#28a745;color:#fff;padding:2px 6px;border-radius:8px;font-size:11px;margin-left:6px">${inv.promo_code}</span>` : ''}</td>
          <td><strong>${(inv.total_ttc||0).toFixed(2)}€</strong></td>
          <td><span style="background:${statusColors[inv.status]||'#999'};color:#fff;padding:6px 10px;border-radius:12px;font-weight:700">${labels[inv.status]||inv.status}</span></td>
          <td><button class="btn btn-secondary download-invoice" data-inv="${inv.id}"><i class="fas fa-download"></i> PDF</button></td>
        </tr>
      `;
    }).join('');
  }

  // --- Actions / API calls ---
  async function loadPacks(){
    const grid = $('#sms-packs-grid');
    if(grid) grid.innerHTML = '<div style="text-align:center;padding:40px;color:#999"><i class="fas fa-spinner fa-spin" style="font-size:32px"></i><div style="margin-top:10px">Chargement des packs...</div></div>';
    try{
      const r = await fetchJSON(`${API_URL}/api/billing/packs`);
      if(r && r.success){ renderPacks(r.data); }
      else if(grid) grid.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des packs</div>';
    }catch(e){ 
      console.error('loadPacks', e); 
      if(grid) grid.innerHTML = '<div class="alert alert-danger">Impossible de charger les packs. Vérifiez votre connexion.</div>';
    }
  }

  async function loadSubscriptions(){
    const grid = $('#subscriptions-grid');
    if(grid) grid.innerHTML = '<div style="text-align:center;padding:40px;color:#999"><i class="fas fa-spinner fa-spin" style="font-size:32px"></i><div style="margin-top:10px">Chargement des abonnements...</div></div>';
    try{
      const r = await fetchJSON(`${API_URL}/api/billing/subscriptions`);
      if(r && r.success) renderSubscriptions(r.data);
      else if(grid) grid.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des abonnements</div>';
    }catch(e){ 
      console.error('loadSubscriptions', e); 
      if(grid) grid.innerHTML = '<div class="alert alert-danger">Impossible de charger les abonnements.</div>';
    }
  }

  async function loadCredits(){
    if(!currentUser) return;
    try{
      const r = await fetchJSON(`${API_URL}/api/billing/credits/${encodeURIComponent(currentUser)}`);
      if(r && r.success){
        const data = r.data;
        const sidebarBalance = $('#sms-balance');
        if(sidebarBalance) sidebarBalance.textContent = (data.current_balance||0).toLocaleString('fr-FR');
        const billingBalance = $('#billing-balance');
        if(billingBalance) billingBalance.textContent = (data.current_balance||0).toLocaleString('fr-FR');
        const subInfo = $('#subscription-info');
        if(subInfo){
          if(data.subscription){
            const end = new Date(data.subscription.next_billing || data.subscription.trial_end || Date.now()).toLocaleDateString('fr-FR');
            subInfo.innerHTML = `<i class="fas fa-crown" style="color:#ffd700"></i> Abonnement ${data.subscription.plan || ''} - Expire le ${end}`;
          } else {
            subInfo.textContent = 'Aucun abonnement actif';
          }
        }
      }
    }catch(e){ console.error('loadCredits', e); }
  }

  async function loadInvoices(){
    if(!currentUser) return;
    const tbody = $('#invoices-tbody');
    if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#999"><i class="fas fa-spinner fa-spin" style="font-size:24px"></i> Chargement...</td></tr>';
    try{
      const r = await fetchJSON(`${API_URL}/api/billing/invoices/${encodeURIComponent(currentUser)}`);
      if(r && r.success) renderInvoices(r.data);
      else if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px"><div class="alert alert-danger">Erreur lors du chargement des factures</div></td></tr>';
    }catch(e){ 
      console.error('loadInvoices', e); 
      if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px"><div class="alert alert-danger">Impossible de charger les factures</div></td></tr>';
    }
  }

  async function doPurchase(packId, promo){
    if(!currentUser) return alert('Utilisateur introuvable');
    try{
      const payload = { email: currentUser, pack_id: packId };
      if(promo && promo.code) payload.promo_code = promo.code;
      const r = await fetchJSON(`${API_URL}/api/billing/purchase`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      return r;
    }catch(e){ throw e; }
  }

  async function doSubscribe(planId, period){
    if(!currentUser) return alert('Utilisateur introuvable');
    try{
      const payload = { email: currentUser, plan_id: planId, billing_cycle: period };
      const r = await fetchJSON(`${API_URL}/api/billing/subscribe`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      return r;
    }catch(e){ throw e; }
  }

  async function saveAlerts(settings){
    if(!currentUser) return alert('Utilisateur introuvable');
    try{
      const r = await fetchJSON(`${API_URL}/api/billing/alert-settings/${encodeURIComponent(currentUser)}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(settings) });
      return r;
    }catch(e){ throw e; }
  }

  // --- UI flows ---
  window.showBillingSubTab = function(tab){
    $$('.billing-subtab-content').forEach(c => c.style.display = 'none');
    $$('.billing-subtab-btn').forEach(b => b.classList.remove('active'));
    const selectedContent = $(`#billing-subtab-${tab}`);
    const selectedBtn = $(`[data-subtab="${tab}"]`);
    if(selectedContent) selectedContent.style.display = 'block';
    if(selectedBtn) selectedBtn.classList.add('active');

    // 🔥 SAUVEGARDER LE SOUS-ONGLET ACTIF
    try {
      localStorage.setItem('jdc_activeBillingSubTab', tab);
      console.log(`✅ Sous-onglet billing sauvegardé: ${tab}`);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du sous-onglet:', error);
    }

    if(tab === 'packs') {
      // Charger les packs Stripe
      if (window.stripePaymentService) {
        const userId = localStorage.getItem('userEmail') || null;
        window.stripePaymentService.displayPacks('sms-packs-grid', userId).catch(console.error);
        window.stripePaymentService.displayCredits('stripe-credits-display', userId).catch(console.error);
      }
    }
    if(tab === 'subscriptions') loadSubscriptions();
    if(tab === 'invoices') loadInvoices();
    if(tab === 'alerts') loadAlertSettings();
  };

  window.showBillingTab = function(){
    if(typeof showTab === 'function') showTab('billing-tab', true);
    else {
      $$('.tab-content').forEach(t => t.style.display = 'none');
      const b = $('#billing-tab'); if(b) b.style.display = 'block';
      $$('.nav-link').forEach(n => n.classList.remove('active'));
      const nav = $(`[data-tab="billing-tab"]`); if(nav) nav.classList.add('active');
    }
    // initBilling will be triggered by the central 'tab-changed' event
  };

  // Select pack (called by UI)
  window.selectPackForPurchase = function(packId){
    console.log('[Billing] selectPackForPurchase:', packId);
    
    // find pack from DOM grid
    const node = document.querySelector(`[data-pack-id="${packId}"]`);
    if(!node){
      // fallback: reload packs and pick
      loadPacks().then(()=>{
        const n2 = document.querySelector(`[data-pack-id="${packId}"]`);
        if(n2) n2.scrollIntoView({behavior:'smooth'});
      });
    }
    
    selectedPack = packId; // store id
    
    // Préremplir l'email avec l'utilisateur connecté
    const emailInput = $('#wizard-email');
    if(emailInput) {
      // Récupérer l'email depuis localStorage si pas déjà défini
      if(!currentUser) {
        currentUser = localStorage.getItem('userEmail') || '';
      }
      if(currentUser) {
        emailInput.value = currentUser;
      }
    }
    
    // Aller directement à l'étape 2 du wizard
    goToWizardStep(2);
  };

  // Wizard helpers (kept globally for index.html usage)
  window.goToWizardStep = function(step){
    console.log('[Billing] goToWizardStep called with step:', step);
    
    // 🔥 S'assurer que l'onglet billing est actif dans la sidebar
    const billingTab = document.getElementById('billing-tab');
    const billingLink = document.querySelector('.nav-link[data-tab="billing-tab"]');
    
    if (billingTab && billingTab.style.display !== 'block') {
      console.log('[Billing] Réaffichage de billing-tab');
      if (typeof window.showTab === 'function') {
        window.showTab('billing-tab', false); // false = pas de re-trigger d'événement
      }
    }
    
    // S'assurer que le lien sidebar est actif
    if (billingLink && !billingLink.classList.contains('active')) {
      document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
      billingLink.classList.add('active');
    }
    
    // Validation de l'étape 2 avant de passer à l'étape 3
    if(step === 3) {
      const emailInput = document.querySelector('#wizard-email');
      console.log('[Billing] Email input element:', emailInput);
      
      const email = emailInput ? emailInput.value.trim() : '';
      console.log('[Billing] Email value:', email);
      
      if(!email) {
        alert('⚠️ Veuillez entrer une adresse email pour continuer');
        return;
      }
      
      // Validation basique de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);
      console.log('[Billing] Email validation:', isValid);
      
      if(!isValid) {
        alert('⚠️ Veuillez entrer une adresse email valide');
        return;
      }
      
      // Mettre à jour currentUser avec l'email du wizard
      currentUser = email;
      console.log('[Billing] currentUser updated to:', currentUser);
    }
    
    // Cacher tous les contenus de wizard
    $$('.wizard-content').forEach(c => c.style.display = 'none');
    
    // Afficher le contenu de l'étape demandée
    const content = $(`#wizard-step-${step}`);
    if(!content) {
      console.error('[Billing] Wizard step not found:', step);
      return;
    }
    content.style.display = 'block';
    
    // Mettre à jour les indicateurs d'étapes
    $$('.wizard-step').forEach((el, idx) => {
      el.classList.remove('active','completed');
      if(idx + 1 < step) el.classList.add('completed');
      if(idx + 1 === step) el.classList.add('active');
    });
    
    // Mettre à jour le récapitulatif si on arrive à l'étape 3 ou 4
    if(step >= 3) updateWizardSummary();
  };

  function updateWizardSummary(){
    if(!selectedPack) return;
    // fetch pack details from server to compute prices
    fetchJSON(`${API_URL}/api/billing/packs`).then(r=>{
      const pack = (r && r.data) ? r.data.find(p=>p.id===selectedPack) : null;
      if(!pack) return;
      const subtotal = pack.price;
      const discountPercent = currentPromo ? currentPromo.discount : 0;
      const discountAmount = subtotal * (discountPercent/100);
      const totalHT = subtotal - discountAmount;
      const tva = totalHT * 0.20;
      const totalTTC = totalHT + tva;

      $('#summary-quantity').textContent = fmtSms(pack.quantity);
      $('#summary-unit-price').textContent = (pack.price_per_sms||0).toFixed(4) + ' €';
      $('#summary-total-ht').textContent = fmtPrice(subtotal);
      const discountLine = $('#summary-discount-line');
      if(discountLine){
        if(discountPercent>0){
          discountLine.style.display = 'flex';
          $('#summary-discount').textContent = `-${discountAmount.toFixed(2)} € (${discountPercent}%)`;
        }else discountLine.style.display = 'none';
      }
      $('#summary-tva').textContent = (tva).toFixed(2) + ' €';
      $('#summary-total-ttc').textContent = totalTTC.toFixed(2) + ' €';
      $('#final-quantity').textContent = fmtSms(pack.quantity);
      $('#final-total').textContent = totalTTC.toFixed(2) + ' € TTC';
    }).catch(e=>console.error(e));
  }

  // Complete purchase
  window.completePurchase = async function(){
    if(!selectedPack) return alert("Sélectionnez d'abord un pack");
    if(!confirm('Confirmer l\'achat ?')) return;
    const btn = event?.target;
    const originalText = btn ? btn.innerHTML : '';
    if(btn){ btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...'; }
    try{
      const res = await doPurchase(selectedPack, currentPromo);
      if(res && res.success){
        alert(`✅ Achat réussi !\n\n${res.data.invoice.quantity} SMS ajoutés\nMontant payé: ${res.data.invoice.total_ttc.toFixed(2)}€\nNouveau solde: ${res.data.new_balance.toLocaleString()} SMS`);
        selectedPack = null; currentPromo = null;
        await loadCredits(); await loadInvoices();
        goToWizardStep(1);
      } else {
        alert('❌ Erreur : ' + (res && res.message ? res.message : 'Erreur inconnue'));
      }
    }catch(e){ console.error(e); alert('❌ Erreur lors de l\'achat. Veuillez réessayer.'); }
    finally{ if(btn){ btn.disabled = false; btn.innerHTML = originalText; } }
  };

  // Apply promo code
  window.applyPromoCode = function(){
    const inputWizard = $('#wizard-promo');
    const inputLegacy = $('#promo-code-input');
    const raw = (inputWizard && inputWizard.value) ? inputWizard.value : (inputLegacy ? inputLegacy.value : '');
    const code = (raw||'').trim().toUpperCase();
    const resultEl = $('#wizard-promo-result') || $('#promo-result');
    if(!code) { showNotice(resultEl, 'Veuillez entrer un code promo', 'danger'); currentPromo=null; return; }
    if(PROMOS[code]){ currentPromo = { code, discount: PROMOS[code] }; showNotice(resultEl, `Code appliqué : -${PROMOS[code]}%`, 'success'); }
    else { currentPromo = null; showNotice(resultEl, 'Code promo invalide', 'danger'); }
    updateWizardSummary();
  };

  // Purchase quick action (button on pack)
  window.purchasePack = async function(packId){
    if(!confirm('Confirmer l\'achat de ce pack ?')) return;
    try{
      const r = await doPurchase(packId, currentPromo);
      if(r && r.success){ 
        alert(`✅ Achat réussi !\n\n${r.data.invoice.quantity} SMS ajoutés\nNouveau solde: ${r.data.new_balance.toLocaleString()} SMS`); 
        await loadCredits(); 
        await loadInvoices(); 
      }
      else alert('❌ Erreur : ' + (r && r.message ? r.message : 'Erreur'));
    }catch(e){ console.error(e); alert('❌ Erreur lors de l\'achat'); }
  };

  // Subscribe
  window.subscribe = async function(planId){
    if(!confirm('Confirmer l\'abonnement ?\n\n✨ 30 jours d\'essai gratuit inclus !\nVous serez redirigé vers le paiement sécurisé Stripe.')) return;
    
    try{
      // Utiliser Stripe au lieu de l'ancienne API
      if (window.stripePaymentService) {
        await window.stripePaymentService.purchaseSubscription(currentUser, planId);
      } else {
        throw new Error('Service Stripe non disponible');
      }
    }catch(e){ 
      console.error(e); 
      
      // Afficher un beau message si Stripe n'est pas configuré
      if (e.message.includes('Stripe n\'est pas configuré') || e.message.includes('pas configuré')) {
        if (window.stripePaymentService) {
          window.stripePaymentService.showStripeNotConfiguredModal();
        } else {
          alert('⚠️ Le système de paiement Stripe est en cours de configuration.\nCette fonctionnalité sera bientôt disponible.');
        }
      } else {
        alert('❌ Erreur lors de la souscription : ' + e.message);
      }
    }
  };

  // Load alert settings into form
  async function loadAlertSettings(){
    if(!currentUser) return;
    try{
      const r = await fetchJSON(`${API_URL}/api/billing/credits/${encodeURIComponent(currentUser)}`);
      if(r && r.success && r.data && r.data.alert_settings){
        const s = r.data.alert_settings;
        const crit = $('#alert-critical'); const norm = $('#alert-normal'); const email = $('#alert-email');
        if(crit) crit.value = s.critical_balance_threshold || s.low_balance_threshold || 10;
        if(norm) norm.value = s.low_balance_threshold || 100;
        if(email) email.checked = !!s.email_notifications;
      }
    }catch(e){ console.error(e); }
  }

  window.saveAlertSettings = async function(){
    const crit = parseInt($('#alert-critical').value||0);
    const norm = parseInt($('#alert-normal').value||0);
    const email = !!$('#alert-email').checked;
    if(crit >= norm) return alert('❌ Le seuil critique doit être inférieur au seuil normal');
    try{
      const r = await saveAlerts({ low_balance_threshold: norm, critical_balance_threshold: crit, email_notifications: email });
      if(r && r.success) alert('✅ Paramètres d\'alerte enregistrés avec succès !'); 
      else alert('❌ Erreur lors de l\'enregistrement');
    }catch(e){ console.error(e); alert('❌ Erreur lors de l\'enregistrement'); }
  };

  // Download invoice placeholder
  window.downloadInvoice = function(inv){ alert(`Téléchargement de la facture ${inv} (à implémenter)`); };

  // --- Event delegation ---
  document.addEventListener('click', function(e){
    // select pack button
    const sel = e.target.closest('.select-pack-btn');
    if(sel){ e.preventDefault(); const id = sel.getAttribute('data-pack-id'); if(id) selectPackForPurchase(id); }
    // direct pack-card click -> select
    const card = e.target.closest('.pack-card');
    if(card && !e.target.closest('button')){ const id = card.getAttribute('data-pack-id'); if(id) selectPackForPurchase(id); }
    // subscribe btn
    const subBtn = e.target.closest('[data-plan-id]');
    if(subBtn && subBtn.getAttribute('data-plan-id')){ const id=subBtn.getAttribute('data-plan-id'); subscribe(id); }
    // download invoice
    const dl = e.target.closest('.download-invoice');
    if(dl){ const id = dl.getAttribute('data-inv'); if(id) downloadInvoice(id); }
    
    // Wizard navigation buttons - handle dynamically to avoid CSP issues with inline onclick
    const wizardBtn = e.target.closest('button[onclick*="goToWizardStep"]');
    if(wizardBtn) {
      e.preventDefault();
      const onclickAttr = wizardBtn.getAttribute('onclick');
      const match = onclickAttr.match(/goToWizardStep\((\d+)\)/);
      if(match) {
        const step = parseInt(match[1]);
        goToWizardStep(step);
      }
    }
    
    // Apply promo code button
    const promoBtn = e.target.closest('button[onclick*="applyPromoCode"]');
    if(promoBtn) {
      e.preventDefault();
      applyPromoCode();
    }
    
    // Complete purchase button
    const purchaseBtn = e.target.closest('button[onclick*="completePurchase"]');
    if(purchaseBtn) {
      e.preventDefault();
      completePurchase();
    }
  });

  // Initialize billing
  async function initBilling(){
    currentUser = localStorage.getItem('userEmail') || null;
    await loadCredits();
    
    // 🔥 INITIALISER STRIPE PAYMENT SERVICE
    if (window.stripePaymentService) {
      try {
        // Afficher les crédits
        await window.stripePaymentService.displayCredits('stripe-credits-display', currentUser);
        
        // Afficher les packs Stripe
        await window.stripePaymentService.displayPacks('sms-packs-grid', currentUser);
        
        console.log('✅ Stripe Payment Service initialisé');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de Stripe:', error);
      }
    } else {
      console.warn('⚠️ Stripe Payment Service non disponible');
    }
    
    // 🔥 RESTAURER LE SOUS-ONGLET SAUVEGARDÉ
    const savedSubTab = localStorage.getItem('jdc_activeBillingSubTab');
    const defaultSubTab = savedSubTab || 'packs';
    
    console.log(`🔄 Restauration du sous-onglet billing: ${defaultSubTab}`);
    window.showBillingSubTab(defaultSubTab);
  }

  // Attach tab activation
  document.addEventListener('DOMContentLoaded', function(){
    // subtabs
    $$('.billing-subtab-btn').forEach(btn=> btn.addEventListener('click', (e)=>{ e.preventDefault(); const t = btn.getAttribute('data-subtab'); window.showBillingSubTab(t); }));
    const billingNav = $(`[data-tab="billing-tab"]`);
    if(billingNav) billingNav.addEventListener('click', initBilling);
    
    // 🔥 ÉCOUTER L'ÉVÉNEMENT DE CHANGEMENT D'ONGLET
    document.addEventListener('tab-changed', function(e) {
      if (e.detail && e.detail.tabId === 'billing-tab') {
        console.log('📢 Événement tab-changed reçu pour billing-tab');
        initBilling();
      }
    });
  });

  // Expose some helpers for dev
  window._billing = { loadPacks, loadSubscriptions, loadCredits, loadInvoices };

})();

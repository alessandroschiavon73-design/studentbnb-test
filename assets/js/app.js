
(() => {
  "use strict";
  const DATA = window.STUDENTBNB_DATA || {listings:[], cities:[]};

  const qs = (s, root=document) => root.querySelector(s);
  const qsa = (s, root=document) => [...root.querySelectorAll(s)];
  const money = n => new Intl.NumberFormat("it-IT", {style:"currency", currency:"EUR", maximumFractionDigits:0}).format(Number(n)||0);

  function getUserListings(){
    try { return JSON.parse(localStorage.getItem("studentbnb_user_listings") || "[]"); }
    catch { return []; }
  }
  function allListings(){ return [...getUserListings(), ...DATA.listings]; }
  function favorites(){
    try { return new Set(JSON.parse(localStorage.getItem("studentbnb_favorites") || "[]")); }
    catch { return new Set(); }
  }
  function saveFavorites(set){ localStorage.setItem("studentbnb_favorites", JSON.stringify([...set])); }

  function toast(message){
    let el = qs("#toast");
    if(!el){
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
  }

  function setupHeader(){
    const menu = qs(".menu-button");
    const nav = qs(".main-nav");
    if(menu && nav){
      menu.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        menu.setAttribute("aria-expanded", String(open));
      });
    }
    qsa("[data-login]").forEach(btn => btn.addEventListener("click", e => {
      e.preventDefault();
      qs("#login-modal")?.classList.add("active");
    }));
    qsa("[data-close-modal]").forEach(btn => btn.addEventListener("click", () => {
      btn.closest(".modal-backdrop")?.classList.remove("active");
    }));
    qsa(".modal-backdrop").forEach(backdrop => backdrop.addEventListener("click", e => {
      if(e.target === backdrop) backdrop.classList.remove("active");
    }));
    const loginForm = qs("#login-form");
    if(loginForm){
      loginForm.addEventListener("submit", e => {
        e.preventDefault();
        const email = new FormData(loginForm).get("email");
        localStorage.setItem("studentbnb_user", String(email));
        qs("#login-modal")?.classList.remove("active");
        updateAccountLabel();
        toast("Accesso demo effettuato");
      });
    }
    updateAccountLabel();
  }

  function updateAccountLabel(){
    const email = localStorage.getItem("studentbnb_user");
    qsa("[data-account-label]").forEach(el => {
      el.textContent = email ? email.split("@")[0] : "Accedi";
    });
  }

  function setupFavorites(){
    qsa("[data-favorite]").forEach(btn => {
      const id = btn.getAttribute("data-favorite");
      const favs = favorites();
      btn.classList.toggle("active", favs.has(id));
      btn.setAttribute("aria-pressed", String(favs.has(id)));
      btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        const set = favorites();
        if(set.has(id)){ set.delete(id); toast("Rimosso dai preferiti"); }
        else { set.add(id); toast("Salvato nei preferiti"); }
        saveFavorites(set);
        qsa(`[data-favorite="${CSS.escape(id)}"]`).forEach(x => {
          x.classList.toggle("active", set.has(id));
          x.setAttribute("aria-pressed", String(set.has(id)));
        });
      });
    });
  }

  function setupHome(){
    const form = qs("#home-search");
    if(form){
      form.addEventListener("submit", e => {
        e.preventDefault();
        const fd = new FormData(form);
        const city = fd.get("city");
        const type = fd.get("type");
        if(city !== "padova"){
          toast("La demo operativa parte da Padova; le altre città saranno attivate progressivamente.");
          return;
        }
        location.href = `padova.html?type=${encodeURIComponent(type || "")}`;
      });
    }
    qsa("[data-city-coming]").forEach(el => el.addEventListener("click", e => {
      e.preventDefault();
      toast(`${el.getAttribute("data-city-coming")} sarà attivata dopo il lancio pilota di Padova.`);
    }));
  }

  function listingCard(l){
    const expenseClass = l.expensesIncluded ? "included" : "excluded";
    const expenseText = l.expensesIncluded ? "● Spese incluse" : `● Spese escluse${l.expenses ? ` (+${money(l.expenses)})` : ""}`;
    const priceClass = l.expensesIncluded ? "" : "expenses-out";
    return `
      <article class="listing-card" data-id="${escapeHtml(l.id)}">
        <a href="annuncio.html?id=${encodeURIComponent(l.id)}" aria-label="Apri ${escapeHtml(l.zone)}">
          <img class="listing-image" src="${escapeHtml(l.image || "assets/img/alloggio-1.webp")}" alt="${escapeHtml(l.type)} a ${escapeHtml(l.zone)}">
        </a>
        <div class="listing-main">
          <div class="listing-title-row">
            <h3><a href="annuncio.html?id=${encodeURIComponent(l.id)}">${escapeHtml(l.zone)}</a></h3>
            <span class="pill">${escapeHtml(l.tag || "offerta trasparente")}</span>
          </div>
          <div class="listing-meta"><span>♙ ${escapeHtml(l.type)}</span><span>${escapeHtml(l.arrangement || "")}</span></div>
          <div class="listing-submeta">
            <span>Disponibile ${escapeHtml(l.available || "da concordare")}</span>
            <span>🚲 ${escapeHtml(l.university || "Università")}: ${escapeHtml(String(l.universityMinutes || "—"))} min</span>
            <span>🚌 Centro: ${escapeHtml(String(l.centerMinutes || "—"))} min</span>
          </div>
        </div>
        <div class="listing-price">
          <div class="price ${priceClass}">${money(l.price)}<small>/mese</small></div>
          <span class="expenses-badge ${expenseClass}">${expenseText}</span>
        </div>
        <div class="listing-actions">
          <button class="favorite-button" type="button" data-favorite="${escapeHtml(l.id)}" aria-label="Aggiungi ai preferiti">♡</button>
          <a href="annuncio.html?id=${encodeURIComponent(l.id)}" aria-label="Apri annuncio">›</a>
        </div>
      </article>`;
  }

  function setupCityPage(){
    const list = qs("#listing-results");
    if(!list) return;
    const controls = {
      zone: qs("#filter-zone"),
      type: qs("#filter-type"),
      price: qs("#filter-price"),
      expenses: qs("#filter-expenses"),
      sort: qs("#filter-sort")
    };
    const params = new URLSearchParams(location.search);
    if(params.get("type") && controls.type){
      const requested = params.get("type");
      const option = [...controls.type.options].find(o => o.value.toLowerCase().includes(requested.toLowerCase()) || requested.toLowerCase().includes(o.value.toLowerCase()));
      if(option) controls.type.value = option.value;
    }
    function render(){
      let items = allListings().filter(l => {
        if(controls.zone?.value && l.zone !== controls.zone.value) return false;
        if(controls.type?.value && l.type !== controls.type.value) return false;
        if(controls.price?.value && Number(l.price) > Number(controls.price.value)) return false;
        if(controls.expenses?.value === "included" && !l.expensesIncluded) return false;
        if(controls.expenses?.value === "excluded" && l.expensesIncluded) return false;
        return true;
      });
      const sort = controls.sort?.value;
      if(sort === "price-asc") items.sort((a,b) => a.price-b.price);
      if(sort === "price-desc") items.sort((a,b) => b.price-a.price);
      if(sort === "zone") items.sort((a,b) => a.zone.localeCompare(b.zone,"it"));
      list.innerHTML = items.length ? items.map(listingCard).join("") : `<div class="empty-state"><h3>Nessun annuncio con questi filtri</h3><p>Prova ad ampliare la zona, il prezzo o la tipologia.</p></div>`;
      qs("#result-count").textContent = `${items.length} ${items.length === 1 ? "offerta trovata" : "offerte trovate"} nella demo`;
      setupFavorites();
    }
    Object.values(controls).filter(Boolean).forEach(c => c.addEventListener("change", render));
    render();
  }

  function getListingById(id){
    return allListings().find(x => String(x.id) === String(id)) || DATA.listings[0];
  }

  function setupDetail(){
    const root = qs("#detail-root");
    if(!root) return;
    const id = new URLSearchParams(location.search).get("id") || DATA.listings[0]?.id;
    const l = getListingById(id);
    document.title = `${l.type} in ${l.zone} | StudentBnB`;
    const gallery = (l.gallery && l.gallery.length ? l.gallery : [l.image]).slice(0,4);
    while(gallery.length < 4) gallery.push(gallery[gallery.length-1] || "assets/img/alloggio-1.webp");
    root.innerHTML = detailTemplate(l, gallery);
    qsa(".thumb", root).forEach(btn => btn.addEventListener("click", () => {
      qs("#main-photo", root).src = btn.dataset.src;
    }));
    setupFavorites();
  }

  function detailTemplate(l, gallery){
    const billList = (l.bills || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const rules = (l.rules || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const nearby = (l.nearby || []).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
    const email = encodeURIComponent(l.email || "info@studentbnb.it");
    const wa = (l.whatsapp || "").replace(/\D/g,"");
    const phone = (l.phone || "").replace(/\s/g,"");
    const expenseText = l.expensesIncluded ? "Spese incluse" : `Spese escluse${l.expenses ? `: circa ${money(l.expenses)}/mese` : ""}`;
    const agency = l.publisher === "Agenzia" ? `<dt>Costo agenzia</dt><dd>${escapeHtml(l.agencyFee || "Da dichiarare")}</dd>` : "";
    return `
      <div class="detail-title-row">
        <div>
          <h1>${escapeHtml(l.type)} in ${escapeHtml(l.zone)} <span class="pill">${escapeHtml(l.tag || "")}</span></h1>
          <div class="top-meta"><span>♙ ${escapeHtml(l.type)}</span><span>⌂ ${escapeHtml(l.arrangement || "")}</span><span>▣ Disponibile ${escapeHtml(l.available || "")}</span></div>
        </div>
        <div class="detail-price"><div class="price">${money(l.price)}<small>/mese</small></div><span class="expenses-badge ${l.expensesIncluded?"included":"excluded"}">${expenseText}</span></div>
        <button class="favorite-button" data-favorite="${escapeHtml(l.id)}" aria-label="Aggiungi ai preferiti">♡</button>
      </div>

      <div class="gallery-contact">
        <div class="gallery">
          <img id="main-photo" class="main-photo" src="${escapeHtml(gallery[0])}" alt="${escapeHtml(l.type)} a ${escapeHtml(l.zone)}">
          <div class="thumbs">
            ${gallery.slice(1).map((src,i)=>`<button class="thumb" data-src="${escapeHtml(src)}" aria-label="Apri foto ${i+2}"><img src="${escapeHtml(src)}" alt=""></button>`).join("")}
          </div>
        </div>
        <aside class="contact-card">
          <h2>Contatta ${l.publisher === "Agenzia" ? "l’agenzia" : "l’inserzionista"}</h2>
          <p>Fai domande sui costi, sul contratto e sulla disponibilità prima di fissare la visita.</p>
          <div class="contact-stack">
            ${wa ? `<a class="btn btn-green btn-block" href="https://wa.me/${wa}?text=${encodeURIComponent("Buongiorno, vi contatto per l’annuncio StudentBnB "+l.id)}" target="_blank" rel="noopener">◉ Contatta su WhatsApp</a>` : ""}
            <a class="btn btn-blue btn-block" href="mailto:${email}?subject=${encodeURIComponent("Richiesta informazioni annuncio "+l.id)}">✉ Invia un’email</a>
            ${phone ? `<a class="btn btn-white btn-block" href="tel:${phone}">☎ Chiama: ${escapeHtml(l.phone)}</a>` : ""}
          </div>
          <div class="safety-box"><strong>Affitta in sicurezza</strong><br>Non inviare denaro prima di aver verificato l’alloggio, il contratto e l’identità dell’inserzionista.</div>
        </aside>
      </div>

      <div class="distance-strip">
        <div class="distance-item"><b>🚲</b><span>Università ${escapeHtml(l.university || "")}<strong>${escapeHtml(String(l.universityMinutes || "—"))} min</strong></span></div>
        <div class="distance-item"><b>🚌</b><span>Centro città<strong>${escapeHtml(String(l.centerMinutes || "—"))} min</strong></span></div>
        <div class="distance-item"><b>🚶</b><span>Stazione dei treni<strong>5 min</strong></span></div>
        <div class="distance-item"><b>🛒</b><span>Supermercato<strong>3 min</strong></span></div>
        <div class="distance-item"><b>🚏</b><span>Fermata bus<strong>2 min</strong></span></div>
      </div>

      <div class="detail-grid">
        <section class="info-card">
          <h2>Dettagli dell’offerta</h2>
          <dl class="definition-list">
            <dt>Tipologia</dt><dd>${escapeHtml(l.type)}</dd>
            <dt>Superficie stanza</dt><dd>${escapeHtml(String(l.surface || "—"))} m²</dd>
            <dt>Superficie alloggio</dt><dd>${escapeHtml(String(l.apartmentSurface || "—"))} m²</dd>
            <dt>Coinquilini</dt><dd>${escapeHtml(String(l.roommates ?? "—"))}</dd>
            <dt>Piano</dt><dd>${escapeHtml(l.floor || "—")}</dd>
            <dt>Riscaldamento</dt><dd>${escapeHtml(l.heating || "—")}</dd>
            <dt>Aria condizionata</dt><dd>${escapeHtml(l.airConditioning || "—")}</dd>
            <dt>Wi‑Fi</dt><dd>${escapeHtml(l.wifi || "—")}</dd>
            <dt>Animali</dt><dd>${escapeHtml(l.pets || "—")}</dd>
            <dt>Fumatori</dt><dd>${escapeHtml(l.smokers || "—")}</dd>
            <dt>Contratto</dt><dd>${escapeHtml(l.contract || "—")}</dd>
            ${agency}
          </dl>
        </section>
        <section class="info-card"><h2>Cosa è incluso</h2><ul class="check-list">${billList || "<li>Informazioni da confermare</li>"}</ul></section>
        <div>
          <section class="info-card cost-card"><h2>Canone</h2><div class="price">${money(l.price)}<small>/mese</small></div><strong>${expenseText}</strong></section>
          <section class="info-card cost-card" style="margin-top:16px"><h2>Deposito cauzionale</h2><strong style="font-size:24px">${money(l.deposit)}</strong><br><span>${l.deposit && l.price ? (l.deposit/l.price).toFixed(0)+" mensilità" : "Da definire"}</span></section>
        </div>
      </div>

      <div class="description-grid">
        <section class="info-card">
          <h2>Descrizione</h2><p>${escapeHtml(l.description || "")}</p>
          <div class="description-columns">
            <div><h3>Regole della casa</h3><ul class="bullet-list">${rules}</ul></div>
            <div><h3>Servizi nelle vicinanze</h3><ul class="bullet-list">${nearby}</ul></div>
          </div>
        </section>
        <section class="info-card map-card"><h2>Dove si trova</h2><img src="assets/img/mappa-arcella.webp" alt="Mappa indicativa della zona"><strong>${escapeHtml(l.zone)}, Padova (PD)</strong><p>La posizione esatta viene condivisa dall’inserzionista prima della visita.</p></section>
      </div>

      <div class="detail-footer-grid">
        <section class="info-card"><h2>▣ Disponibilità</h2><strong>Disponibile ${escapeHtml(l.available || "")}</strong><br><span>Permanenza minima: ${escapeHtml(l.minimumStay || "da concordare")}</span><br><span>Preavviso: ${escapeHtml(l.notice || "da concordare")}</span></section>
        <section class="info-card"><h2>◎ Chi pubblica</h2><strong>${escapeHtml(l.publisher || "Privato")}</strong><br><span>Annuncio pubblicato il ${escapeHtml(l.published || "oggi")}</span><br><span>Ultimo aggiornamento: ${escapeHtml(l.updated || "oggi")}</span></section>
        <section class="info-card"><h2>◇ ID annuncio</h2><strong>#${escapeHtml(l.id)}</strong><br><a href="mailto:segnalazioni@studentbnb.it?subject=${encodeURIComponent("Segnalazione annuncio "+l.id)}" style="color:#1565a8;text-decoration:underline">Segnala annuncio</a></section>
      </div>`;
  }

  function setupPublish(){
    const form = qs("#publish-form");
    if(!form) return;
    const expenseIncluded = qs("#expenses-included");
    const expenseAmountWrap = qs("#expense-amount-wrap");
    const agency = qs("#publisher-type");
    const agencyWrap = qs("#agency-fee-wrap");
    function syncConditional(){
      if(expenseAmountWrap) expenseAmountWrap.classList.toggle("hidden", expenseIncluded?.value !== "no");
      if(agencyWrap) agencyWrap.classList.toggle("hidden", agency?.value !== "Agenzia");
    }
    expenseIncluded?.addEventListener("change",syncConditional);
    agency?.addEventListener("change",syncConditional);
    syncConditional();

    qs("#preview-button")?.addEventListener("click", () => {
      if(!form.reportValidity()) return;
      const l = formToListing(new FormData(form));
      const preview = qs("#publish-preview");
      preview.innerHTML = listingCard(l);
      preview.classList.add("active");
      setupFavorites();
      preview.scrollIntoView({behavior:"smooth",block:"center"});
    });

    form.addEventListener("submit", e => {
      e.preventDefault();
      if(!form.reportValidity()) return;
      const l = formToListing(new FormData(form));
      const saved = getUserListings();
      saved.unshift(l);
      localStorage.setItem("studentbnb_user_listings", JSON.stringify(saved));
      const msg = qs("#publish-success");
      msg.classList.add("active");
      msg.innerHTML = `<strong>Annuncio salvato nella demo.</strong><br>È ora visibile nell’elenco di Padova su questo dispositivo. <a href="padova.html" style="text-decoration:underline">Apri gli annunci</a>.`;
      msg.scrollIntoView({behavior:"smooth",block:"center"});
      form.reset();
      syncConditional();
    });
  }

  function formToListing(fd){
    const id = `PD-DEMO-${Date.now().toString().slice(-6)}`;
    const included = fd.get("expensesIncluded") === "yes";
    return {
      id, zone:fd.get("zone"), tag:fd.get("tag") || "nuovo annuncio", type:fd.get("type"),
      arrangement:fd.get("arrangement"), price:Number(fd.get("price")), expensesIncluded:included,
      expenses:included ? 0 : Number(fd.get("expenses")||0), available:fd.get("available"),
      university:fd.get("university") || "Università", universityMinutes:Number(fd.get("universityMinutes")||0),
      centerMinutes:Number(fd.get("centerMinutes")||0), image:"assets/img/alloggio-1.webp",
      gallery:["assets/img/camera.webp","assets/img/cucina.webp","assets/img/bagno.webp","assets/img/corridoio.webp"],
      surface:Number(fd.get("surface")||0), apartmentSurface:Number(fd.get("apartmentSurface")||0),
      roommates:Number(fd.get("roommates")||0), floor:fd.get("floor"), heating:fd.get("heating"),
      airConditioning:fd.get("airConditioning"), wifi:fd.get("wifi"), pets:fd.get("pets"),
      smokers:fd.get("smokers"), contract:fd.get("contract"), deposit:Number(fd.get("deposit")||0),
      minimumStay:fd.get("minimumStay"), notice:fd.get("notice"),
      bills:fd.getAll("bills"), description:fd.get("description"),
      rules:(fd.get("rules")||"").split("\n").filter(Boolean),
      nearby:(fd.get("nearby")||"").split("\n").filter(Boolean),
      publisher:fd.get("publisherType"), agencyFee:fd.get("agencyFee"), phone:fd.get("phone"),
      email:fd.get("email"), whatsapp:(fd.get("whatsapp")||"").replace(/\D/g,""),
      published:"oggi", updated:"oggi"
    };
  }

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupHeader();
    setupHome();
    setupCityPage();
    setupDetail();
    setupPublish();
    setupFavorites();
  });
})();

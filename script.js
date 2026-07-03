/* ============================================================
   Asiah & Hakim — invitation logic
   Cover unlock · countdown · scroll reveal · RSVP + guestbook
   (localStorage demo — swap store* fns for a real endpoint later)
   ============================================================ */
(function () {
  "use strict";

  var EVENT_DATE = new Date("2026-11-07T11:00:00+08:00");
  var LS_RSVP  = "invite.rsvp.v1";
  var LS_WISH  = "invite.wishes.v1";

  /* ---------- Cover unlock ---------- */
  var body    = document.body;
  var cover   = document.getElementById("cover");
  var openBtn = document.getElementById("openBtn");
  var invite  = document.getElementById("invite");

  function openInvite() {
    cover.classList.add("is-open");
    body.classList.remove("locked");
    invite.setAttribute("aria-hidden", "false");
    // land at the top of the invite content
    window.scrollTo({ top: 0, behavior: "auto" });
    setTimeout(function () { revealInView(); }, 60);
  }
  openBtn.addEventListener("click", openInvite);

  /* ---------- Countdown ---------- */
  var cdEls = {
    days:  document.querySelector('[data-cd="days"]'),
    hours: document.querySelector('[data-cd="hours"]'),
    mins:  document.querySelector('[data-cd="mins"]'),
    secs:  document.querySelector('[data-cd="secs"]')
  };
  var cdMsg  = document.getElementById("countdownMsg");
  var cdWrap = document.getElementById("countdown");

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function tick() {
    var diff = EVENT_DATE.getTime() - Date.now();
    if (diff <= 0) {
      cdWrap.hidden = true;
      cdMsg.hidden = false;
      clearInterval(timer);
      return;
    }
    var s = Math.floor(diff / 1000);
    cdEls.days.textContent  = pad(Math.floor(s / 86400));
    cdEls.hours.textContent = pad(Math.floor(s % 86400 / 3600));
    cdEls.mins.textContent  = pad(Math.floor(s % 3600 / 60));
    cdEls.secs.textContent  = pad(s % 60);
  }
  tick();
  var timer = setInterval(tick, 1000);

  /* ---------- Scroll reveal ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }
  function revealInView() {
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) el.classList.add("is-visible");
    });
  }

  /* ---------- RSVP ---------- */
  var rsvpForm = document.getElementById("rsvpForm");
  var rsvpNote = document.getElementById("rsvpNote");
  var paxField = document.getElementById("paxField");

  rsvpForm.addEventListener("change", function (e) {
    if (e.target.name === "attending") {
      paxField.classList.toggle("is-hidden", e.target.value !== "hadir");
    }
  });

  rsvpForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(rsvpForm);
    var name = (data.get("name") || "").trim();
    var attending = data.get("attending");
    if (!name || !attending) {
      showNote(rsvpNote, "Sila lengkapkan nama dan kehadiran.", true);
      return;
    }
    var entry = {
      name: name,
      attending: attending,
      pax: attending === "hadir" ? Number(data.get("pax")) || 1 : 0,
      at: Date.now()
    };
    saveList(LS_RSVP, entry);
    var msg = attending === "hadir"
      ? "Terima kasih " + name + "! Kehadiran " + entry.pax + " orang telah direkodkan. ❤"
      : "Terima kasih " + name + ". Semoga kita bertemu di lain kesempatan. 🤲";
    showNote(rsvpNote, msg, false);
    rsvpForm.reset();
    paxField.classList.remove("is-hidden");
  });

  /* ---------- Guestbook / Ucapan ---------- */
  var wishForm = document.getElementById("wishForm");
  var wishList = document.getElementById("wishList");

  wishForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(wishForm);
    var name = (data.get("wname") || "").trim();
    var msg  = (data.get("wmsg")  || "").trim();
    if (!name || !msg) return;
    saveList(LS_WISH, { name: name, msg: msg, at: Date.now() });
    wishForm.reset();
    renderWishes();
  });

  function renderWishes() {
    var list = loadList(LS_WISH).sort(function (a, b) { return b.at - a.at; });
    if (!list.length) {
      wishList.innerHTML = '<li class="wishes__empty">Jadilah yang pertama menitipkan doa 🤍</li>';
      return;
    }
    wishList.innerHTML = list.map(function (w) {
      return '<li><p class="wishes__name">' + esc(w.name) +
             '</p><p class="wishes__msg">' + esc(w.msg) + "</p></li>";
    }).join("");
  }

  /* ---------- storage helpers (replace for real backend) ---------- */
  function loadList(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (err) { return []; }
  }
  function saveList(key, entry) {
    var list = loadList(key);
    list.push(entry);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (err) {}
  }

  /* ---------- utils ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function showNote(el, text, isError) {
    el.textContent = text;
    el.hidden = false;
    el.style.color = isError ? "#a33" : "";
    el.style.background = isError ? "rgba(160,40,40,.08)" : "";
    el.style.borderColor = isError ? "rgba(160,40,40,.35)" : "";
  }

  /* init */
  renderWishes();
})();

// getshecurity.com: reservations (no payment, stored in Supabase) and the donation box.
(function () {
  "use strict";
  var SUPABASE = "https://cgihqwekhbyhhadoizeb.supabase.co";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnaWhxd2VraGJ5aGhhZG9pemViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NDU3MzQsImV4cCI6MjEwODQyMTczNH0.jfeNmxsolNk9MHommYBRxAivYRblUr2WH9b4flQ0lzs";
  var GOAL = 1000;
  // PayPal link from the owner, e.g. "https://www.paypal.com/paypalme/NAME". Leave empty until it exists.

  function api(path, body) {
    return fetch(SUPABASE + "/rest/v1/" + path, {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(body || {})
    });
  }

  function showCount() {
    var box = document.getElementById("progress");
    if (!box) return;
    api("rpc/reservation_count").then(function (r) { return r.ok ? r.json() : null; }).then(function (n) {
      if (typeof n !== "number") return;
      box.hidden = false;
      document.getElementById("progressCount").textContent = n.toLocaleString("en-US");
      requestAnimationFrame(function () { document.getElementById("progressBar").style.width = Math.max(2, Math.min(100, n / GOAL * 100)) + "%"; });
    }).catch(function () {});
  }

  function reserve() {
    var form = document.getElementById("reserveForm");
    if (!form) return;
    var msg = document.getElementById("reserveMsg");
    function say(text, ok) { msg.textContent = text; msg.className = "form-msg " + (ok ? "ok" : "err"); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form), email = String(f.get("email") || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say("Please enter a valid email address."); return; }
      if (!f.get("consent")) { say("Please tick the box so we're allowed to email you."); return; }
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true; say("", true);
      api("reservations", { email: email, piece: f.get("piece"), finish: f.get("finish"), country: String(f.get("country") || "").trim().slice(0, 60) || null })
        .then(function (r) {
          if (r.ok || r.status === 409) {
            say(r.status === 409 ? "You already reserved this piece. Thank you!" : "You're on the list. Thank you! We'll email you before anything happens.", true);
            form.reset(); showCount();
          } else say("Something went wrong. Please try again in a minute.");
        })
        .catch(function () { say("No connection. Please try again."); })
        .then(function () { btn.disabled = false; });
    });
  }

  // "Your voice counts": ideas for the app or the jewelry, no name or email
  function wish() {
    var form = document.getElementById("wishForm");
    if (!form) return;
    var msg = document.getElementById("wishMsg");
    function say(text, ok) { msg.textContent = text; msg.className = "form-msg " + (ok ? "ok" : "err"); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form), text = String(f.get("message") || "").trim();
      if (f.get("website")) { say("Thank you! Your idea reached us.", true); form.reset(); return; }
      if (text.length < 3) { say("Write a few words about your idea first."); return; }
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true; say("", true);
      api("wishes", { topic: f.get("topic") || "app", message: text.slice(0, 1000) })
        .then(function (r) {
          if (r.ok) { say("Thank you! Your idea reached us. This is how Shecurity grows.", true); form.reset(); }
          else say("Something went wrong. Please try again in a minute.");
        })
        .catch(function () { say("No connection. Please try again."); })
        .then(function () { btn.disabled = false; });
    });
  }

  // sections drift in as you scroll, the hero phone leans a little toward the pointer
  function motion() {
    if (!window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var sel = ".band .head, .moment, .pillar, .road > li, .piece, .shots, .faq details, .closing, .donate .copy, .give, form.card, .jewel-head, .article-cta, .guide-grid > *";
    var items = Array.prototype.slice.call(document.querySelectorAll(sel));
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (list) {
        list.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      items.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already on screen: leave it be
        var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
        el.style.setProperty("--d", Math.min(sib, 5) * 0.07 + "s");
        el.classList.add("reveal"); io.observe(el);
      });
    }
    var art = document.querySelector(".app-art");
    if (art && window.matchMedia("(hover: hover)").matches) {
      art.classList.add("tilt");
      var parts = art.querySelectorAll("picture, .chip");
      document.querySelector(".hero").addEventListener("pointermove", function (e) {
        var r = art.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
        Array.prototype.forEach.call(parts, function (p, i) { var k = i === 0 ? 8 : -14; p.style.translate = (x * k).toFixed(1) + "px " + (y * k).toFixed(1) + "px"; });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () { showCount(); reserve(); wish(); motion(); });
})();

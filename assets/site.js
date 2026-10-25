// getshecurity.com: reservations (no payment, stored in Supabase) and the donation box.
(function () {
  "use strict";
  var SUPABASE = "https://cgihqwekhbyhhadoizeb.supabase.co";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnaWhxd2VraGJ5aGhhZG9pemViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NDU3MzQsImV4cCI6MjEwODQyMTczNH0.jfeNmxsolNk9MHommYBRxAivYRblUr2WH9b4flQ0lzs";
  var GOAL = 1000;
  // PayPal link from the owner, e.g. "https://www.paypal.com/paypalme/NAME". Leave empty until it exists.
  var PAYPAL = "";

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

  function donate() {
    var box = document.getElementById("give");
    if (!box) return;
    var btn = document.getElementById("donateBtn"), other = document.getElementById("otherAmount"), note = document.getElementById("donateNote");
    var amount = 10;
    function update() {
      if (!PAYPAL) return;
      btn.href = PAYPAL.replace(/\/$/, "") + "/" + amount + "EUR";
      btn.target = "_blank"; btn.rel = "noopener";
      btn.removeAttribute("aria-disabled");
      note.textContent = "Opens PayPal. You can change the amount there too.";
    }
    Array.prototype.forEach.call(box.querySelectorAll("[data-amount]"), function (b) {
      b.addEventListener("click", function () {
        amount = +b.getAttribute("data-amount"); other.value = "";
        Array.prototype.forEach.call(box.querySelectorAll("[data-amount]"), function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        update();
      });
    });
    other.addEventListener("input", function () {
      var v = Math.round(+other.value);
      if (v >= 1) { amount = v; Array.prototype.forEach.call(box.querySelectorAll("[data-amount]"), function (x) { x.setAttribute("aria-pressed", "false"); }); update(); }
    });
    btn.addEventListener("click", function (e) { if (!PAYPAL) e.preventDefault(); });
    if (!PAYPAL) btn.style.opacity = ".55";
    update();
  }

  document.addEventListener("DOMContentLoaded", function () { showCount(); reserve(); donate(); });
})();

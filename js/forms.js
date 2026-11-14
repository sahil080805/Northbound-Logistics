/**
 * forms.js — validation + submission for the Quote and Contact forms.
 *
 * Each field declares its rules in a data attribute, e.g.
 *   <input data-rules="required,email">
 *   <input data-rules="required,min:1">
 *   <input data-rules="required,futuredate">
 * so adding a rule never means touching the form markup logic.
 *
 * Submission is controlled by NB_CONFIG.FORM_MODE (see config.js).
 */
(() => {
  const cfg = window.NB_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Validation rules: return true or an error message ---------- */
  const RULES = {
    required: (v, el) => (el.type === "checkbox" ? el.checked : v.trim() !== "") || (el.type === "checkbox" ? "Please tick this box to continue." : "This field is required."),
    email: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Enter a valid email address (name@example.com).",
    phone: (v) => !v.trim() || /^(\+?91|0)?[6-9]\d{9}$/.test(v.replace(/[\s()-]/g, "")) || "Enter a valid 10-digit Indian mobile number.",
    minlen: (v, el, n) => !v.trim() || v.trim().length >= +n || `Please enter at least ${n} characters.`,
    min: (v, el, n) => v === "" || (!isNaN(v) && +v >= +n) || `Enter a number of ${n} or more.`,
    max: (v, el, n) => v === "" || (!isNaN(v) && +v <= +n) || `Enter a number no greater than ${(+n).toLocaleString("en-IN")}.`,
    futuredate: (v) => {
      if (!v) return true;
      const picked = new Date(v + "T00:00:00");
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return picked >= today || "Pickup date can't be in the past.";
    },
  };

  function check(el) {
    const rules = (el.dataset.rules || "").split(",").map((r) => r.trim()).filter(Boolean);
    const value = el.type === "checkbox" ? String(el.checked) : el.value;
    for (const rule of rules) {
      const [name, arg] = rule.split(":");
      const result = RULES[name]?.(value, el, arg);
      if (result !== true && result !== undefined) return result;
    }
    return "";
  }

  function paint(el, message) {
    const field = el.closest(".field, .check-field");
    const out = field?.querySelector(".field-error");
    field?.classList.toggle("invalid", !!message);
    field?.classList.toggle("valid", !message && el.value.trim() !== "" && el.type !== "checkbox");
    if (out) out.textContent = message;
    el.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateField(el) { const m = check(el); paint(el, m); return !m; }
  function validateForm(form) {
    const fields = $$("[data-rules]", form);
    let firstBad = null;
    fields.forEach((el) => { if (!validateField(el) && !firstBad) firstBad = el; });
    return firstBad;
  }

  /* ---------- Submission ---------- */
  const refId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  async function deliver(form, data) {
    const mode = cfg.FORM_MODE || "demo";
    if (mode === "formspree") {
      if (!cfg.FORM_ENDPOINT) throw new Error("FORM_ENDPOINT is empty in js/config.js");
      const res = await fetch(cfg.FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Formspree responded " + res.status);
    } else if (mode === "netlify") {
      const body = new URLSearchParams({ "form-name": form.getAttribute("name"), ...data }).toString();
      const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      if (!res.ok) throw new Error("Netlify responded " + res.status);
    } else {
      // Demo mode: keep a local copy so you can inspect it in DevTools → Application → Local Storage.
      const key = "nb_submissions";
      const all = JSON.parse(localStorage.getItem(key) || "[]");
      all.unshift({ form: form.getAttribute("name"), ...data, savedAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(all.slice(0, 50)));
      await new Promise((r) => setTimeout(r, 700)); // brief pause so the loading state is visible
    }
  }

  function collect(form) {
    const data = {};
    $$("input, select, textarea", form).forEach((el) => {
      if (!el.name || el.name === "bot-field") return;
      data[el.name] = el.type === "checkbox" ? (el.checked ? "yes" : "no") : el.value.trim();
    });
    return data;
  }

  function wire(form) {
    const banner = $(".form-banner", form.parentElement);
    const success = $(".success-panel", form.parentElement);
    const submit = $("[type=submit]", form);
    const label = submit.innerHTML;

    $$("[data-rules]", form).forEach((el) => {
      el.addEventListener("blur", () => validateField(el));
      el.addEventListener("input", () => { if (el.closest(".invalid")) validateField(el); });
      el.addEventListener("change", () => validateField(el));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      banner?.classList.remove("show");

      const bad = validateForm(form);
      if (bad) {
        banner.textContent = "Please check the highlighted fields.";
        banner.className = "form-banner form-banner--error show";
        bad.focus();
        return;
      }
      // Honeypot: bots fill the hidden field; pretend success and drop the message.
      const trap = $('[name="bot-field"]', form);
      const data = collect(form);
      const ref = refId(form.dataset.refPrefix || "NB");

      submit.disabled = true;
      submit.textContent = "Sending…";
      try {
        if (!trap || !trap.value) await deliver(form, { ...data, reference: ref });
        $(".ref", success).textContent = "Reference: " + ref;
        form.hidden = true;
        $(".form-intro", form.parentElement)?.setAttribute("hidden", "");
        success.classList.add("show");
        success.setAttribute("tabindex", "-1");
        success.focus();
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (err) {
        console.error("Form submission failed:", err);
        banner.innerHTML = `We couldn't send your request. Please try again, or call us on <a href="tel:${(cfg.SUPPORT_PHONE || "").replace(/\s/g, "")}"><b>${cfg.SUPPORT_PHONE || ""}</b></a>.`;
        banner.className = "form-banner form-banner--error show";
      } finally {
        submit.disabled = false;
        submit.innerHTML = label;
      }
    });

    $(".js-reset", success)?.addEventListener("click", () => {
      form.reset();
      $$(".field", form).forEach((f) => f.classList.remove("valid", "invalid"));
      $$(".field-error", form).forEach((f) => (f.textContent = ""));
      success.classList.remove("show");
      form.hidden = false;
      $(".form-intro", form.parentElement)?.removeAttribute("hidden");
      form.dispatchEvent(new Event("nb:reset"));
    });
  }

  $$("form[data-nb-form]").forEach(wire);

  /* ---------- Quote page: prefill + live estimate ---------- */
  const quote = $("#quote-form");
  if (!quote) return;

  // ?service=air pre-selects a service (links from the Services page).
  const wanted = new URLSearchParams(location.search).get("service");
  const serviceEl = $("#service", quote);
  if (wanted && serviceEl && $(`option[value="${CSS.escape(wanted)}"]`, serviceEl)) serviceEl.value = wanted;

  // Earliest pickup date = today.
  const dateEl = $("#pickup", quote);
  if (dateEl) dateEl.min = new Date().toISOString().split("T")[0];

  // Indicative rates (₹ per kg, minimum charge) and distance multipliers.
  const RATES = { road: [14, 1800], air: [62, 4500], sea: [9, 6500], rail: [11, 3200], lastmile: [24, 150], warehousing: null };
  const BANDS = { local: 0.4, regional: 1, national: 1.6, international: 2.4 };
  const out = { value: $("#est-value"), note: $("#est-note"), svc: $("#est-service"), wt: $("#est-weight"), band: $("#est-band") };
  const money = (n) => (Number.isFinite(n) ? "₹" + (Math.round(n / 50) * 50).toLocaleString("en-IN") : "—");

  function estimate() {
    const svc = $("#service", quote).value;
    const band = $("#distance", quote).value;
    const kg = parseFloat($("#weight", quote).value);
    out.svc.textContent = $("#service", quote).selectedOptions[0]?.textContent.replace(/ \(.*\)/, "") || "—";
    out.band.textContent = $("#distance", quote).selectedOptions[0]?.textContent.replace(/ \(.*\)/, "") || "—";
    out.wt.textContent = kg > 0 ? kg.toLocaleString("en-IN") + " kg" : "—";

    if (svc === "warehousing") {
      out.value.textContent = "Custom quote";
      out.note.textContent = "Storage is priced per pallet / sq ft per month — our team will size it for you.";
      return;
    }
    if (!svc || !band || !(kg > 0)) {
      out.value.textContent = "₹ — — —";
      out.note.textContent = "Choose a service, distance and weight to see an indicative price range.";
      return;
    }
    if (band === "international" && !["air", "sea"].includes(svc)) {
      out.value.textContent = "Custom quote";
      out.note.textContent = "International shipments move by air or sea — pick one of those services for an estimate.";
      return;
    }
    const [rate, minimum] = RATES[svc];
    const base = Math.max(minimum, rate * kg * BANDS[band]);
    out.value.textContent = `${money(base * 0.9)} – ${money(base * 1.15)}`;
    out.note.textContent = "Indicative range excluding 18% GST. Your confirmed quote may vary with exact route, cargo and timing.";
  }
  ["service", "distance", "weight"].forEach((id) => $("#" + id, quote).addEventListener("input", estimate));
  quote.addEventListener("nb:reset", estimate);
  estimate();
})();

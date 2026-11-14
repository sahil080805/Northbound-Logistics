/**
 * tracking.js — demo shipment tracking.
 * There is no real backend on a static host, so four sample shipments are
 * defined below. Timestamps are generated relative to "now" so the demo
 * always looks live. Swap `lookup()` for a fetch() to a real API later.
 */
(() => {
  const form = document.getElementById("track-form");
  if (!form) return;
  const $ = (s, r = document) => r.querySelector(s);
  const H = 3600 * 1000;
  const now = Date.now();

  const STEPS = ["Shipment booked", "Picked up", "Departed origin hub", "In transit", "Arrived at destination hub", "Out for delivery", "Delivered"];
  const STEP_NOTE = [
    "Booking confirmed and pickup scheduled.",
    "Collected from the consignor and weighed.",
    "Scanned out of the origin hub.",
    "On the line-haul route to the destination city.",
    "Received and sorted at the destination hub.",
    "With the delivery executive for final delivery.",
    "Delivered and e-POD captured.",
  ];

  // `done` = how many steps are complete; `at` = hours-ago for each completed step.
  const DB = {
    NB1024001: { service: "Road Freight (FTL)", from: "Noida, UP", to: "Pune, MH", weight: "420 kg · 6 pcs", done: 7, at: [96, 90, 84, 70, 22, 8, 2], status: "delivered" },
    NB1024002: { service: "Road Freight (LTL)", from: "Delhi NCR", to: "Bengaluru, KA", weight: "180 kg · 3 pcs", done: 4, at: [40, 34, 28, 20], status: "transit", eta: 22 },
    NB1024003: { service: "Last-Mile Delivery", from: "Gurugram, HR", to: "Noida, UP", weight: "12 kg · 1 pc", done: 6, at: [30, 26, 20, 14, 5, 1], status: "out", eta: 3 },
    NB1024004: { service: "Air Cargo (Express)", from: "Mumbai, MH", to: "Guwahati, AS", weight: "65 kg · 2 pcs", done: 4, at: [26, 22, 18, 12], status: "delayed", eta: 30, issue: "Weather hold at Kolkata hub — rescheduled on the next available flight." },
  };

  const fmt = (ms) => new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
  const BADGE = {
    delivered: ["status--delivered", "Delivered"],
    transit: ["status--transit", "In transit"],
    out: ["status--out", "Out for delivery"],
    delayed: ["status--delayed", "Delayed"],
  };
  const tick = '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>';

  function render(id, s) {
    const [cls, text] = BADGE[s.status];
    const finished = s.status === "delivered";
    const pct = finished ? 100 : Math.round(((s.done - 0.5) / STEPS.length) * 100);
    const etaText = finished ? fmt(now - s.at[6] * H) : fmt(now + s.eta * H);

    const steps = STEPS.map((name, i) => {
      const isDone = i < s.done;
      const current = !finished && i === s.done - 1 && s.status !== "delayed";
      const problem = s.status === "delayed" && i === s.done - 1;
      const klass = problem ? "problem" : current ? "current" : isDone ? "done" : "";
      const when = isDone ? fmt(now - s.at[i] * H) : "Pending";
      const note = problem ? s.issue : STEP_NOTE[i];
      return `<li class="t-step ${klass}">
        <span class="t-dot">${isDone && !current && !problem ? tick : ""}</span>
        <div><h3>${name}</h3><p>${note}</p></div><time>${when}</time></li>`;
    }).join("");

    return `
      <div class="track-head">
        <div><span class="eyebrow">Shipment</span><h2>${id}</h2></div>
        <span class="status ${cls}">${text}</span>
      </div>
      <div class="track-meta">
        <div><span>Service</span><strong>${s.service}</strong></div>
        <div><span>Route</span><strong>${s.from} → ${s.to}</strong></div>
        <div><span>Consignment</span><strong>${s.weight}</strong></div>
        <div><span>${finished ? "Delivered on" : "Estimated delivery"}</span><strong>${etaText}</strong></div>
      </div>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Delivery progress"><i data-pct="${pct}"></i></div>
      <div class="progress-labels"><span>${s.from}</span><span>${pct}% complete</span><span>${s.to}</span></div>
      <ol class="track-timeline" style="list-style:none;padding:0">${steps}</ol>`;
  }

  const input = $("#tracking-id");
  const error = $("#tracking-error");
  const result = $("#track-result");

  function lookup(raw) {
    const id = raw.trim().toUpperCase();
    result.classList.remove("show");
    if (!/^NB\d{7}$/.test(id)) {
      error.textContent = "Enter a valid tracking ID: NB followed by 7 digits (e.g. NB1024002).";
      input.setAttribute("aria-invalid", "true");
      input.closest(".field").classList.add("invalid");
      return;
    }
    input.setAttribute("aria-invalid", "false");
    input.closest(".field").classList.remove("invalid");
    const s = DB[id];
    if (!s) {
      error.textContent = "";
      result.innerHTML = `<div class="form-banner form-banner--error show">We couldn't find <b>${id}</b>. Check the ID on your booking confirmation, or try a sample ID below.</div>`;
      result.classList.add("show");
      return;
    }
    error.textContent = "";
    result.innerHTML = render(id, s);
    result.classList.add("show");
    requestAnimationFrame(() => {
      const bar = result.querySelector(".progress i");
      if (bar) bar.style.width = bar.dataset.pct + "%";
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = input.value;
    history.replaceState(null, "", "?id=" + encodeURIComponent(id.trim().toUpperCase()));
    lookup(id);
  });
  document.querySelectorAll("[data-demo-id]").forEach((chip) =>
    chip.addEventListener("click", () => { input.value = chip.dataset.demoId; form.requestSubmit(); })
  );

  const initial = new URLSearchParams(location.search).get("id");
  if (initial) { input.value = initial; lookup(initial); }
})();

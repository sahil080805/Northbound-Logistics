/**
 * config.js — the only file you need to edit to wire up the forms.
 *
 * FORM_MODE options:
 *   "demo"      Default. Validates, then saves the submission in this browser's
 *               localStorage and shows the success message. Nothing is emailed.
 *               Great for a first deploy / marking / screenshots.
 *   "formspree" Sends submissions to your inbox via https://formspree.io (free tier).
 *               Create a form there, then paste its URL into FORM_ENDPOINT,
 *               e.g. "https://formspree.io/f/abcdwxyz".
 *   "netlify"   Use when hosting on Netlify. Netlify Forms picks the forms up
 *               automatically (they already carry data-netlify="true"). No endpoint needed.
 */
window.NB_CONFIG = {
  FORM_MODE: "demo",
  FORM_ENDPOINT: "",
  SUPPORT_PHONE: "+91 98765 43210"
};

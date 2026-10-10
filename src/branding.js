import {commissioningSchematic} from './design-system.js';
import {brandMark} from './identity.js';

export const wordmarkPeriod = '<span class="wordmark-period" aria-hidden="true">.</span>';

const motionPreference = 'structive-brand-motion';
let paused = false;
try { paused = localStorage.getItem(motionPreference) === 'paused'; } catch {}
document.documentElement.classList.toggle('brand-motion-paused', paused);

export function productBrand() {
  return `<div class="brand"><span class="brand-icon">${brandMark}</span><div><b>Threshold${wordmarkPeriod}</b><small>Powered by Structive</small></div></div>`;
}

export function productBanner() {
  return `<section class="product-banner" aria-label="Threshold, powered by Structive">
    <div class="commissioning-art" aria-hidden="true">${commissioningSchematic}</div>
    <div class="banner-progress-art" aria-hidden="true"><svg viewBox="0 0 900 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path class="banner-progress-track" d="M20 160H205V105H435V55H865"/><path class="banner-progress-coral" d="M20 160H205V105H300"/><path class="banner-progress-sand" d="M300 105H435V55H585"/><path class="banner-progress-green" d="M585 55H865"/><circle cx="205" cy="160" r="5"/><circle cx="435" cy="105" r="5"/><circle cx="700" cy="55" r="5"/></svg></div>
    <div class="product-identity"><div class="product-wordmark">Threshold${wordmarkPeriod}</div><div class="product-category">Commissioning QA/QC &amp; Operational Readiness</div><div class="product-endorsement">Powered by <strong>Structive</strong></div></div>
    <button type="button" class="brand-motion-toggle" data-brand-motion aria-pressed="${paused}" aria-label="${paused?'Play':'Pause'} banner animation"><span aria-hidden="true">${paused?'▶':'Ⅱ'}</span><span class="motion-label">${paused?'Play':'Pause'} motion</span></button>
  </section>`;
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-brand-motion]');
  if (!button) return;
  paused = !paused;
  document.documentElement.classList.toggle('brand-motion-paused', paused);
  try { localStorage.setItem(motionPreference, paused ? 'paused' : 'playing'); } catch {}
  document.querySelectorAll('[data-brand-motion]').forEach(control => {
    control.setAttribute('aria-pressed', String(paused));
    control.setAttribute('aria-label', `${paused?'Play':'Pause'} banner animation`);
    control.innerHTML = `<span aria-hidden="true">${paused?'▶':'Ⅱ'}</span><span class="motion-label">${paused?'Play':'Pause'} motion</span>`;
  });
});

const motionPreference = 'structive-brand-motion';
let paused = false;
try { paused = localStorage.getItem(motionPreference) === 'paused'; } catch {}
document.documentElement.classList.toggle('brand-motion-paused', paused);

const mark = `<span class="threshold-mark" aria-hidden="true"><i></i><i></i><i></i></span>`;

export function productBrand() {
  return `<div class="brand">${mark}<div><b>Threshold</b><small>POWERED BY STRUCTIVE</small></div></div>`;
}

export function productBanner() {
  return `<section class="product-banner" aria-label="Threshold, powered by Structive">
    <div class="threshold-art" aria-hidden="true"><div class="threshold-aura"></div><div class="threshold-horizon"></div><div class="threshold-portal portal-one"></div><div class="threshold-portal portal-two"></div><div class="threshold-portal portal-three"></div><div class="threshold-signal"></div></div>
    <div class="product-identity"><div class="product-category">SITE ACTIVATION &amp; OPERATIONAL READINESS</div><div class="product-wordmark">Threshold<span class="wordmark-period" aria-hidden="true">.</span></div><div class="product-endorsement">POWERED BY <strong>STRUCTIVE</strong><span></span><em>Built for what comes next.</em></div></div>
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

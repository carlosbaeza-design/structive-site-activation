import {commissioningSchematic} from './design-system.js';
import {brandMark} from './identity.js';

export function productBrand() {
  return `<div class="brand"><span class="brand-icon">${brandMark}</span><div><b>Threshold</b><small>Powered by Structive</small></div></div>`;
}

export function productBanner() {
  return `<section class="product-banner" aria-label="Threshold, powered by Structive">
    <div class="commissioning-art" aria-hidden="true">${commissioningSchematic}</div>
    <div class="product-identity"><div class="product-wordmark">Threshold</div><div class="product-endorsement">Powered by <strong>Structive</strong></div></div>
    <div class="product-category">Commissioning QA/QC &amp; Operational Readiness</div>
  </section>`;
}

export const productName='Threshold';
export const brandMark=`<svg viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false"><path d="M5 32V7h23v25M13 32V15h23v17" stroke="currentColor" stroke-width="3"/><path d="M1 33h38" stroke="currentColor" stroke-width="3"/></svg>`;
const paths={
 setup:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
 equipment:'<path d="M4 4h16v16H4zM4 9h16M4 15h16M8 6.5h.01M8 12h.01M8 18h.01"/>',
 schedule:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h4M7 18h8"/>',
 milestones:'<path d="M4 20V4M4 5h13l-3 4 3 4H4M1 21h7"/>',
 tasks:'<path d="m3 6 2 2 4-4M12 6h9M3 13h5M12 13h9M3 20h5M12 20h9"/>',
 capabilities:'<circle cx="12" cy="6" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10 9-3 6m7-6 3 6M8 18h8"/>',
 evidence:'<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h6"/>',
 assurance:'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6zM8 12l3 3 5-6"/>',
 reviews:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8m-8 5 2 2 5-4"/>',
 readiness:'<path d="M3 18V6M8 18v-7M13 18V3M18 18v-4M2 21h20"/>',
 history:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v6l4 2"/>'
};
export const navIcon=id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[id]||paths.setup}</svg>`;
export const architectureMark=`<svg class="architecture-mark" viewBox="0 0 280 160" fill="none" aria-hidden="true" focusable="false"><path d="M16 148V84L112 20l100 66v62M40 148V88l72-48 76 50v58M64 148V94l48-33 52 35v52M88 148v-47l24-17 28 18v46M112 20v128M16 84h196" stroke="currentColor"/><path d="M0 148h246M0 154h246M112 148h156" stroke="currentColor"/><path d="m212 86 42-27M188 90l42-27M164 96l42-27M140 102l42-27" stroke="currentColor"/><path d="M254 59v89M230 63v85M206 69v79M182 75v73" stroke="currentColor"/><path d="M16 148h252" stroke="#ff855c" stroke-width="3"/></svg>`;

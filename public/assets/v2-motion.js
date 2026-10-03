// FrankiFlow V2 presentation enhancements.
// Progressive only: no business logic, form behavior or pricing state is modified.
(() => {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  const selectors = [
    '.hero-copy','.hero-visual','.signal-grid > div','.section-head','.service-card','.calculator-banner',
    '.about-accordion','.faq-grid','.modern-contact','.calc-hero-grid > div','.calc-card','.result-card','.calc-business-card'
  ];

  function init(root=document){
    const nodes=[...root.querySelectorAll(selectors.join(','))].filter(node=>!node.classList.contains('v2-reveal'));
    if(!nodes.length)return;
    document.documentElement.classList.add('v2-motion-ready');
    nodes.forEach((node,index)=>{
      node.classList.add('v2-reveal');
      const groupIndex=index%4;
      if(groupIndex)node.dataset.v2Delay=String(groupIndex);
    });
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },{rootMargin:'0px 0px -7% 0px',threshold:.08});
    requestAnimationFrame(()=>nodes.forEach(node=>observer.observe(node)));
  }

  init(document);
  window.addEventListener('frankiflow:shell-content-mounted',event=>init(document.querySelector('[data-shell-content]:not([hidden])')||document));
})();

(()=>{
  const header=document.querySelector('.site-header:not(.calc-site-header)');
  if(!header)return;
  const menu=header.querySelector('.menu-btn');
  const nav=header.querySelector('.nav-links');
  if(!menu||!nav)return;

  const close=()=>{
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
  };

  menu.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    menu.setAttribute('aria-expanded',String(open));
  });

  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',close));
})();

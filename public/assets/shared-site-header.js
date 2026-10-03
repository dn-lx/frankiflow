const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];

const WHATSAPP_URL='https://wa.link/9knp7y';

function currentLanguage(header){
  const page=header?.dataset.page||'home';
  if(page==='calculator'){
    const saved=localStorage.getItem('frankiflow-lang')||localStorage.getItem('ff-price-lang');
    return saved==='en'?'en':'de';
  }
  if(header?.dataset.lang==='en'||location.pathname.startsWith('/en/'))return 'en';
  return 'de';
}

function labels(lang){
  const en=lang==='en';
  const home=en?'/en/':'/';
  return {
    home:[en?'Home':'Startseite',home,''],
    calculator:['Calculator','/calculator/',''],
    services:[en?'Services':'Leistungen',home+'#leistungen',''],
    about:[en?'About Us':'Über uns',home+'#about',''],
    contact:[en?'Contact':'Kontakt',home+'#kontakt',''],
    faq:['FAQ',home+'#faq',''],
    calcpura:['CalcPura','https://calcpura.frankiflow.de/',en?'Pricing software for service businesses':'Preissoftware für Dienstleistungsunternehmen'],
    stay:['FrankiHolz','https://stay.frankiflow.de/',en?'FrankiFlow accommodation & room booking':'FrankiFlow Unterkunft & Zimmerbuchung']
  };
}

function headerMarkup(lang,page){
  const en=lang==='en';
  const items=labels(lang);
  const navOrder=['home','calculator','services','about','contact','faq','calcpura','stay'];
  const links=navOrder.map(key=>{
    const [label,href,tooltip]=items[key];
    const product=key==='calcpura'||key==='stay';
    const active=(page==='calculator'&&key==='calculator')||(page!=='calculator'&&key==='home');
    const cls=[
      'nav-route',
      product?'nav-product':'',
      key==='calcpura'?'nav-calcpura':'',
      key==='stay'?'nav-frankiholz':'',
      active?'is-active':''
    ].filter(Boolean).join(' ');
    const tooltipAttrs=tooltip?' data-nav-tooltip="'+tooltip+'" aria-label="'+label+' — '+tooltip+'"':'';
    return '<a class="'+cls+'" data-shared-nav="'+key+'" href="'+href+'"'+tooltipAttrs+'>'+label+'</a>';
  }).join('');

  return '<div class="container nav">'+
    '<a aria-label="'+(en?'FrankiFlow homepage':'FrankiFlow Startseite')+'" class="brand" href="'+(en?'/en/':'/')+'"><img alt="FrankiFlow" src="/assets/frankiflow-logo.png"/></a>'+
    '<nav aria-label="'+(en?'Main navigation':'Hauptnavigation')+'" class="nav-links">'+links+'</nav>'+
    '<div class="nav-actions">'+
      '<div aria-label="'+(en?'Language':'Sprache')+'" class="language-switch ff-language-switch">'+
        '<button class="'+(lang==='de'?'active':'')+'" data-lang="de" type="button">DE</button>'+
        '<button class="'+(lang==='en'?'active':'')+'" data-lang="en" type="button">EN</button>'+
      '</div>'+
      '<a aria-label="WhatsApp" class="text-link nav-whatsapp" data-whatsapp href="'+WHATSAPP_URL+'" rel="noopener" target="_blank">WhatsApp</a>'+
      '<button aria-expanded="false" aria-label="'+(en?'Open menu':'Menü öffnen')+'" class="menu-btn" type="button">☰</button>'+
    '</div>'+
  '</div>';
}

function applyHeaderLanguage(header,lang){
  const page=header.dataset.page||'home';
  const items=labels(lang);
  Object.entries(items).forEach(([key,[label,href,tooltip]])=>{
    const link=header.querySelector('[data-shared-nav="'+key+'"]');
    if(!link)return;
    link.textContent=label;
    link.href=href;
    if(tooltip){
      link.dataset.navTooltip=tooltip;
      link.setAttribute('aria-label',label+' — '+tooltip);
    }else{
      delete link.dataset.navTooltip;
      link.removeAttribute('aria-label');
    }
    link.classList.toggle('is-active',(page==='calculator'&&key==='calculator')||(page!=='calculator'&&key==='home'));
  });
  const brand=header.querySelector('.brand');
  if(brand){
    brand.href=lang==='en'?'/en/':'/';
    brand.setAttribute('aria-label',lang==='en'?'FrankiFlow homepage':'FrankiFlow Startseite');
  }
  header.querySelectorAll('.language-switch [data-lang]').forEach(button=>button.classList.toggle('active',button.dataset.lang===lang));
  const menu=header.querySelector('.menu-btn');
  if(menu)menu.setAttribute('aria-label',lang==='en'?'Open menu':'Menü öffnen');
  applyCalculatorFooterLanguage(lang);
}

function applyCalculatorFooterLanguage(lang){
  const footer=document.querySelector('.calc-footer');if(!footer)return;
  const en=lang==='en';
  const description=footer.querySelector('.calc-footer-main p');
  if(description)description.textContent=en?'Building Cleaning & Property Services · Frankfurt am Main & Surroundings':'Gebäudereinigung & Objektbetreuung · Frankfurt am Main & Umgebung';
  const stay=footer.querySelector('a[href="https://stay.frankiflow.de/"]');
  if(stay)stay.textContent=en?'FrankiHolz Accommodation ↗':'FrankiHolz Unterkunft ↗';
  const legal=footer.querySelector('a[href="/impressum/"]');
  if(legal)legal.textContent=en?'Legal notice':'Impressum';
  const privacy=footer.querySelector('a[href="/datenschutz/"]');
  if(privacy)privacy.textContent=en?'Privacy':'Datenschutz';
  const copy=footer.querySelector('.calc-footer-copy');
  if(copy)copy.textContent=en?'© 2026 FrankiFlow. More than cleaning.':'© 2026 FrankiFlow. Mehr als Reinigung.';
}

function bindHeader(header){
  const page=header.dataset.page||'home';
  const nav=header.querySelector('.nav-links');
  const menu=header.querySelector('.menu-btn');

  menu?.addEventListener('click',()=>{
    const open=nav?.classList.toggle('open');
    menu.setAttribute('aria-expanded',String(Boolean(open)));
  });
  nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
    nav.classList.remove('open');
    menu?.setAttribute('aria-expanded','false');
  }));

  header.querySelectorAll('.language-switch [data-lang]').forEach(button=>button.addEventListener('click',()=>{
    const lang=button.dataset.lang==='en'?'en':'de';
    localStorage.setItem('frankiflow-lang',lang);
    localStorage.setItem('ff-price-lang',lang);
    if(page==='calculator'){
      applyHeaderLanguage(header,lang);
      return;
    }
    const target=lang==='en'?'/en/':'/';
    location.assign(target+(location.hash||''));
  }));
}

function mountHeader(header){
  const lang=currentLanguage(header);
  const page=header.dataset.page||'home';
  header.innerHTML=headerMarkup(lang,page);
  bindHeader(header);
  applyCalculatorFooterLanguage(lang);
}

$$('[data-shared-header]').forEach(mountHeader);
window.addEventListener('frankiflow:language',event=>{
  const lang=event.detail?.lang==='en'?'en':'de';
  $$('[data-shared-header]').forEach(header=>applyHeaderLanguage(header,lang));
});

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
    services:[en?'Services':'Leistungen',home+'#leistungen',''],
    about:[en?'About Us':'Über uns',home+'#about',''],
    calculator:[en?'Calculator':'Preisrechner','/calculator/',''],
    calcpura:['CalcPura','https://calcpura.frankiflow.de/',en?'Pricing software for service businesses':'Preissoftware für Dienstleistungsunternehmen'],
    stay:['FrankiHolz','https://stay.frankiflow.de/',en?'FrankiFlow accommodation & room booking':'FrankiFlow Unterkunft & Zimmerbuchung'],
    faq:['FAQ',home+'#faq',''],
    contact:[en?'Contact':'Kontakt',home+'#kontakt','']
  };
}

function headerMarkup(lang,page){
  const en=lang==='en';
  const items=labels(lang);
  const navOrder=['home','services','about','calculator','calcpura','stay','faq','contact'];
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

function footerMarkup(lang){
  const en=lang==='en';
  const home=en?'/en/':'/';
  const services=en
    ?[
      ['Office cleaning','/en/office-cleaning-frankfurt/'],
      ['Home cleaning','/en/home-cleaning-frankfurt/'],
      ['Airbnb & holiday rentals','/en/airbnb-cleaning-frankfurt/'],
      ['Property care','/en/property-care-frankfurt/']
    ]
    :[
      ['Büroreinigung','/bueroreinigung-frankfurt/'],
      ['Wohnungsreinigung','/wohnungsreinigung-frankfurt/'],
      ['Airbnb & Ferienwohnungen','/airbnb-reinigung-frankfurt/'],
      ['Objektbetreuung','/objektbetreuung-frankfurt/']
    ];
  const serviceLinks=services.map(([label,href])=>'<a href="'+href+'">'+label+'</a>').join('');

  return '<div class="container">'+
    '<div class="footer-top">'+
      '<div class="footer-brand"><a class="brand" href="'+home+'"><img alt="FrankiFlow" src="/assets/brand/frankiflow-full-dark-transparent.svg"/></a><p>'+
        (en?'Cleaning &amp; property care<br/>Frankfurt, Nuremberg &amp; surrounding areas':'Gebäudereinigung &amp; Objektbetreuung<br/>Frankfurt am Main, Nürnberg &amp; Umgebung')+
      '</p></div>'+
      '<div class="footer-cta"><span>'+(en?'Get an instant estimate?':'Preis direkt einschätzen?')+'</span><a href="/calculator/">'+(en?'Open Calculator ↗':'Preisrechner öffnen ↗')+'</a></div>'+
    '</div>'+
    '<div class="footer-grid">'+
      '<div><h4>'+(en?'Services':'Leistungen')+'</h4><div class="footer-links">'+serviceLinks+'</div></div>'+
      '<div><h4>FrankiFlow</h4><div class="footer-links">'+
        '<a href="'+home+'#about">'+(en?'About Us':'Über uns')+'</a>'+
        '<a href="'+home+'#kontakt">'+(en?'Request a quote':'Angebot anfragen')+'</a>'+
        '<a class="frankiholz-link" href="https://stay.frankiflow.de/">'+(en?'FrankiHolz Accommodation ↗':'FrankiHolz Unterkunft ↗')+'</a>'+
        '<a data-whatsapp href="'+WHATSAPP_URL+'" rel="noopener" target="_blank">WhatsApp</a>'+
      '</div></div>'+
      '<div><h4>'+(en?'Contact & legal':'Kontakt & Rechtliches')+'</h4><div class="footer-links">'+
        '<a href="tel:+4917662493041">+49 176 62493041</a>'+
        '<a data-mail href="mailto:info@frankiflow.de">info@frankiflow.de</a>'+
        '<a href="/impressum/">'+(en?'Legal notice':'Impressum')+'</a>'+
        '<a href="/datenschutz/">'+(en?'Privacy':'Datenschutz')+'</a>'+'<span class="footer-company-id">'+(en?'Business no. 4323852':'Betriebsnummer 4323852')+'</span>'+
      '</div></div>'+
    '</div>'+
    '<div class="copyright"><span>'+(en?'© 2026 FrankiFlow. More than cleaning.':'© 2026 FrankiFlow. Mehr als Reinigung.')+'</span><span>'+(en?'Frankfurt · Nuremberg':'Frankfurt am Main · Nürnberg')+'</span></div>'+
  '</div>';
}

function renderSharedFooters(lang){
  $$('[data-shared-footer]').forEach(footer=>{footer.innerHTML=footerMarkup(lang);});
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
  renderSharedFooters(lang);
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
  renderSharedFooters(lang);
}

$$('[data-shared-header]').forEach(mountHeader);
if(!$('[data-shared-header]'))renderSharedFooters(document.documentElement.lang==='en'?'en':'de');
window.addEventListener('frankiflow:language',event=>{
  const lang=event.detail?.lang==='en'?'en':'de';
  $$('[data-shared-header]').forEach(header=>applyHeaderLanguage(header,lang));
  renderSharedFooters(lang);
});

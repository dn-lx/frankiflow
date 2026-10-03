(() => {
  const SHELL_SELECTOR='[data-shell-content]';
  const HEADER_SELECTOR='[data-shared-header]';
  const FOOTER_SELECTOR='[data-shared-footer]';
  const currentContent=()=>document.querySelector(SHELL_SELECTOR+':not([hidden])')||document.querySelector(SHELL_SELECTOR);
  const routeKind=pathname=>/^\/calculator\/?$/.test(pathname)?'calculator':((pathname==='/'||pathname==='/en/'||pathname==='/en')?'home':null);
  const pageLang=pathname=>pathname.startsWith('/en')?'en':(localStorage.getItem('frankiflow-lang')==='en'?'en':'de');
  const cache=new Map();

  function routeKey(url){
    const kind=routeKind(url.pathname);
    if(!kind)return null;
    return kind==='home'?'home:'+pageLang(url.pathname):'calculator';
  }

  function setActiveRoute(kind,lang){
    const header=document.querySelector(HEADER_SELECTOR);
    if(!header)return;
    header.dataset.page=kind;
    header.querySelectorAll('[data-shared-nav]').forEach(link=>{
      const key=link.dataset.sharedNav;
      link.classList.toggle('is-active',(kind==='calculator'&&key==='calculator')||(kind==='home'&&key==='home'));
    });
    if(kind==='home'){
      const home=lang==='en'?'/en/':'/';
      const brand=header.querySelector('.brand');
      if(brand)brand.href=home;
      const homeLink=header.querySelector('[data-shared-nav="home"]');
      if(homeLink)homeLink.href=home;
      for(const [key,hash] of [['services','#leistungen'],['about','#about'],['faq','#faq'],['contact','#kontakt']]){
        const link=header.querySelector('[data-shared-nav="'+key+'"]');
        if(link)link.href=home+hash;
      }
    }
  }

  function copyMeta(doc){
    const title=doc.querySelector('title')?.textContent;
    if(title)document.title=title;
    for(const selector of ['meta[name="description"]','link[rel="canonical"]']){
      const source=doc.querySelector(selector),target=document.querySelector(selector);
      if(source&&target){
        if(source.tagName==='META')target.setAttribute('content',source.getAttribute('content')||'');
        else target.setAttribute('href',source.getAttribute('href')||'');
      }
    }
  }

  async function ensureStyles(doc){
    const hrefs=[...doc.querySelectorAll('link[rel="stylesheet"][href]')].map(x=>x.getAttribute('href')).filter(Boolean);
    for(const href of hrefs){
      const absolute=new URL(href,location.origin).href;
      if([...document.styleSheets].some(s=>s.href===absolute)||document.querySelector('link[data-shell-style="'+CSS.escape(href)+'"]'))continue;
      await new Promise(resolve=>{
        const link=document.createElement('link');
        link.rel='stylesheet';link.href=href;link.dataset.shellStyle=href;
        link.onload=resolve;link.onerror=resolve;document.head.append(link);
      });
    }
  }

  function loadScript(src,type,defer){
    return new Promise(resolve=>{
      const existing=[...document.scripts].find(s=>new URL(s.src||'',location.href).pathname===new URL(src,location.href).pathname);
      if(existing){resolve();return;}
      const script=document.createElement('script');
      script.src=src;
      if(type)script.type=type;
      if(defer)script.defer=true;
      script.onload=resolve;script.onerror=resolve;
      document.body.append(script);
    });
  }

  async function ensureControllers(doc,kind){
    const scripts=[...doc.querySelectorAll('script[src]')]
      .map(s=>({src:s.getAttribute('src'),type:s.getAttribute('type')||'',defer:s.hasAttribute('defer')}))
      .filter(x=>x.src&&!/shared-site-header|shared-shell-router/.test(x.src));
    for(const script of scripts){
      if(script.src.includes('v2-motion.js'))continue;
      await loadScript(script.src,script.type,script.defer);
    }
    window.dispatchEvent(new CustomEvent('frankiflow:shell-content-mounted',{detail:{kind}}));
  }

  function showOnly(content){
    document.querySelectorAll(SHELL_SELECTOR).forEach(node=>{
      const active=node===content;
      node.hidden=!active;
      node.setAttribute('aria-hidden',String(!active));
    });
  }

  async function mount(url,{push=true}={}){
    const key=routeKey(url);
    if(!key)return false;
    const kind=routeKind(url.pathname);
    const lang=pageLang(url.pathname);
    const current=currentContent();
    const currentKey=current?.dataset.shellKey||routeKey(new URL(location.href));
    if(current&&currentKey&&!cache.has(currentKey)){
      current.dataset.shellKey=currentKey;
      cache.set(currentKey,{content:current,title:document.title});
    }

    let entry=cache.get(key);
    if(!entry){
      const response=await fetch(url.pathname+url.search,{headers:{'X-FrankiFlow-Shell':'1'}});
      if(!response.ok)return false;
      const html=await response.text();
      const doc=new DOMParser().parseFromString(html,'text/html');
      const source=doc.querySelector(SHELL_SELECTOR);
      if(!source)return false;
      await ensureStyles(doc);
      const content=document.importNode(source,true);
      content.dataset.shellKey=key;
      content.hidden=true;
      const footer=document.querySelector(FOOTER_SELECTOR);
      footer?.parentNode?.insertBefore(content,footer);
      entry={content,title:doc.title,doc};
      cache.set(key,entry);
      showOnly(content);
      document.body.classList.toggle('calculator-body',kind==='calculator');
      await ensureControllers(doc,kind);
    }else{
      showOnly(entry.content);
      document.body.classList.toggle('calculator-body',kind==='calculator');
    }

    if(entry.doc)copyMeta(entry.doc);
    else if(entry.title)document.title=entry.title;
    setActiveRoute(kind,lang);
    document.documentElement.lang=lang;
    localStorage.setItem('frankiflow-lang',lang);
    localStorage.setItem('ff-price-lang',lang);
    if(push)history.pushState({frankiflowShell:true},'',url.pathname+url.search+url.hash);
    window.scrollTo({top:0,left:0,behavior:'auto'});
    if(url.hash){
      requestAnimationFrame(()=>entry.content.querySelector(url.hash)?.scrollIntoView({block:'start'}));
    }
    return true;
  }

  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest?.('a[href]');
    if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
    let url;try{url=new URL(link.href,location.href)}catch{return}
    if(url.origin!==location.origin||!routeKind(url.pathname))return;
    const currentKind=routeKind(location.pathname);
    const targetKind=routeKind(url.pathname);
    if(currentKind===targetKind&&url.pathname===location.pathname&&url.hash)return;
    event.preventDefault();
    mount(url).catch(()=>location.assign(url.href));
  },true);

  window.addEventListener('popstate',()=>mount(new URL(location.href),{push:false}).catch(()=>location.reload()));

  const initial=currentContent();
  if(initial){
    const key=routeKey(new URL(location.href));
    initial.dataset.shellKey=key||'initial';
    initial.setAttribute('aria-hidden','false');
    cache.set(initial.dataset.shellKey,{content:initial,title:document.title});
    setActiveRoute(routeKind(location.pathname)||'home',pageLang(location.pathname));
  }
})();
function installWhatsAppNavIcon(){
  if(!document.getElementById('ff-whatsapp-nav-icon-style')){
    const style=document.createElement('style');
    style.id='ff-whatsapp-nav-icon-style';
    style.textContent=`
      .site-header .nav-whatsapp.ff-whatsapp-icon-only{
        width:38px;height:38px;min-width:38px;padding:0;
        display:inline-grid;place-items:center;
        border-radius:50%;color:#18b85a;
        text-decoration:none;line-height:1;
        transition:transform .18s ease,background .18s ease,color .18s ease;
      }
      .site-header .nav-whatsapp.ff-whatsapp-icon-only:hover{
        color:#109b4a;background:rgba(24,184,90,.09);transform:translateY(-1px);
      }
      .site-header .nav-whatsapp.ff-whatsapp-icon-only svg{
        width:22px;height:22px;display:block;fill:currentColor;
      }
      .site-header .nav-whatsapp.ff-whatsapp-icon-only:focus-visible{
        outline:3px solid rgba(24,184,90,.22);outline-offset:2px;
      }
    `;
    document.head.append(style);
  }

  document.querySelectorAll('.nav-whatsapp').forEach(link=>{
    link.classList.add('ff-whatsapp-icon-only');
    link.setAttribute('aria-label','WhatsApp');
    link.setAttribute('title','WhatsApp');
    link.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16.04 3.2A12.7 12.7 0 0 0 5.13 22.4L3.2 28.8l6.57-1.86A12.8 12.8 0 1 0 16.04 3.2Zm0 2.56a10.22 10.22 0 1 1-5.23 18.98l-.5-.3-3.9 1.1 1.14-3.8-.33-.52A10.2 10.2 0 0 1 16.04 5.76Zm-5.02 4.32c-.27 0-.7.1-1.07.5-.37.4-1.4 1.37-1.4 3.35 0 1.97 1.44 3.88 1.64 4.15.2.27 2.82 4.3 6.84 6.03.96.41 1.7.66 2.29.84.96.3 1.83.26 2.52.16.77-.11 2.36-.97 2.7-1.9.33-.93.33-1.73.23-1.9-.1-.16-.37-.26-.77-.46-.4-.2-2.36-1.17-2.72-1.3-.37-.14-.64-.2-.9.2-.27.4-1.04 1.3-1.27 1.57-.24.27-.47.3-.87.1-.4-.2-1.68-.62-3.2-1.98-1.18-1.05-1.98-2.35-2.21-2.75-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.7.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.7-.1-.2-.9-2.18-1.24-2.98-.32-.78-.66-.68-.9-.69h-.78Z"/></svg>';
  });
}

installWhatsAppNavIcon();
window.addEventListener('frankiflow:language',installWhatsAppNavIcon);

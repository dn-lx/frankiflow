from pathlib import Path

path = Path('public/preisrechner/index.html')
text = path.read_text(encoding='utf-8')

style_old = '<link href="/assets/calculator.css?v=20260914-v3" rel="stylesheet"/>'
style_new = style_old + '\n<link href="/assets/calculator-site-header.css?v=20260916-v1" rel="stylesheet"/>'
if 'calculator-site-header.css' not in text:
    if style_old not in text:
        raise SystemExit('calculator stylesheet marker not found')
    text = text.replace(style_old, style_new, 1)

old_header = '''<header class="calc-header">
<div class="calc-container calc-nav">
<a aria-label="FrankiFlow Startseite" class="calc-brand" href="/"><img alt="FrankiFlow" src="/assets/frankiflow-logo.png"/></a>
<div class="calc-nav-actions">
<a class="calc-back" href="/">← <span data-i18n="website">Zur Website</span></a>
<div aria-label="Sprache" class="language-switch">
<button class="active" data-lang="de" type="button">DE</button><button data-lang="en" type="button">EN</button>
</div>
</div>
</div>
</header>'''

new_header = '''<header class="site-header calc-site-header">
<div class="calc-container nav">
<a aria-label="FrankiFlow Startseite" class="brand" href="/"><img alt="FrankiFlow" src="/assets/frankiflow-logo.png"/></a>
<nav aria-label="Hauptnavigation" class="nav-links">
<a data-calc-nav="services" href="/#leistungen">Leistungen</a>
<a data-calc-nav="about" href="/#about">Über uns</a>
<a data-calc-nav="contact" href="/#kontakt">Kontakt</a>
<a data-calc-nav="faq" href="/#faq">FAQ</a>
<a class="nav-accommodations" data-calc-nav="stay" href="https://stay.frankiflow.de/">Unterkunft</a>
</nav>
<div class="nav-actions">
<div aria-label="Sprache" class="language-switch">
<button class="active" data-lang="de" type="button">DE</button><button data-lang="en" type="button">EN</button>
</div>
<a class="text-link nav-whatsapp" data-whatsapp="" href="https://wa.link/9knp7y" rel="noopener" target="_blank">WhatsApp</a>
<a class="btn btn-primary calc-nav-price" href="/preisrechner/">Preis berechnen <span aria-hidden="true">↗</span></a>
<button aria-expanded="false" aria-label="Menü öffnen" class="menu-btn" type="button">☰</button>
</div>
</div>
</header>'''

if '<header class="calc-header">' in text:
    if old_header not in text:
        raise SystemExit('old calculator header block did not match expected source')
    text = text.replace(old_header, new_header, 1)
elif 'class="site-header calc-site-header"' not in text:
    raise SystemExit('neither old nor new calculator header found')

script_old = '<script src="/assets/calculator-app-v3.js?v=20260914-v3" type="module"></script>'
script_new = '<script src="/assets/calculator-site-header.js?v=20260916-v1" type="module"></script>\n' + script_old
if 'calculator-site-header.js' not in text:
    if script_old not in text:
        raise SystemExit('calculator app script marker not found')
    text = text.replace(script_old, script_new, 1)

path.write_text(text, encoding='utf-8')

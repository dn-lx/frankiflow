export * from './site-i18n-base.js';
import { translations } from './site-i18n-base.js';

/* Remove legacy payment-provider copy from the active translation catalogue. */
for(const [key,value] of Object.entries(translations)){
  if(/stripe|zahlung|payment|checkout|paid links|bezahlte links/i.test(`${key} ${value}`)) delete translations[key];
}

/* Extra pairs cover dynamic/short labels that previously leaked untranslated keywords. */
Object.assign(translations,{
  'Neukunde':'new-customer',
  'Neukunden':'new customers',
  'Neukundenangebot':'new-customer offer',
  'Neukundenangebot aktiv':'New-customer offer enabled',
  'Neukundenrabatt':'new-customer discount',
  'Foto-Zielseite':'Photo target page',
  'Startseite – Galerie':'Homepage – gallery',
  'Startseite – Hero':'Homepage – hero',
  'Grundreinigungsseite':'Deep-cleaning page',
  'Objektbetreuungsseite':'Property-care page',
  'Website-Texte & Übersetzungen':'Website copy & translations',
  'Deutsch':'German',
  'Englisch':'English',
  'Text suchen':'Search copy',
  'Alle Übersetzungen speichern':'Save all translations',
  'Hero-Titelgröße':'Hero title size',
  'Website, Fotos, Preise und Anfragen verwalten.':'Manage website, photos, pricing and enquiries.',
  'Diese Website verarbeitet personenbezogene Daten nur soweit dies für den Betrieb der Website und die Bearbeitung von Anfragen erforderlich ist.':'This website processes personal data only as far as necessary to operate the website and handle enquiries.',
  '5. Rechtsgrundlagen und Speicherdauer':'5. Legal basis and retention',
  '6. Ihre Rechte':'6. Your rights',
  '7. Kontakt zum Datenschutz':'7. Privacy contact',
  'Importiert nur bekannte Website-/Preisfelder. Vorhandene Fotos und Kundendaten werden nicht gelöscht.':'Imports only known website/pricing fields. Existing photos and customer data are not deleted.',
  'Diese Vorlage muss vor dem endgültigen Launch anhand der tatsächlich aktivierten Netlify-, Supabase-, Analyse-, Cookie- und sonstigen Drittanbieterfunktionen rechtlich geprüft und vervollständigt werden.':'Before final launch, this template must be legally reviewed and completed based on the Netlify, Supabase, analytics, cookie and other third-party features actually enabled.'
});

export * from './site-i18n-base.js';
import { translations } from './site-i18n-base.js';

/* Extra pairs cover dynamic/short labels that previously leaked untranslated keywords. */
Object.assign(translations,{
  'Neukunde':'new-customer',
  'Neukunden':'new customers',
  'Neukundenangebot':'new-customer offer',
  'Neukundenangebot aktiv':'New-customer offer enabled',
  'Neukundenrabatt':'new-customer discount',
  'Zahlungsmonat':'Billing month',
  'Rechnungsnummer':'Invoice number',
  'Zahlungs-E-Mail senden':'Send payment email',
  'Zahlungseingang':'Payment received',
  'Benachrichtigungs-E-Mail':'Notification email',
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
  'Stripe-Verbindung testen':'Test Stripe connection'
});

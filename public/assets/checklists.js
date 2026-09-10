// Customer-facing service checklists. Pair format: [German, English].
// Office baseline follows the approved FrankiFlow cleaning/quality checklist;
// other service types are tailored variants for the selected service scope.
export const CHECKLISTS = {
  buero: [
    {title:['Büroräume','Office areas'],items:[
      ['Papierkörbe leeren','Empty waste bins'],
      ['Müllbeutel bei Bedarf wechseln','Replace bin bags if necessary'],
      ['Freie Schreibtischflächen reinigen','Clean desks and free surfaces'],
      ['Tische reinigen','Clean tables'],
      ['Erreichbare Oberflächen entstauben','Dust accessible surfaces'],
      ['Türgriffe reinigen','Clean door handles'],
      ['Lichtschalter reinigen','Clean light switches'],
      ['Fensterbänke reinigen','Clean window sills'],
      ['Sichtbare Flecken entfernen','Remove visible marks and stains'],
      ['Böden saugen','Vacuum floors'],
      ['Böden bei Bedarf feucht wischen','Mop floors where required']
    ]},
    {title:['Küche & Pausenraum','Kitchen & break area'],items:[
      ['Arbeitsflächen reinigen','Clean work surfaces'],
      ['Spüle und Wasserhähne reinigen','Clean sink and taps'],
      ['Tische abwischen','Wipe tables'],
      ['Sichtbare Flecken auf Schrankfronten entfernen','Remove visible marks from cupboard fronts'],
      ['Kaffeemaschinenbereich reinigen','Clean coffee area'],
      ['Müll leeren','Empty waste bins'],
      ['Boden saugen und/oder wischen','Vacuum and/or mop floor']
    ]},
    {title:['Toiletten & Sanitärbereiche','Toilets & sanitary areas'],items:[
      ['Toiletten und Toilettensitze reinigen und desinfizieren','Clean and disinfect toilets and toilet seats'],
      ['Waschbecken und Wasserhähne reinigen','Clean washbasins and taps'],
      ['Spiegel reinigen','Clean mirrors'],
      ['Türgriffe reinigen','Clean door handles'],
      ['Müll leeren','Empty waste bins'],
      ['Toilettenpapier, Seife und Papierhandtücher kontrollieren','Check toilet paper, soap and paper towels'],
      ['Boden reinigen','Clean floor']
    ]},
    {title:['Eingangsbereich & Flure','Entrance & corridors'],items:[
      ['Eingangsbereich reinigen','Clean entrance area'],
      ['Böden saugen bzw. kehren','Vacuum / sweep floors'],
      ['Böden wischen','Mop floors'],
      ['Türgriffe reinigen','Clean door handles'],
      ['Sichtbare Flecken auf Glastüren entfernen','Remove visible marks from glass doors'],
      ['Fußmatten reinigen bzw. saugen','Clean / vacuum entrance mats'],
      ['Flure kontrollieren','Check corridors']
    ]}
  ],
  wohnung: [
    {title:['Wohn- & Schlafbereiche','Living & sleeping areas'],items:[
      ['Freie Oberflächen reinigen und entstauben','Clean and dust free surfaces'],
      ['Tische und erreichbare Ablagen reinigen','Clean tables and accessible shelves'],
      ['Türgriffe und Lichtschalter reinigen','Clean door handles and light switches'],
      ['Fensterbänke reinigen','Clean window sills'],
      ['Sichtbare Flecken entfernen','Remove visible marks and stains'],
      ['Böden saugen','Vacuum floors'],
      ['Geeignete Böden feucht wischen','Mop suitable floors']
    ]},
    {title:['Küche','Kitchen'],items:[
      ['Arbeitsflächen reinigen','Clean work surfaces'],
      ['Spüle und Wasserhähne reinigen','Clean sink and taps'],
      ['Tisch und freie Flächen abwischen','Wipe table and free surfaces'],
      ['Sichtbare Flecken auf Schrankfronten entfernen','Remove visible marks from cupboard fronts'],
      ['Außenseiten erreichbarer Küchengeräte abwischen','Wipe accessible appliance exteriors'],
      ['Müll leeren','Empty waste bins'],
      ['Boden reinigen','Clean floor']
    ]},
    {title:['Bad & Toilette','Bathroom & toilet'],items:[
      ['Toilette und Toilettensitz reinigen und desinfizieren','Clean and disinfect toilet and toilet seat'],
      ['Waschbecken und Armaturen reinigen','Clean washbasin and taps'],
      ['Spiegel reinigen','Clean mirrors'],
      ['Dusche bzw. Badewanne oberflächlich reinigen','Clean shower or bathtub surfaces'],
      ['Türgriffe und Kontaktflächen reinigen','Clean door handles and touch points'],
      ['Müll leeren','Empty waste bins'],
      ['Boden reinigen','Clean floor']
    ]},
    {title:['Flur & Eingangsbereich','Hallway & entrance'],items:[
      ['Eingangsbereich reinigen','Clean entrance area'],
      ['Freie Ablagen entstauben','Dust free shelves and surfaces'],
      ['Türgriffe und Lichtschalter reinigen','Clean door handles and light switches'],
      ['Fußmatten saugen bzw. reinigen','Vacuum / clean entrance mats'],
      ['Boden saugen und/oder wischen','Vacuum and/or mop floor']
    ]}
  ],
  airbnb: [
    {title:['Schlaf- & Wohnbereiche','Sleeping & living areas'],items:[
      ['Freie Oberflächen reinigen und entstauben','Clean and dust free surfaces'],
      ['Tische und Nachttische reinigen','Clean tables and bedside surfaces'],
      ['Türgriffe und Lichtschalter reinigen','Clean door handles and light switches'],
      ['Fensterbänke reinigen','Clean window sills'],
      ['Sichtbare Flecken und Gästespuren entfernen','Remove visible marks and guest traces'],
      ['Böden saugen','Vacuum floors'],
      ['Geeignete Böden feucht wischen','Mop suitable floors']
    ]},
    {title:['Küche','Kitchen'],items:[
      ['Arbeitsflächen reinigen','Clean work surfaces'],
      ['Spüle und Wasserhähne reinigen','Clean sink and taps'],
      ['Tische und freie Flächen abwischen','Wipe tables and free surfaces'],
      ['Sichtbare Flecken auf Schrankfronten entfernen','Remove visible marks from cupboard fronts'],
      ['Außenseiten erreichbarer Geräte abwischen','Wipe accessible appliance exteriors'],
      ['Müll leeren und Müllbereich reinigen','Empty bins and clean the waste area'],
      ['Boden reinigen','Clean floor']
    ]},
    {title:['Bad & Toilette','Bathroom & toilet'],items:[
      ['Toilette und Toilettensitz reinigen und desinfizieren','Clean and disinfect toilet and toilet seat'],
      ['Waschbecken und Armaturen reinigen','Clean washbasin and taps'],
      ['Spiegel reinigen','Clean mirrors'],
      ['Dusche bzw. Badewanne reinigen','Clean shower or bathtub'],
      ['Türgriffe und Kontaktflächen reinigen','Clean door handles and touch points'],
      ['Müll leeren','Empty waste bins'],
      ['Boden reinigen','Clean floor']
    ]},
    {title:['Gästebereich & Abschluss','Guest area & final check'],items:[
      ['Eingang und Flure reinigen','Clean entrance and corridors'],
      ['Sichtbare Flecken auf Türen und Glas entfernen','Remove visible marks from doors and glass'],
      ['Fußmatten reinigen bzw. saugen','Clean / vacuum entrance mats'],
      ['Alle gereinigten Bereiche auf sichtbare Sauberkeit kontrollieren','Check all cleaned areas for visible cleanliness'],
      ['Fenster und Türen gemäß Objektanweisung schließen','Close windows and doors according to property instructions'],
      ['Licht gemäß Objektanweisung behandeln','Handle lights according to property instructions']
    ]}
  ],
  treppenhaus: [
    {title:['Eingang & Gemeinschaftsflächen','Entrance & common areas'],items:[
      ['Eingangsbereich reinigen','Clean entrance area'],
      ['Fußmatten saugen bzw. reinigen','Vacuum / clean entrance mats'],
      ['Sichtbare Verschmutzungen entfernen','Remove visible dirt and marks'],
      ['Briefkasten-/Ablagebereiche außen abwischen, sofern vereinbart','Wipe outer mailbox / shelf surfaces if agreed'],
      ['Gemeinschaftsflächen kontrollieren','Check common areas']
    ]},
    {title:['Treppen, Podeste & Böden','Stairs, landings & floors'],items:[
      ['Treppen und Podeste kehren bzw. saugen','Sweep or vacuum stairs and landings'],
      ['Treppen und Podeste feucht wischen','Mop stairs and landings'],
      ['Bodenkanten sichtbar sauber halten','Keep visible floor edges clean'],
      ['Flure und Zwischenpodeste reinigen','Clean corridors and intermediate landings'],
      ['Sichtbare Flecken entfernen','Remove visible marks']
    ]},
    {title:['Geländer, Türen & Kontaktflächen','Railings, doors & touch points'],items:[
      ['Handläufe und Geländer abwischen','Wipe handrails and railings'],
      ['Türgriffe reinigen','Clean door handles'],
      ['Eingangstür und erreichbare Kontaktflächen reinigen','Clean entrance door and accessible touch points'],
      ['Sichtbare Flecken auf Glastüren entfernen','Remove visible marks from glass doors'],
      ['Lichtschalter in Gemeinschaftsbereichen reinigen','Clean light switches in common areas'],
      ['Fensterbänke in Gemeinschaftsbereichen reinigen, sofern vorhanden','Clean common-area window sills where present']
    ]}
  ],
  deep: [
    {title:['Zusätzliche Grundreinigung – Oberflächen & Details','Additional deep cleaning – surfaces & details'],items:[
      ['Türen und Türrahmen vollständig reinigen','Clean doors and door frames thoroughly'],
      ['Sockelleisten und sichtbare Kanten reinigen','Clean skirting boards and visible edges'],
      ['Heizkörper außen gründlich reinigen','Deep-clean radiator exteriors'],
      ['Lichtschalter, Türgriffe und Kontaktflächen intensiv reinigen','Intensively clean light switches, handles and touch points'],
      ['Schwerer erreichbare horizontale Oberflächen entstauben, soweit sicher zugänglich','Dust less-accessible horizontal surfaces where safely reachable'],
      ['Ecken, Randbereiche und sichtbare Ablagerungen gründlich bearbeiten','Deep-clean corners, edges and visible build-up'],
      ['Hartnäckige sichtbare Flecken intensiver behandeln, soweit materialverträglich','Treat stubborn visible marks more intensively where material-safe']
    ]},
    {title:['Zusätzliche Grundreinigung – Küche','Additional deep cleaning – kitchen'],items:[
      ['Küchenarbeitsflächen intensiv reinigen','Deep-clean kitchen work surfaces'],
      ['Spüle und Armaturen gründlich reinigen und bei Bedarf entkalken','Deep-clean and descale sink and taps where needed'],
      ['Schrankfronten vollständig reinigen','Clean cupboard fronts completely'],
      ['Außenseiten von Küchengeräten gründlich reinigen','Deep-clean appliance exteriors'],
      ['Spritzbereiche und erreichbare Wandflächen reinigen','Clean splash areas and accessible wall surfaces'],
      ['Müllbereich gründlich reinigen','Deep-clean the waste area'],
      ['Bodenränder und Ecken intensiv reinigen','Deep-clean floor edges and corners']
    ]},
    {title:['Zusätzliche Grundreinigung – Bad & Sanitär','Additional deep cleaning – bathroom & sanitary'],items:[
      ['Sanitärobjekte intensiv reinigen und desinfizieren','Intensively clean and disinfect sanitary fixtures'],
      ['Armaturen und erreichbare Kalkablagerungen gründlicher entfernen','Remove accessible limescale from taps and fittings more thoroughly'],
      ['Dusche bzw. Badewanne intensiv reinigen','Deep-clean shower or bathtub'],
      ['Erreichbare Fliesen- und Wandflächen reinigen','Clean accessible tiles and wall surfaces'],
      ['Spiegel und Glasflächen gründlich reinigen','Deep-clean mirrors and glass surfaces'],
      ['Bodenränder, Ecken und schwerer erreichbare Bereiche intensiv reinigen','Deep-clean floor edges, corners and less-accessible areas']
    ]},
    {title:['Nur nach ausdrücklicher Vereinbarung','Only when specifically agreed'],optional:true,items:[
      ['Kühlschrank-Innenreinigung','Refrigerator interior cleaning'],
      ['Schrank-Innenreinigung','Cupboard interior cleaning'],
      ['Teppich-Tiefenreinigung','Carpet deep cleaning'],
      ['Weitere objektspezifische Zusatzleistungen','Other property-specific additional services']
    ]}
  ],
  windows: [
    {title:['Fenster & Glasflächen','Windows & glass'],items:[
      ['Vereinbarte Fensterscheiben reinigen','Clean agreed window panes'],
      ['Innen- und Außenseiten reinigen, soweit sicher zugänglich und vereinbart','Clean inside and outside where safely accessible and agreed'],
      ['Sichtbare Flecken, Fingerabdrücke und normale Verschmutzungen entfernen','Remove visible marks, fingerprints and normal dirt'],
      ['Glas streifenarm nacharbeiten','Finish glass with a low-streak result'],
      ['Vereinbarte Glastüren bzw. Glasflächen reinigen','Clean agreed glass doors or other glass surfaces']
    ]},
    {title:['Rahmen, Falze & Fensterbänke','Frames, rebates & window sills'],items:[
      ['Fensterrahmen innen/außen abwischen, soweit vereinbart','Wipe window frames inside/outside where agreed'],
      ['Erreichbare Rahmenkanten und Falzbereiche reinigen','Clean accessible frame edges and rebate areas'],
      ['Fenstergriffe reinigen','Clean window handles'],
      ['Fensterbänke innen reinigen','Clean interior window sills'],
      ['Fensterbänke außen reinigen, soweit sicher zugänglich und vereinbart','Clean exterior window sills where safely accessible and agreed']
    ]}
  ]
};

let ACTIVE_CHECKLISTS = CHECKLISTS;

export function applyChecklistRows(rows = []) {
  if (!Array.isArray(rows) || !rows.length) { ACTIVE_CHECKLISTS = CHECKLISTS; return; }
  const next = { ...CHECKLISTS };
  for (const row of rows) {
    if (!row?.service_key || !Array.isArray(row.sections)) continue;
    next[row.service_key] = row.sections.map(section => ({
      title: [section.title_de || '', section.title_en || section.title_de || ''],
      optional: !!section.optional,
      items: Array.isArray(section.items) ? section.items.map(item => [item.de || '', item.en || item.de || '']) : []
    }));
  }
  ACTIVE_CHECKLISTS = next;
}

export function localizeChecklistSections(key, lang='de') {
  const idx = lang === 'en' ? 1 : 0;
  return (ACTIVE_CHECKLISTS[key] || []).map(section => ({
    title: section.title[idx],
    optional: !!section.optional,
    items: section.items.map(item => item[idx])
  }));
}

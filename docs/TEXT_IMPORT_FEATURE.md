# Text-Import Feature

## Übersicht
Zusätzlich zur Datei-Upload-Funktion können Benutzer nun JSON-Daten auch direkt als Text einfügen.

## Funktionalität

### Import-Methoden
Im Import-Tab gibt es zwei Optionen:

1. **📁 Datei**: JSON-Datei hochladen (bestehende Funktionalität)
2. **📝 Text**: JSON-Daten direkt als Text einfügen (NEU)

### Verwendung

#### Text-Import
1. Öffne den **Import**-Tab
2. Wähle **📝 Text** als Import-Methode
3. Füge deine JSON-Daten in das Textfeld ein
4. Klicke auf **"JSON validieren"**
5. Bei erfolgreicher Validierung wird eine Zusammenfassung angezeigt
6. Klicke auf **"Zeiten importieren"** um den Import zu starten

### JSON-Format
Das JSON-Format ist identisch zum Datei-Import:

```json
[
  {
    "id": 1,
    "start": "20251114T080000Z",
    "end": "20251114T120000Z",
    "tags": ["work"]
  },
  {
    "id": 2,
    "start": "20251114T130000Z",
    "end": "20251114T170000Z",
    "tags": ["project-x"]
  }
]
```

### UI-Komponenten

#### Import-Methoden-Tabs
- `.import-method-tabs`: Container für die Methoden-Auswahl
- `.import-method-btn`: Button für jede Methode (Datei/Text)
- `.import-method-btn.active`: Aktive Methode wird hervorgehoben

#### Textfeld
- `.import-textarea`: Mehrzeliges Textfeld für JSON-Eingabe
- Monospace-Font für bessere Lesbarkeit
- Vertikal skalierbar (resize: vertical)
- Platzhalter zeigt Beispiel-Format

#### Validierung
- **"JSON validieren"** Button: Prüft Syntax und Format
- `#textInfo`: Zeigt Validierungsergebnis an
  - Grün bei Erfolg: Anzahl Tage, Zeitraum
  - Rot bei Fehler: Fehlermeldung

### Implementierung

#### HTML (`popup/popup.html`)
```html
<div class="import-method-tabs">
  <button id="importMethodFile" class="import-method-btn active">📁 Datei</button>
  <button id="importMethodText" class="import-method-btn">📝 Text</button>
</div>

<div id="importTextMethod" class="import-method-content" style="display: none;">
  <div class="form-group">
    <label for="importText">JSON einfügen:</label>
    <textarea id="importText" class="import-textarea" 
              placeholder='[{"id":1,"start":"20251114T080000Z",...}]'
              rows="10"></textarea>
    <small>Fügen Sie hier Ihre JSON-Daten ein</small>
  </div>
  <button id="parseImportText" class="btn btn-secondary">JSON validieren</button>
  <div id="textInfo"></div>
</div>
```

#### JavaScript (`popup/popup.js`)
- `switchImportMethod(method)`: Wechselt zwischen Datei- und Text-Modus
- `handleParseImportText()`: Validiert und parst die eingegebenen JSON-Daten
- Gleiche `handleStartImport()` Funktion für beide Methoden

#### CSS (`popup/popup.css`)
- Styling für Import-Methoden-Tabs
- Textarea mit Monospace-Font
- Responsive Design
- Fokus-States und Hover-Effekte

### Vorteile

1. **Schneller**: Keine Datei-Auswahl nötig
2. **Flexibler**: Copy & Paste aus anderen Tools
3. **Debug-freundlich**: Direkte Bearbeitung möglich
4. **Identische Validierung**: Gleiche Parsing-Logik wie Datei-Import

### Fehlerbehandlung

- JSON-Syntax-Fehler werden angezeigt
- Format-Validierung durch `TimeImportService`
- Hilfreiche Fehlermeldungen mit Details
- Reset beim Methodenwechsel

### Zustand Management

- `importedData`: Globale Variable für beide Methoden
- Reset bei Methodenwechsel
- "Zeiten importieren" Button nur aktiviert nach erfolgreicher Validierung
- Info-Boxen werden ausgeblendet beim Methodenwechsel

## Testing

### Test-Szenarien
1. Leeres Textfeld → Fehlermeldung
2. Ungültiges JSON → Syntax-Fehler anzeigen
3. Gültiges JSON → Erfolg mit Zusammenfassung
4. Wechsel zwischen Methoden → Reset
5. Import nach Text-Validierung → Funktioniert wie Datei-Import

### Edge Cases
- Sehr große JSON-Daten (Textarea ist scrollbar)
- Whitespace vor/nach JSON wird ignoriert
- Mehrere Tage im JSON werden erkannt
- Validierung vor Import ist Pflicht


# 🚀 Installation & Erste Schritte

## Schritt 1: Icons generieren

1. Öffnen Sie die Datei `/icons/generate-icons.html` in Ihrem Browser
2. Laden Sie alle drei Icons herunter:
   - icon128.png (128x128)
   - icon48.png (48x48)
   - icon16.png (16x16)
3. Speichern Sie diese im Ordner `/icons/`

## Schritt 2: Extension in Chrome laden

1. Öffnen Sie Chrome und navigieren Sie zu: `chrome://extensions/`
2. Aktivieren Sie oben rechts den **"Entwicklermodus"**
3. Klicken Sie auf **"Entpackte Erweiterung laden"**
4. Wählen Sie den Ordner `personio-attendance-recorder` aus
5. Die Extension sollte jetzt in der Liste erscheinen

## Schritt 3: Bei Personio einloggen

1. Öffnen Sie Ihre Personio-Instanz (z.B. `https://aoe-gmbh.app.personio.com`)
2. Loggen Sie sich ein
3. Stellen Sie sicher, dass Sie eingeloggt bleiben

## Schritt 4: Extension konfigurieren

1. Klicken Sie auf das Extension-Icon in der Chrome-Toolbar (das "P" Icon)
2. Das Popup öffnet sich
3. Füllen Sie das Arbeitszeitprofil aus:

### Arbeitszeitprofil

**Personio Instanz:**
- Format: `ihre-firma.app.personio.com` (ohne `https://`)
- Beispiel: `aoe-gmbh.app.personio.com`

**Mitarbeiter-ID:**
- Ihre numerische ID aus Personio
- Finden Sie in der URL wenn Sie Ihr Profil öffnen
- Beispiel: `13011272`

**Arbeitstage:**
- Wählen Sie alle Tage an denen Sie arbeiten
- Standard: Mo-Fr

**Arbeitszeiten:**
- **Arbeitsbeginn:** z.B. `08:00`
- **Arbeitsende:** z.B. `17:00`

**Pausenzeiten:**
- **Pausenbeginn:** z.B. `12:00`
- **Pausenende:** z.B. `13:00`

**Zeitzone:**
- Standard: `Europe/Berlin`
- Weitere Optionen: `Europe/Vienna`, `Europe/Zurich`

4. Klicken Sie auf **"Profil speichern"**

## Schritt 5: Zeiterfassung starten

1. Nach dem Speichern des Profils sollte der Status "✅ Authentifiziert" anzeigen
2. Der Button "Zeiterfassung starten" wird aktiviert
3. Klicken Sie auf **"Zeiterfassung starten"**
4. Die Extension wird nun:
   - Das Timesheet für den aktuellen Monat abrufen
   - Alle trackbaren Tage identifizieren
   - Automatisch Zeiten für diese Tage eintragen
5. Sie sehen den Fortschritt in Echtzeit
6. Am Ende wird eine Zusammenfassung angezeigt

## ⚠️ Wichtige Hinweise

### Authentifizierung

- Sie müssen bei Personio **eingeloggt** sein
- Die Extension nutzt Ihre Browser-Cookies
- Bei Problemen: Neu einloggen und Extension neu laden

### Was wird eingetragen?

Die Extension trägt nur Tage ein, die **alle** folgenden Bedingungen erfüllen:

✅ Status ist "trackable" (nicht in der Zukunft)  
✅ Kein Off-Day (kein Wochenende/Feiertag)  
✅ Noch keine Zeiten eingetragen  
✅ Ein konfigurierter Arbeitstag

### Sicherheit

- ✅ Keine Daten werden extern gespeichert
- ✅ Alles läuft lokal im Browser
- ✅ Cookies werden nur für Personio verwendet
- ✅ Open Source - Code ist einsehbar

## 🐛 Troubleshooting

### Problem: "Nicht authentifiziert"

**Lösung:**
1. Bei Personio neu einloggen
2. Extension-Popup schließen und neu öffnen
3. Prüfen ob die Personio Instanz korrekt ist

### Problem: "Keine Cookies gefunden"

**Lösung:**
1. Stellen Sie sicher, dass Sie auf einer Personio-Seite sind
2. Loggen Sie sich bei Personio ein
3. Extension neu laden (`chrome://extensions/` → Neu laden)

### Problem: "Keine Tage zum Eintragen gefunden"

**Mögliche Ursachen:**
- Alle Tage bereits eingetragen ✅
- Keine trackbaren Tage im aktuellen Monat
- Arbeitstage nicht korrekt konfiguriert

**Lösung:**
- Prüfen Sie Ihr Profil in Personio
- Prüfen Sie die konfigurierten Arbeitstage

### Problem: Extension lädt nicht

**Lösung:**
1. Prüfen Sie ob alle Icons vorhanden sind
2. Öffnen Sie `chrome://extensions/`
3. Klicken Sie auf "Fehler" bei der Extension
4. Prüfen Sie die Console-Logs

### Logs anzeigen

**Popup-Logs:**
1. Extension-Popup öffnen
2. Rechtsklick → "Untersuchen"
3. Console-Tab öffnen

**Background-Logs:**
1. `chrome://extensions/` öffnen
2. Bei der Extension auf "Service Worker" klicken
3. Console öffnet sich

## 📊 Was passiert beim Eintragen?

1. **Timesheet abrufen** - Aktueller Monat wird von Personio geladen
2. **Tage filtern** - Nur trackbare, nicht eingetragene Arbeitstage
3. **Periods generieren** - Für jeden Tag:
   - Work Period 1: Arbeitsbeginn → Pausenbeginn
   - Break Period: Pausenbeginn → Pausenende
   - Work Period 2: Pausenende → Arbeitsende
4. **Eintragen** - Jeder Tag wird einzeln eingetragen (1 Sekunde Pause dazwischen)
5. **Zusammenfassung** - Ergebnis wird angezeigt

## 🎯 Beispiel-Konfiguration

```
Personio Instanz:    aoe-gmbh.app.personio.com
Mitarbeiter-ID:      13011272
Arbeitstage:         Mo, Di, Mi, Do, Fr
Arbeitsbeginn:       08:00
Arbeitsende:         17:00
Pausenbeginn:        12:00
Pausenende:          13:00
Zeitzone:            Europe/Berlin
```

Dies würde für jeden Montag-Freitag folgende Zeiten eintragen:
- 08:00 - 12:00 (Arbeit)
- 12:00 - 13:00 (Pause)
- 13:00 - 17:00 (Arbeit)

**Gesamt:** 8 Stunden Arbeit, 1 Stunde Pause

## 🔄 Updates

Wenn Sie die Extension aktualisieren:

1. Änderungen im Code vornehmen
2. `chrome://extensions/` öffnen
3. Auf das Reload-Icon bei der Extension klicken
4. Extension ist aktualisiert

## ❓ Weitere Fragen?

Siehe ausführliche Dokumentation in `/docs/`:
- [Knowledge Base](./docs/knowledge-base.md)
- [API-Referenz](./docs/api-reference.md)
- [Implementierungshinweise](./docs/IMPLEMENTATION_NOTES.md)


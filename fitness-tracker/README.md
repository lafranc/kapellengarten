# Fortschritt Tracker

Eine kleine, lokal laufende Web-App, um deinen Fitness-Fortschritt zu tracken:
BMI, Gewicht, Bauchumfang, Ernährung, Training und Fortschrittsfotos.

## Nutzung

Einfach `index.html` im Browser öffnen (oder die drei Dateien per einfachem
Webserver ausliefern, z.B. `python3 -m http.server`).

1. **Profil & Ziel**: Körpergröße, Start-/Zielgewicht, Start- und Zieldatum
   (z.B. heute + 2 Monate) und dein Ziel eintragen.
2. **Tagebuch**: täglich Gewicht, Bauchumfang, Kalorien, Essen, Training
   und Notizen eintragen.
3. **Fotos**: Fortschrittsfotos mit Datum hochladen und im
   Vorher/Nachher-Vergleich nebeneinander ansehen.
4. **Dashboard**: zeigt aktuellen BMI, Gewichtsverlauf-Chart und
   Fortschritt zum Ziel (zeitlich und gewichtsbezogen).

## Daten & Privatsphäre

Alle Daten (Profil, Tagebucheinträge, Fotos) werden **ausschliesslich lokal**
im Browser gespeichert (`localStorage` für Texte/Zahlen, `IndexedDB` für
Fotos). Es gibt keinen Server und keine Datenübertragung.

⚠️ Da die Daten lokal im Browser liegen, gehen sie verloren, wenn du den
Browser-Cache/Verlauf löschst oder ein anderes Gerät/Browser benutzt. Nutze
den "Daten exportieren"-Button auf der Profil-Seite regelmässig, um ein
Backup als JSON-Datei zu speichern.

## Eigenständiges Repo

Diese App ist komplett unabhängig von der Kapellengarten-Website und kann
1:1 (alle Dateien in diesem Ordner) in ein eigenes Repository kopiert und
z.B. via GitHub Pages gehostet werden.

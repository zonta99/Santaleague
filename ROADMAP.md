# Santaleague — Roadmap

## Fase 1 — Foundation UI
- [x] Login / auth flow
- [ ] Register form — stessa UI del login
- [ ] Layout protetto — navbar definitiva con avatar, link alle sezioni, logout
- [ ] Homepage — dashboard con ultime partite e classifica rapida

## Fase 2 — Gestione Partite
- [ ] Lista match — pagina `/match` con tutte le giornate (non hardcoded `id: 3`)
- [ ] Dettaglio match — `/match/[id]` dinamico con tutti i game della giornata
- [ ] Admin: crea partita — form per creare un `Match` con data, location, tipo
- [ ] Admin: aggiungi eventi — inserimento `GameDetail` (gol, cartellini, ecc.) durante o dopo la partita

## Fase 3 — Draft
- [ ] Draft UI — assegnazione utenti ai team per una giornata (`DraftPick`)
- [ ] Gestione team — visualizzazione roster e capitano

## Fase 4 — Classifiche & Statistiche
- [ ] Classifica — punti per utente/team aggregati dai `GameDetail`
- [ ] Profilo giocatore — storico personale: gol, assist, cartellini, partite giocate
- [ ] MVP board — chi ha vinto più MVP per match/game

## Fase 5 — Real-time & Polish
- [ ] Livescore — aggiornamento punteggio in tempo reale durante la partita (polling o SSE)
- [ ] Notifiche — email post-partita con riepilogo risultati

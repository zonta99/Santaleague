# Santaleague — Roadmap

## Fase 1 — Foundation UI
- [x] Login / auth flow
- [x] Register form — stessa UI del login
- [x] Layout protetto — navbar definitiva con avatar, link alle sezioni, logout
- [x] Homepage — dashboard con saluto, statistiche personali (gol, assist, cartellini, partite), prossima partita iscritta, ultime giornate

## Fase 2 — Gestione Partite
- [x] Lista match — pagina `/match` con tutte le giornate (non hardcoded `id: 3`)
- [x] Dettaglio match — `/match/[id]` dinamico con tutti i game della giornata
- [x] Admin: crea partita — form per creare un `Match` con data, location, tipo
- [x] Admin: anagrafica campi — CRUD campi da gioco (`Location`) con tabella inline nella pagina admin
- [x] Admin: aggiungi eventi — inserimento `GameDetail` (gol, cartellini, ecc.) durante o dopo la partita

## Fase 3 — Draft
- [x] Draft UI — `/match/[id]/draft` (admin only): assegnazione casuale utenti ai team (`DraftPick`), reset draft
- [x] Seed dati di test — `bun run seed`: 14 utenti fake + location + partita con iscritti
- [x] Gestione team — visualizzazione roster e capitano

## Fase 4 — Classifiche & Statistiche
- [ ] Classifica — punti per utente/team aggregati dai `GameDetail`
- [ ] Profilo giocatore — storico personale: gol, assist, cartellini, partite giocate
- [ ] MVP board — chi ha vinto più MVP per match/game

## Fase 5 — Real-time & Polish
- [ ] Livescore — aggiornamento punteggio in tempo reale durante la partita (polling o SSE)
- [ ] Notifiche — email post-partita con riepilogo risultati

# Automatyczne odświeżanie profilu VALORANT

Workflow `Refresh VALORANT profile` pobiera aktualną rangę, RR, Peak i 10 ostatnich meczów rankingowych z HenrikDev raz dziennie o 09:17 UTC. Można go też uruchomić ręcznie w zakładce GitHub Actions.

## Konfiguracja

1. Wypchnij repozytorium na GitHub.
2. Utwórz klucz API na [HenrikDev Dashboard](https://api.henrikdev.xyz/dashboard/).
3. W repozytorium otwórz **Settings → Secrets and variables → Actions** i dodaj repository secret o nazwie `HENRIKDEV_API_KEY` z kluczem API.
4. W **Actions** włącz workflow **Refresh VALORANT profile** i uruchom go przez **Run workflow**.
5. Upewnij się, że GitHub Pages publikuje tę samą gałąź i katalog główny, w którym znajduje się plik HTML.

Workflow zapisuje wyłącznie publiczne dane profilu do `data/valorant-stats.json`. Klucz API pozostaje w GitHub Secrets i nie trafia do HTML-a ani do opublikowanego JSON-u.

Dokumentacja: [HenrikDev Authentication](https://docs.henrikdev.xyz/general/auth), [MMR v3](https://docs.henrikdev.xyz/api-reference/valorant/get-mmr-by-name-v3), [Match history v4](https://docs.henrikdev.xyz/api-reference/valorant/get-matches-by-name-v4).
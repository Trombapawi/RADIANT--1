# Automatyczne odświeżanie profilu VALORANT

Workflow `Refresh VALORANT profile` pobiera aktualną rangę, RR, Peak i 10 ostatnich meczów rankingowych z HenrikDev raz dziennie o 09:17 UTC. Następnie publikuje dashboard i JSON na GitHub Pages. Można go też uruchomić ręcznie w zakładce GitHub Actions.

## Konfiguracja

1. Wypchnij repozytorium na GitHub.
2. Utwórz klucz API na [HenrikDev Dashboard](https://api.henrikdev.xyz/dashboard/).
3. W repozytorium otwórz **Settings → Secrets and variables → Actions** i dodaj repository secret o nazwie `HENRIKDEV_API_KEY` z kluczem API.
4. W **Actions** włącz workflow **Refresh VALORANT profile** i uruchom go przez **Run workflow**.
5. Otwórz **Settings → Pages** i ustaw **Build and deployment → Source** na **GitHub Actions**.
6. W **Actions** uruchom ręcznie workflow **Refresh VALORANT profile**. Po zielonym zakończeniu adres strony znajdziesz w **Settings → Pages** albo w podsumowaniu deploymentu.

Workflow zapisuje wyłącznie publiczne dane profilu do `data/valorant-stats.json`; strona automatycznie publikuje jego kopię. Klucz API pozostaje w GitHub Secrets i nie trafia do HTML-a ani do opublikowanego JSON-u. Strona GitHub Pages i jej historia meczów są publiczne, nawet jeśli repozytorium pozostaje prywatne. Jeśli plan GitHub nie pozwala publikować Pages z prywatnego repozytorium, workflow deployment zakończy się błędem; nie zmieniaj repozytorium na publiczne, jeśli nie chcesz ujawniać tych danych.

Dokumentacja: [HenrikDev Authentication](https://docs.henrikdev.xyz/general/auth), [MMR v3](https://docs.henrikdev.xyz/api-reference/valorant/get-mmr-by-name-v3), [Match history v4](https://docs.henrikdev.xyz/api-reference/valorant/get-matches-by-name-v4).
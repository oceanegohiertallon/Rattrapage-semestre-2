#!/usr/bin/env bash
# Rejoue en local les étapes du workflow front-ci-cd.yml, avec les MÊMES commandes,
# pour produire des traces réelles sans dépôt ni déploiement GitHub/AWS.
#
#   ./simuler-pipeline.sh livrer   <version>   validation + livraison
#   ./simuler-pipeline.sh echec    <version>   idem, avec un test volontairement cassé
#   ./simuler-pipeline.sh rollback <version>   redéploie une version déjà archivée
#
# Différences assumées avec la CI réelle (explicitement simulées) :
#   - S3 « releases » et « site » sont deux dossiers locaux dans simulation/.cible/
#   - le smoke test lit les fichiers publiés au lieu d'un appel HTTP
#   - pas d'OIDC / d'approbation d'environnement (aucun compte AWS)
set -euo pipefail

MODE=${1:?mode : livrer | echec | rollback}
VERSION=${2:?version, ex. v1.0.0}

HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../.." && pwd)
CIBLE="$HERE/.cible"
RELEASES="$CIBLE/releases"   # équivalent s3://<RELEASES_BUCKET>/front
SITE="$CIBLE/site"           # équivalent s3://<SITE_BUCKET>
mkdir -p "$RELEASES" "$SITE"

etape() { printf '\n=== %s ===\n' "$*"; }
en_ligne() { cat "$SITE/VERSION" 2>/dev/null || echo none; }

echo "Simulation front-ci-cd — mode=$MODE version=$VERSION"
echo "Version en ligne au départ : $(en_ligne)"

# ----------------------------------------------------------------------------
# Job « validate »
# ----------------------------------------------------------------------------
validate() {
  WORK=$(mktemp -d)
  trap 'rm -rf "$WORK"' EXIT

  etape "validate / Récupérer le code (git archive HEAD, comme un checkout propre)"
  git -C "$REPO" archive HEAD react-app | tar -x -C "$WORK"
  cd "$WORK/react-app"
  echo "commit $(git -C "$REPO" rev-parse --short HEAD)"

  if [ "$MODE" = echec ]; then
    etape "(simulation) Injection d'un test qui échoue"
    cat > src/regression.test.js <<'EOF'
import { expect, it } from 'vitest'
import { isVisibleForGroup } from './data/sessions'
// régression simulée : on exige à tort que le groupe A n'affiche pas la Promotion
it('régression simulée : A sans Promotion', () => {
  expect(isVisibleForGroup({ group: 'Promotion' }, 'A')).toBe(false)
})
EOF
  fi

  etape "validate / Installation verrouillée : npm ci --ignore-scripts"
  npm ci --ignore-scripts --no-audit --no-fund --loglevel=error
  echo "OK ($(ls node_modules | wc -l) paquets, versions de package-lock.json)"

  etape "validate / Tests (non interactifs) : npm test -- --run"
  # pas de « || true » : un test rouge arrête le script (set -e), comme la CI
  STATUT=0
  NO_COLOR=1 npm test --silent -- --run > test.log 2>&1 || STATUT=$?
  grep -E '✓|×|Test Files|Tests ' test.log || true
  [ "$STATUT" -eq 0 ] || {
    grep -A3 -E '^ FAIL ' test.log | head -8
    echo
    echo "npm test -> code de sortie $STATUT"
    echo "ÉCHEC des tests -> job validate ROUGE."
    echo "Le job deploy (needs: validate) n'est PAS lancé : rien n'est livré."
    echo "Version en ligne inchangée : $(en_ligne)"
    exit 1
  }

  etape "validate / Build de production : npm run build"
  # sed retire les codes couleur ANSI de la sortie de Vite
  NO_COLOR=1 npm run build --silent 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -4

  etape "validate / Empaqueter l'artefact versionné"
  echo "$VERSION" > dist/VERSION
  git -C "$REPO" rev-parse HEAD > dist/COMMIT
  tar -czf "front-$VERSION.tar.gz" -C dist .
  sha256sum "front-$VERSION.tar.gz" > "front-$VERSION.tar.gz.sha256"
  cat "front-$VERSION.tar.gz.sha256"
  ARTEFACT_DIR=$PWD
}

# ----------------------------------------------------------------------------
# Job « deploy » (aussi utilisé pour le rollback)
# ----------------------------------------------------------------------------
deploy() {
  DEPLOY=$(mktemp -d)
  cd "$DEPLOY"

  if [ "$MODE" = rollback ]; then
    etape "deploy / Récupérer une version archivée (rollback)"
    cp "$RELEASES/front-$VERSION.tar.gz" "$RELEASES/front-$VERSION.tar.gz.sha256" . \
      || { echo "Version $VERSION absente de l'archive"; exit 1; }
    echo "front-$VERSION.tar.gz récupéré depuis l'archive (aucune reconstruction)"
  else
    etape "deploy / Archiver la version (immuable)"
    if [ -e "$RELEASES/front-$VERSION.tar.gz" ]; then
      echo "ERREUR : $VERSION existe déjà dans l'archive, une version publiée ne se réécrit pas"
      exit 1
    fi
    cp "$ARTEFACT_DIR/front-$VERSION.tar.gz" "$ARTEFACT_DIR/front-$VERSION.tar.gz.sha256" .
    cp "front-$VERSION.tar.gz" "front-$VERSION.tar.gz.sha256" "$RELEASES/"
    echo "archive : $(cd "$RELEASES" && ls -1 *.tar.gz | tr '\n' ' ')"
  fi

  etape "deploy / Contrôler l'artefact"
  sha256sum --check "front-$VERSION.tar.gz.sha256"
  mkdir site && tar -xzf "front-$VERSION.tar.gz" -C site
  test -f site/index.html && echo "index.html présent"
  test "$(cat site/VERSION)" = "$VERSION" && echo "VERSION embarquée = $VERSION"

  etape "deploy / Noter la version actuellement en ligne"
  PREVIOUS=$(en_ligne)
  echo "précédente = $PREVIOUS"

  etape "deploy / Publier"
  rm -rf "${SITE:?}"/* && cp -r site/. "$SITE/"
  echo "publié dans simulation/.cible/site"

  etape "deploy / Smoke test"
  if [ "$(cat "$SITE/VERSION")" = "$VERSION" ] && grep -q '<div id="root">' "$SITE/index.html"; then
    echo "OK : $VERSION en ligne"
  else
    echo "ÉCHEC smoke test -> retour automatique à $PREVIOUS"
    exit 1
  fi
  rm -rf "$DEPLOY"
}

case "$MODE" in
  livrer|echec) validate; deploy ;;
  rollback) deploy ;;
  *) echo "mode inconnu : $MODE"; exit 2 ;;
esac

echo
echo "Version en ligne à la fin : $(en_ligne)"

#!/usr/bin/env bash
# Obra health monitor. Probes public surfaces every INTERVAL sec.
# Stays silent while green. On anomaly: prints PROBLEM block and exits 0 (wakes main agent).
set -u
SITE="https://bq-tools.fanzai-mgmt.workers.dev"
API="https://bq-tools-api.fanzai-mgmt.workers.dev"
INTERVAL="${INTERVAL:-300}"
MAX_ITERS="${MAX_ITERS:-288}"   # 288 * 300s = 24h
OK_CODES="200 301 302 307 308"

# url|label
TARGETS=(
  "$SITE/|home"
  "$API/api/health|api-health"
  "$API/api/security-health|security-health"
  "$API/api/pusher-health|pusher-health"
  "$SITE/index.html|index"
)

is_ok () { case " $OK_CODES " in *" $1 "*) return 0;; *) return 1;; esac; }

for ((i=1; i<=MAX_ITERS; i++)); do
  for t in "${TARGETS[@]}"; do
    url="${t%%|*}"; label="${t##*|}"
    code=$(curl -s -o /dev/null -m 15 -w "%{http_code}" "$url")
    if ! is_ok "$code"; then
      # confirm with a second probe to avoid false positive on a blip
      sleep 3
      code2=$(curl -s -o /dev/null -m 15 -w "%{http_code}" "$url")
      if ! is_ok "$code2"; then
        echo "PROBLEM_DETECTED"
        echo "label=$label"
        echo "url=$url"
        echo "http_code=$code2 (first probe $code)"
        echo "ts=$(date -u +%FT%TZ)"
        exit 0
      fi
    fi
  done
  sleep "$INTERVAL"
done
echo "MONITOR_CLEAN_EXIT after $MAX_ITERS iters"

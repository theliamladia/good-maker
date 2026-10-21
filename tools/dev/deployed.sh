#!/usr/bin/env bash
# Wait for good.leems.me to serve a path (and optionally contain a marker), up to 10 minutes.
#   bash tools/dev/deployed.sh /q ["text that only the new version has"]
P="${1:-/}"; M="$2"; U="https://good.leems.me$P"
for i in $(seq 1 40); do
  if [ -n "$M" ]; then curl -s "$U?nocache=$RANDOM" | grep -qF -- "$M" && { echo "live: $U (after $i checks)"; exit 0; }
  else [ "$(curl -s -o /dev/null -w '%{http_code}' "$U")" = 200 ] && { echo "live: $U (after $i checks)"; exit 0; }; fi
  sleep 15
done
echo "NOT live after 10 min: $U"; exit 1

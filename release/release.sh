#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

SKIPPING="+++ SKIPPING +++";

releaseDirs=(
  "ep-async-api-importer"
)

for releaseDir in ${releaseDirs[@]}; do

  releaseScript="$scriptDir/$releaseDir/release.sh"

  echo ">>> Running: $releaseScript"

  $releaseScript

  code=$?;

  if [[ $code == 2 ]]; then
    echo ">>> [$releaseDir] [$SKIPPING], version already exists - code=$code - $releaseScript' - $scriptDir/$scriptName"; exit 0;
  elif [[ $code != 0 ]]; then
    echo ">>> [$releaseDir] ERROR - code=$code - $releaseScript' - $criptDir/$scriptName"; exit 1;
  fi

done

echo " >>> Success: $scriptDir/$scriptName"

###
# The End.

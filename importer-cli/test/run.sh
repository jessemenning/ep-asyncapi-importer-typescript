#!/usr/bin/env bash

scriptDir=$(cd $(dirname "$0") && pwd);
scriptName=$(basename $(test -L "$0" && readlink "$0" || echo "$0"));

############################################################################################################################
# Prepare
  TMP_DIR="$scriptDir/tmp";
  LOG_DIR="$TMP_DIR/logs";
  mkdir -p $LOG_DIR;
  rm -rf $LOG_DIR/*;
  FAILED=0

############################################################################################################################
# Run


  export CLI_LOGGER_LOG_FILE="$LOG_DIR/ep-async-api-importer-test.log"
  export CLI_IMPORT_ASSETS_OUTPUT_DIR="$TMP_DIR/output"

  runScript="npm run test"
  echo "starting: $runScript ..."
  logFile="$LOG_DIR/npm.run.test.out"; mkdir -p "$(dirname "$logFile")";
  # $runScript
  $runScript > $logFile 2>&1
  code=$?; echo "code=$code"; if [[ $code != 0 ]]; then echo ">>> ERROR - code=$code - runScript='$runScript' - $scriptName"; FAILED=1; fi

##############################################################################################################################
# Check for errors

filePattern="$logFile"
tsErrors=$(grep -n -r -e "TSError" $filePattern )
epSdkErrors=$(grep -n -r -e "EpSdkError" $filePattern )
cliErrors=$(grep -n -r -e "CliError" $filePattern )
errors=$(grep -n -r -e " ERROR " $filePattern )
test_failing=$(grep -n -r -e "failing" $filePattern )
if [ ! -z "$tsErrors" ]; then
  FAILED=1
  echo "   found ${#tsErrors[@]} TSError(s)"
  while IFS= read line; do
    echo $line >> "$LOG_DIR/$scriptName.ERROR.out"
  done < <(printf '%s\n' "$tsErrors")
else
  echo "   no TSError found"
fi
if [ ! -z "$epSdkErrors" ]; then
  FAILED=1
  echo "   found ${#epSdkErrors[@]} EpSdkError(s)"
  while IFS= read line; do
    echo $line >> "$LOG_DIR/$scriptName.ERROR.out"
  done < <(printf '%s\n' "$epSdkErrors")
else
  echo "   no EpSdkError found"
fi
if [ ! -z "$cliErrors" ]; then
  FAILED=1
  echo "   found ${#cliErrors[@]} CliError(s)"
  while IFS= read line; do
    echo $line >> "$LOG_DIR/$scriptName.ERROR.out"
  done < <(printf '%s\n' "$cliErrors")
else
  echo "   no CliError found"
fi
if [ ! -z "$errors" ]; then
  FAILED=1
  echo "   found ${#errors[@]} ERROR(s)"
  while IFS= read line; do
    echo $line >> "$LOG_DIR/$scriptName.ERROR.out"
  done < <(printf '%s\n' "$errors")
else
  echo "   no ERROR(s) found"
fi
if [ ! -z "$test_failing" ]; then
  FAILED=1
  echo "   found ${#test_failing[@]} failing"
  while IFS= read line; do
    echo $line >> "$LOG_DIR/$scriptName.ERROR.out"
  done < <(printf '%s\n' "$test_failing")
else
  echo "   no failing found"
fi

if [[ "$FAILED" -eq 0 ]]; then
  echo ">>> FINISHED:SUCCESS - $scriptName"
  touch "$LOG_DIR/$scriptName.SUCCESS.out"
else
  echo ">>> FINISHED:FAILED";
  exit 1
fi

###
# The End.

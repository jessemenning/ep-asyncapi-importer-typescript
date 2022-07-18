#
# Environment for tests
#
# Usage:
#   source source.env.sh && {run-tests} && unset_source_env

unset_source_env() {
    # env vars for app
    unset CLI_APP_ID
    unset CLI_LOGGER_LOG_LEVEL
    unset CLI_ASSETS_TARGET_STATE
    unset CLI_ASSET_IMPORT_TARGET_LIFECYLE_STATE
    unset CLI_ASSET_IMPORT_TARGET_VERSION_STRATEGY
    unset CLI_ASSET_OUTPUT_DIR
    unset CLI_LOG_DIR
    # env vars for tests
    unset CLI_TEST_ONE
    
    # unset this function
    unset -f unset_source_env
}

# Env vars for app
export CLI_APP_ID="@test/sep-async-api-importer"
export CLI_LOGGER_LOG_LEVEL="trace"
export CLI_ASSETS_TARGET_STATE="present"
export CLI_ASSET_IMPORT_TARGET_LIFECYLE_STATE="released"
export CLI_ASSET_IMPORT_TARGET_VERSION_STRATEGY="bump_patch"
export CLI_ASSET_OUTPUT_DIR="output"
export CLI_LOG_DIR="logs"

# ENV vars for tests
export CLI_TEST_ONE="one"

######################################################
logName='[source.env.sh]'
echo "$logName - test environment:"
echo "$logName - CLI:"
export -p | sed 's/declare -x //' | grep CLI_
echo "$logName - CLI_TEST:"
export -p | sed 's/declare -x //' | grep CLI_TEST_

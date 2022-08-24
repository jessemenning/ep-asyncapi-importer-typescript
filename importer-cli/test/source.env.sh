#
# Environment for tests
#
# Usage:
#   source source.env.sh && {run-tests} && unset_source_env

unset_source_env() {
    # env vars for app
    unset CLI_APP_NAME
    unset CLI_EP_API_BASE_URL
    unset CLI_MODE
    unset CLI_RUN_ID
    unset CLI_LOGGER_LOG_LEVEL
    unset CLI_LOGGER_PRETTY_PRINT
    # env vars for tests
    unset CLI_TEST_API_SPECS_ROOT_DIR
    unset CLI_TEST_ENABLE_API_CALL_LOGGING
    
    # unset this function
    unset -f unset_source_env
}

# Env vars for app
# export CLI_APP_NAME="ep-async-api-importer-test"
export CLI_EP_API_BASE_URL="https://ian-dev-api.mymaas.net"

export CLI_RUN_ID="testing-test-id"

export CLI_LOGGER_LOG_LEVEL="info"
export CLI_LOGGER_PRETTY_PRINT="true"

# ENV vars for tests
# from project dir
export CLI_TEST_API_SPECS_ROOT_DIR="./data"
export CLI_TEST_ENABLE_API_CALL_LOGGING="false"

######################################################

NOLOG_CLI_SOLACE_CLOUD_TOKEN=$CLI_SOLACE_CLOUD_TOKEN
export CLI_SOLACE_CLOUD_TOKEN="***"

logName='[source.env.sh]'
echo "$logName - test environment:"
echo "$logName - CLI:"
export -p | sed 's/declare -x //' | grep CLI_
echo "$logName - CLI_TEST:"
export -p | sed 's/declare -x //' | grep CLI_TEST_

export CLI_SOLACE_CLOUD_TOKEN=$NOLOG_CLI_SOLACE_CLOUD_TOKEN

#!/usr/bin/env sh
set -ex

projectEnvVariables=$(ls -t /app/dist/assets/projectEnvVariables*.js | head -n1)

envsubst < "$projectEnvVariables" > ./projectEnvVariables_temp
cp ./projectEnvVariables_temp "$projectEnvVariables"
rm ./projectEnvVariables_temp

serve -s /app/dist -l $VITE_PORT --no-clipboard

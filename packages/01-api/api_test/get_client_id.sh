#! /bin/bash

echo "Get access token for test..."

# Get app client id and userpool id
USER_POOL_ID=$(aws ssm get-parameters --name "/cmtodoapi/prod/user-pool/id" \
  --query "Parameters[*].{Value:Value}" | jq -r '.[]["Value"]')
USER_POOL_CLIENT_ID=$(aws ssm get-parameters --name "/cmtodoapi/prod/app-client/id" \
  --query "Parameters[*].{Value:Value}" | jq -r '.[]["Value"]')

echo "USER_POOL_CLIENT_ID="${USER_POOL_CLIENT_ID}

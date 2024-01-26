#! /bin/bash

echo "Confirm test user..."

# Get app client id and userpool id
USER_POOL_ID=$(aws ssm get-parameters --name "/cmtodoapi/prod/user-pool/id" \
  --query "Parameters[*].{Value:Value}" | jq -r '.[]["Value"]')
USER_POOL_CLIENT_ID=$(aws ssm get-parameters --name "/cmtodoapi/prod/app-client/id" \
  --query "Parameters[*].{Value:Value}" | jq -r '.[]["Value"]')

echo "USER_POOL_ID="${USER_POOL_ID}
echo "USER_POOL_CLIENT_ID="${USER_POOL_CLIENT_ID}

# Create user
TEST_USER_NAME="testuser@test.com"
PASSWORD="Pass!-W0Rd"

aws cognito-idp sign-up \
  --client-id ${USER_POOL_CLIENT_ID} \
  --username ${TEST_USER_NAME} \
  --password ${PASSWORD}

# Confirm user
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id ${USER_POOL_ID} \
  --username ${TEST_USER_NAME}

echo "${TEST_USER_NAME} Confirmed."

#!/bin/bash
# Executed by LocalStack once it is ready.

set -e
echo "[LocalStack Init] Creating SQS queues..."

awslocal sqs create-queue --queue-name user-profile-requests   --region us-east-1
awslocal sqs create-queue --queue-name user-profile-responses  --region us-east-1
awslocal sqs create-queue --queue-name role-events             --region us-east-1
awslocal sqs create-queue --queue-name roles-sync-requests     --region us-east-1
awslocal sqs create-queue --queue-name user-events             --region us-east-1

echo "[LocalStack Init] Queues created:"
awslocal sqs list-queues --region us-east-1

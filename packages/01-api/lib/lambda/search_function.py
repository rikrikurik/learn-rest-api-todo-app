import boto3
from boto3.dynamodb.conditions import Key, Attr
import logging
import datetime
import json
import os
import traceback
import uuid
import base64

# Create logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']

# Create dynamodb client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(TABLE_NAME)


def getUserId(token: str):
    logging.info(f"{token=}")
    sections = token.split('.')
    logging.info(f"{sections=}")
    payload = base64.urlsafe_b64decode(
        sections[1] + '=' * (-len(sections[1]) % 4))
    logging.info(f"{payload=}")
    json_payload = json.loads(payload)
    logging.info(f"{json_payload=}")
    user_id = json_payload["cognito:username"]
    return user_id


def formatResult(response):
    count = response["Count"]
    items = response["Items"]
    result = {
        "count": count,
        "items": items
    }
    return result


def searchByTitle(user_id: str, keyword: str):
    options = {
        'Select': 'ALL_ATTRIBUTES',
        'KeyConditionExpression': Key('userId').eq(user_id),
        'FilterExpression': Attr('title').contains(keyword),
    }
    response = table.query(**options)
    return formatResult(response)


def searchByDueDate(user_id: str, start_date: str, end_date: str):
    options = {
        'Select': 'ALL_ATTRIBUTES',
        'KeyConditionExpression': Key('userId').eq(user_id),
        'FilterExpression': Attr('dueDate').between(start_date, end_date),
    }
    response = table.query(**options)
    return formatResult(response)


def handler(event, context):
    # Print received event
    logger.info(f"{event=}")
    try:
        # get user id from token
        token = event["headers"]["authorization"]
        user_id = getUserId(token=token)
        logger.info(f"{user_id=}")
        # get item info from event
        query_data = event['queryStringParameters']
        logger.info(f"{query_data=}")
        method = query_data['method']
        # search item
        if method == 'title':
            keyword = query_data['keyword']
            result = searchByTitle(user_id=user_id, keyword=keyword)
            logger.info(f"{result=}")
        elif method == 'duedate':
            start_date = query_data['start']
            end_date = query_data['end']
            result = searchByDueDate(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
            )
            logger.info(f"{result=}")
        else:
            raise ValueError(f"unknown search method: {method}")

    except Exception as err:
        # error
        logger.error('Function exception: %s', err)
        traceback.print_exc()
        logger.error('Failed to search item')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE',
            },
            'body': json.dumps({
                'err': f"lambda internal error: {err}",
            }),
        }

    # suceeded
    logger.info(f"Item found.")
    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE',
        },
        'body': json.dumps(result, ensure_ascii=False),
    }

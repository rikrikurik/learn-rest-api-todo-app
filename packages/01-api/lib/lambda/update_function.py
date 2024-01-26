import boto3
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


def updateItem(user_id: str, item_id: str, new_title: str,
               new_description: str, new_due_date: str):
    response = table.update_item(
        Key={
            "userId": user_id,
            "itemId": item_id,
        },
        UpdateExpression="set title=:t, description=:d, dueDate=:e",
        ExpressionAttributeValues={
            ':t': new_title,
            ':d': new_description,
            ':e': new_due_date
        },
        ConditionExpression='attribute_exists(userId) AND attribute_exists(itemId)'
    )
    return response


def handler(event, context):
    # Print received event
    logger.info(f"{event=}")
    item_data = json.loads(event['body'])
    logger.info(f"{item_data=}")
    try:
        # get user id from token
        token = event["headers"]["authorization"]
        user_id = getUserId(token=token)
        logger.info(f"{user_id=}")
        # get item info from event
        item_id = item_data['itemId']
        new_title = item_data['title']
        new_description = item_data['description']
        new_due_date = item_data['dueDate'] if 'dueDate' in item_data else 'none'
        # update item
        response = updateItem(user_id=user_id, item_id=item_id,
                              new_title=new_title, new_description=new_description,
                              new_due_date=new_due_date)
        logger.info(f"{response=}")

    except Exception as err:
        # error
        logger.error('Function exception: %s', err)
        traceback.print_exc()
        logger.error('Failed to update item')
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
    logger.info(f"Item updated. {item_id=}")
    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,PUT,GET,DELETE',
        },
        'body': json.dumps({
            'userId': user_id,
            'itemId': item_id,
            'title': new_title,
            'description': new_description,
            'dueDate': new_due_date,
        }),
    }

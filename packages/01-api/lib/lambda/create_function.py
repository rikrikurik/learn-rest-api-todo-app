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

# Create dynamodb client
dynamo_client = boto3.client('dynamodb')

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']


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


def createNewItem(user_id: str, item_id: str, title: str,
                  description: str, due_date: str):
    dynamo_client.put_item(
        TableName=TABLE_NAME,
        Item={
            "userId": {"S": user_id},
            "itemId": {"S": item_id},
            "title": {"S": title},
            "description": {"S": description},
            "dueDate": {"S": due_date},
        },
        ConditionExpression='attribute_not_exists(userId) AND attribute_not_exists(itemId)'
    )
    return


def handler(event, context):
    # Print received event
    logger.info(f"{event=}")
    try:
        # get user id from token
        token = event["headers"]["authorization"]
        user_id = getUserId(token=token)
        logger.info(f"{user_id=}")
        # get item info from event
        item_data = json.loads(event['body'])
        logger.info(f"{item_data=}")
        item_title = item_data['title']
        description = item_data['description']
        due_date = item_data['dueDate'] if 'dueDate' in item_data else 'none'
        # set uuid for new item
        item_id = str(uuid.uuid4())
        logger.info(f"{uuid=}")
        # create new item to the table
        createNewItem(user_id=user_id, item_id=item_id,
                      title=item_title, description=description,
                      due_date=due_date)

    except Exception as err:
        # error
        logger.error('Function exception: %s', err)
        traceback.print_exc()
        logger.error('Failed to create new item')
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
    logger.info(f"New item created. {item_id=}")
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
            'title': item_title,
            'description': description,
            'dueDate': due_date,
        }),
    }

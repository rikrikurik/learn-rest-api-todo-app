import * as cdk from '@aws-cdk/core';
import { ResourceName } from './resource_name';
import { CreateFunction } from './create_function';
import { DeleteFunction } from './delete_function';
import { UpdateFunction } from './update_function';
import { SearchFunction } from './search_function';
import { UserPool } from './user_pool';
import { Api } from './api';
import dynamodb = require('@aws-cdk/aws-dynamodb');

export interface ToDoAPIStackProps extends cdk.StackProps {
  resourceName: ResourceName;
}
export class ToDoAPIStack extends cdk.Stack {
  public todoTable: dynamodb.Table;
  public userPool: UserPool;
  public api: Api;

  constructor(scope: cdk.Construct, id: string, props: ToDoAPIStackProps) {
    super(scope, id, props);

    //==========================================================================
    // ユーザのToDo情報を格納するDynamoDBテーブルを作成
    this.todoTable = new dynamodb.Table(this, `table`, {
      tableName: props.resourceName.tableName(`user-data`),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 今回はスタック削除時にテーブルも削除
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "itemId",
        type: dynamodb.AttributeType.STRING,
      }
    });

    //==========================================================================
    // ユーザ認証用のCognito User Poolを作成
    this.userPool = new UserPool(this, `user-pool`, {
      resourceName: props.resourceName
    });

    //==========================================================================
    // 新規ToDoを登録するLambda Functionを作成する
    const createFunction = new CreateFunction(this, `create-function`, {
      resourceName: props.resourceName,
      todoTable: this.todoTable
    });

    //==========================================================================
    // 既存ToDoを削除するLambda Functionを作成する
    const deleteFunction = new DeleteFunction(this, `delete-function`, {
      resourceName: props.resourceName,
      todoTable: this.todoTable
    });

    //==========================================================================
    // 既存ToDoを更新するLambda Functionを作成する
    const updateFunction = new UpdateFunction(this, `update-function`, {
      resourceName: props.resourceName,
      todoTable: this.todoTable
    });

    //==========================================================================
    // ToDoを検索するLambda Functionを作成する
    const searchFunction = new SearchFunction(this, `search-function`, {
      resourceName: props.resourceName,
      todoTable: this.todoTable
    });

    //==========================================================================
    // 認証付きAPI Gatewayを作成する
    this.api = new Api(this, `api`, {
      resourceName: props.resourceName,
      userPool: this.userPool,
      createFunction: createFunction,
      deleteFunction: deleteFunction,
      updateFunction: updateFunction,
      searchFunction: searchFunction,
    });
  }
}

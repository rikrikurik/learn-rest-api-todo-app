import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { ResourceName } from './resource_name';
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');

export interface CreateFunctionProps {
  resourceName: ResourceName;
  todoTable: dynamodb.ITable;
}
export class CreateFunction extends cdk.Construct {
  function: lambda.Function;

  constructor(scope: cdk.Construct, id: string, props: CreateFunctionProps) {
    super(scope, id);

    //==========================================================================
    // Lambda FunctionのRoleを定義
    const lambdaRole = new iam.Role(this, `function-role`, {
      roleName: props.resourceName.roleName(`create-function`),
      description: `${props.resourceName.systemName} - new item create function role`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
      managedPolicies: [
        // Lambda用基本ポリシーを追加
        iam.ManagedPolicy.fromAwsManagedPolicyName(`service-role/AWSLambdaBasicExecutionRole`),
      ]
    });
    props.todoTable.grantReadWriteData(lambdaRole); // テーブルへの読み書き権限を追加

    //==========================================================================
    // 新規ToDoを登録するLambda Functionを作成する
    this.function = new lambda.Function(this, `function`, {
      functionName: props.resourceName.lambdaName(`create`),
      description: `${props.resourceName.systemName} - new item create function`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'create_function.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        'TABLE_NAME': props.todoTable.tableName
      }
    });

  }
}

import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { ResourceName } from './resource_name';
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');

export interface DeleteFunctionProps {
  resourceName: ResourceName;
  todoTable: dynamodb.ITable;
}
export class DeleteFunction extends cdk.Construct {
  function: lambda.Function;

  constructor(scope: cdk.Construct, id: string, props: DeleteFunctionProps) {
    super(scope, id);

    //==========================================================================
    // Lambda FunctionのRoleを定義
    const lambdaRole = new iam.Role(this, `function-role`, {
      roleName: props.resourceName.roleName(`delete-function`),
      description: `${props.resourceName.systemName} - delete item function role`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
      managedPolicies: [
        // Lambda用基本ポリシーを追加
        iam.ManagedPolicy.fromAwsManagedPolicyName(`service-role/AWSLambdaBasicExecutionRole`),
      ]
    });
    props.todoTable.grantReadWriteData(lambdaRole); // テーブルへの読み書き権限を追加

    //==========================================================================
    // ToDoアイテムを削除するLambda Functionを作成する
    this.function = new lambda.Function(this, `function`, {
      functionName: props.resourceName.lambdaName(`delete`),
      description: `${props.resourceName.systemName} - delete item function`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'delete_function.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        'TABLE_NAME': props.todoTable.tableName
      }
    });

  }
}

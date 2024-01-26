import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { ResourceName } from './resource_name';
import apigw = require('@aws-cdk/aws-apigatewayv2');
import apigwAuthorizer = require('@aws-cdk/aws-apigatewayv2-authorizers');
import apigwIntegration = require('@aws-cdk/aws-apigatewayv2-integrations');

import ssm = require('@aws-cdk/aws-ssm');
import { UserPool } from './user_pool';
import { CreateFunction } from './create_function';
import { DeleteFunction } from './delete_function';
import { UpdateFunction } from './update_function';
import { SearchFunction } from './search_function';

export interface ApiProps {
  resourceName: ResourceName;
  userPool: UserPool;
  createFunction: CreateFunction;
  deleteFunction: DeleteFunction;
  updateFunction: UpdateFunction;
  searchFunction: SearchFunction;
}

export class Api extends cdk.Construct {
  public restApi: apigw.HttpApi;
  public authorizer: apigwAuthorizer.HttpUserPoolAuthorizer;

  constructor(scope: cdk.Construct, id: string, props: ApiProps) {
    super(scope, id);

    //==========================================================================
    // API Gatewayを作成
    this.restApi = new apigw.HttpApi(this, 'rest-api', {
      apiName: `${props.resourceName.systemName}-api`,
    });

    //==========================================================================
    // 認証用Authorizerを作成
    this.authorizer = new apigwAuthorizer.HttpUserPoolAuthorizer({
      userPool: props.userPool.userPool,
      userPoolClient: props.userPool.client,
      identitySource: ['$request.header.Authorization']
    });

    //==========================================================================
    // APIのメソッドにLambda関数を統合

    // 新規ToDo登録関数をPOSTメソッドとして統合
    this.restApi.addRoutes({
      path: '/item',
      integration: new apigwIntegration.LambdaProxyIntegration({
        handler: props.createFunction.function,
      }),
      authorizer: this.authorizer,
      methods: [apigw.HttpMethod.POST]
    });

    // 既存ToDo削除関数をDELETEメソッドとして統合
    this.restApi.addRoutes({
      path: '/item',
      integration: new apigwIntegration.LambdaProxyIntegration({
        handler: props.deleteFunction.function,
      }),
      authorizer: this.authorizer,
      methods: [apigw.HttpMethod.DELETE]
    });

    // ToDo検索関数をGETメソッドとして統合
    this.restApi.addRoutes({
      path: '/item',
      integration: new apigwIntegration.LambdaProxyIntegration({
        handler: props.searchFunction.function,
      }),
      authorizer: this.authorizer,
      methods: [apigw.HttpMethod.GET]
    });

    // 既存ToDo更新関数をPUTメソッドとして統合
    this.restApi.addRoutes({
      path: '/item',
      integration: new apigwIntegration.LambdaProxyIntegration({
        handler: props.updateFunction.function,
      }),
      authorizer: this.authorizer,
      methods: [apigw.HttpMethod.PUT]
    });


    //==========================================================================
    // 作成されたApiのroot urlをSSMパラメータストアに登録
    // テストをしやすくする目的
    const apiUrl = new ssm.StringParameter(this, `api-url`, {
      parameterName: props.resourceName.ssmParamName(`api/url`),
      description: `${props.resourceName.systemName} - deployed api url`,
      stringValue: this.restApi.apiEndpoint
    });
  }
}

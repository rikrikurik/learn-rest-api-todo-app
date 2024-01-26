import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { ResourceName } from './resource_name';
import cognito = require('@aws-cdk/aws-cognito');
import ssm = require('@aws-cdk/aws-ssm');

export interface UserPoolProps {
  resourceName: ResourceName;
}
export class UserPool extends cdk.Construct {
  userPool: cognito.UserPool;
  fullAccessScope: cognito.ResourceServerScope;
  client: cognito.UserPoolClient;

  constructor(scope: cdk.Construct, id: string, props: UserPoolProps) {
    super(scope, id);

    //==========================================================================
    // API認証用のユーザープールを作成
    this.userPool = new cognito.UserPool(this, `user-pool`, {
      userPoolName: `${props.resourceName.systemName}-user-pool`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: false,
        requireDigits: false,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    //==========================================================================
    // APIアクセススコープを作成
    this.fullAccessScope = new cognito.ResourceServerScope({
      scopeName: '*',
      scopeDescription: 'Full access',
    });
    this.userPool.addResourceServer('ResourceServer', {
      identifier: 'item',
      scopes: [this.fullAccessScope,],
    });

    //==========================================================================
    // App Clientを作成
    this.client = new cognito.UserPoolClient(this, 'userpool-client', {
      userPool: this.userPool,
      userPoolClientName: `app-client`,
      generateSecret: false,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        custom: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    //==========================================================================
    // ユーザプールID, App client IDをSSMパラメータストアに保存 (テスト目的)
    const userPoolId = new ssm.StringParameter(this, `user-pool-id`, {
      parameterName: props.resourceName.ssmParamName(`user-pool/id`),
      description: `${props.resourceName.systemName} - deployed user pool id`,
      stringValue: this.userPool.userPoolId
    });

    const appCliendId = new ssm.StringParameter(this, `app-client-id`, {
      parameterName: props.resourceName.ssmParamName(`app-client/id`),
      description: `${props.resourceName.systemName} - deployed app client id`,
      stringValue: this.client.userPoolClientId
    });

  }
}

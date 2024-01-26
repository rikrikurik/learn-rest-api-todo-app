#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ToDoAPIStack } from '../lib/stack';
import { ResourceName } from '../lib/resource_name';

const app = new cdk.App();

//==============================================================================
// Context valueの取得とStack Env.の定義
const systemName = app.node.tryGetContext("system_name");
const systemEnv = app.node.tryGetContext("env");
const resourceName = new ResourceName(systemName, systemEnv);
const stackEnv = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
};
//==============================================================================

//==============================================================================
// スタックを作成
const stack = new ToDoAPIStack(app, 'APIStack', {
  stackName: `${systemName}`,
  description: `CMToDoAPI backend.`,
  env: stackEnv,
  resourceName: resourceName,
});
//==============================================================================

//==============================================================================
// タグ付け
cdk.Tags.of(stack).add("system", systemName);
cdk.Tags.of(stack).add("env", systemEnv);
//==============================================================================

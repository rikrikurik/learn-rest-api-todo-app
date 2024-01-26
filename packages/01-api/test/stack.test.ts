import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as todoAPI from '../lib/stack';
import { ResourceName } from '../lib/resource_name';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const resourceName = new ResourceName("testApp", "test");
    const stack = new todoAPI.ToDoAPIStack(app, 'TestStack', {
      resourceName: resourceName,
    });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});

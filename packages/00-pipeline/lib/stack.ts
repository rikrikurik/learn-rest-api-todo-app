import * as cdk from '@aws-cdk/core';
import { ResourceName } from './resource_name';
import codebuild = require('@aws-cdk/aws-codebuild');
import codecommit = require('@aws-cdk/aws-codecommit');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import actions = require('@aws-cdk/aws-codepipeline-actions');
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam');

export interface PipelineStackProps extends cdk.StackProps {
  resourceName: ResourceName,
}
export class PipelineStack extends cdk.Stack {
  public readonly srcRepos: codecommit.Repository;
  public readonly artifactBucket: s3.Bucket;
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: cdk.Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // CodeCommit ソースリポジトリ
    const srcReposName = props.resourceName.generalName(`src`);
    this.srcRepos = new codecommit.Repository(this, `src-repos`, {
      repositoryName: srcReposName,
      description: `CI/CD source repository for cmToDoAPI backend.`,
    });

    // ソースアーティファクトバケット
    const artifactBucketName = props.resourceName.bucketName(`src`);
    this.artifactBucket = new s3.Bucket(this, `src-artifact`, {
      bucketName: artifactBucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // CodePipeline パイプライン
    const pipelineName = props.resourceName.generalName(`deployment`);
    this.pipeline = new codepipeline.Pipeline(this, `pipeline`, {
      pipelineName: pipelineName,
      artifactBucket: this.artifactBucket,
      restartExecutionOnUpdate: false,
    });

    // パイプラインにソース取得ステージを追加
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new actions.CodeCommitSourceAction({
      actionName: 'Source',
      repository: this.srcRepos,
      output: sourceOutput,
      branch: `main`,
    });
    this.pipeline.addStage({
      stageName: 'GetSource',
      actions: [sourceAction],
    });

    // パイプラインにデプロイステージを追加
    const deploymentRole = new iam.Role(this, `deployment-role`, {
      roleName: props.resourceName.roleName(`deployment`),
      description: `${props.resourceName.systemName} deployment role.`,
      assumedBy: new iam.ServicePrincipal(`codebuild.amazonaws.com`),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(`PowerUserAccess`),
        iam.ManagedPolicy.fromAwsManagedPolicyName(`IAMFullAccess`),
      ]
    });
    const deployment = new codebuild.PipelineProject(this, "deployment", {
      projectName: props.resourceName.generalName(`deployment`),
      buildSpec: codebuild.BuildSpec.fromSourceFilename('./buildspec/buildspec.yml'),
      role: deploymentRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_3_0,
        environmentVariables: {
          AWS_DEFAULT_REGION: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: this.region,
          },
        },
        privileged: true,
      },
    });
    const cdkDeployAction = new actions.CodeBuildAction({
      actionName: 'Deployment',
      project: deployment,
      input: sourceOutput,
      runOrder: 1,
    });
    const deployStage = this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [cdkDeployAction]
    });
  }
}

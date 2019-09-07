import cdk = require('@aws-cdk/core');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipelineActions = require('@aws-cdk/aws-codepipeline-actions');
import codebuild = require('@aws-cdk/aws-codebuild');
import cicd = require('@aws-cdk/app-delivery');
import iam = require('@aws-cdk/aws-iam');
import { McServerInfraStack } from './mc_server_infra-stack';
import { McServerDNSStack } from './mc_server_dns-stack';

export class McServerPipelineStack extends cdk.Stack {
  public pipeline: codepipeline.Pipeline;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secretArn = 'arn:aws:secretsmanager:us-east-1:780350716816:secret:MCServerInfraGitHubToken-UGrFBW';
    const oauthToken = cdk.SecretValue.secretsManager(secretArn, {
      jsonField: 'MCServerInfraGitHubToken',
    });

    const sourceOutput = new codepipeline.Artifact();
    const source = new codepipelineActions.GitHubSourceAction({
      actionName: 'GitHub',
      repo: 'MCServerInfra',
      oauthToken,
      owner: 'Shahab96',
      output: sourceOutput,
    });

    const buildSpec = codebuild.BuildSpec.fromObject({
      version: '0.2',
      phases: {
        install: {
          commands: 'npm install',
        },
        build: {
          commands: [
            'npm run build',
            'npm run cdk synth -- -o dist',
          ],
        },
      },
      artifacts: {
        'base-directory': 'dist',
        files: '**/*',
      },
    });
    const project = new codebuild.PipelineProject(this, 'MinecraftPipelineBuildProject', {
      buildSpec,
    });
    const buildArtifact = new codepipeline.Artifact();
    const build = new codepipelineActions.CodeBuildAction({
      actionName: 'Bootstrap',
      input: sourceOutput,
      project,
      outputs: [buildArtifact],
    });

    const selfUpdate = new cicd.PipelineDeployStackAction({
      stack: this,
      input: buildArtifact,
      adminPermissions: true,
    });

    const serverStack = new McServerInfraStack(scope, 'McServerInfraStack', { env: props!.env });

    const deployPolicyPrincipal = new iam.ServicePrincipal('cloudformation.amazonaws.com');
    const deployPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cloudformation:*'],
      resources: [serverStack.stackId],
    });
    const deployRole = new iam.Role(this, 'MinecraftDeploymentRole', {
      assumedBy: deployPolicyPrincipal,
    });
    deployRole.addToPolicy(deployPolicyStatement);

    const deploy = new cicd.PipelineDeployStackAction({
      stack: serverStack,
      input: buildArtifact,
      adminPermissions: false,
      role: deployRole,
    });

    const dnsStack = new McServerDNSStack(scope, 'McServerDNSStack', {
      serverStack,
      env: props!.env,
    });
    const deployDNS = new cicd.PipelineDeployStackAction({
      stack: dnsStack,
      input: buildArtifact,
      adminPermissions: false,
      role: deployRole,
    });

    this.pipeline = new codepipeline.Pipeline(this, 'MinecraftServerPipeline', {
      restartExecutionOnUpdate: true,
      stages: [{
        stageName: 'Source',
        actions: [source],
      }, {
        stageName: 'Bootstrap',
        actions: [build],
      }, {
        stageName: 'SelfUpdate',
        actions: [selfUpdate],
      }, {
        stageName: 'Deploy',
        actions: [deploy],
      }, {
        stageName: 'DNSUpdate',
        actions: [deployDNS],
      }],
    });
  }
}
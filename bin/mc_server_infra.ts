#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { McServerPipelineStack } from '../lib/mc_server_pipeline-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new McServerPipelineStack(app, 'McServerPipelineStack', {
  env,
});

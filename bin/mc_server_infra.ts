#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { McServerInfraStack } from '../lib/mc_server_infra-stack';

const app = new cdk.App();
new McServerInfraStack(app, 'McServerInfraStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

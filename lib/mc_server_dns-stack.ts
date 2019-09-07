import cdk = require('@aws-cdk/core');
import route53 = require('@aws-cdk/aws-route53');
import { McServerInfraStack } from './mc_server_infra-stack';

interface DNSStackProps extends cdk.StackProps {
  serverStack: McServerInfraStack;
}

export class McServerDNSStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: DNSStackProps) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromLookup(this, 'Shahab96DomainHostedZone', {
      domainName: 'shahab96.com',
    });
    const recordName = 'minecraft.shahab96.com';
    const target = route53.RecordTarget.fromIpAddresses(props.serverStack.serverInstance.instancePublicIp);
    new route53.ARecord(this, 'MinecraftServerDNSRecord', {
      recordName,
      zone,
      target,
    });
  }
}
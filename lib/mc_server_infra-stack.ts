import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import route53 = require('@aws-cdk/aws-route53');

export class McServerInfraStack extends cdk.Stack {
  private serverInstance: ec2.Instance;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'MinecraftVPC');
    const machineImage = new ec2.WindowsImage(ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_CORE_BASE);
    const instanceType = ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO);
    const securityGroup = new ec2.SecurityGroup(this, 'MinecraftSecurityGroup', {
      vpc,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3389));
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(3389));

    this.serverInstance = new ec2.Instance(this, 'MinecraftServer', {
      vpc,
      instanceType,
      machineImage,
      securityGroup,
    });

    const zone = route53.HostedZone.fromLookup(this, 'Shahab96DomainHostedZone', {
      domainName: 'shahab96.com',
    });
    const recordName = 'minecraft.shahab96.com';
    const target = route53.RecordTarget.fromIpAddresses(this.serverInstance.instancePublicIp);
    new route53.ARecord(this, 'MinecraftServerDNSRecord', {
      recordName,
      zone,
      target,
    });
  }
}

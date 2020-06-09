import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as route53 from "@aws-cdk/aws-route53";

export class McServerInfraStack extends cdk.Stack {
  public serverInstance: ec2.Instance;
  public elasticIP: ec2.CfnEIP;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      maxAzs: 1,      
    });
    const machineImage = new ec2.AmazonLinuxImage();
    const instanceType = ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3_AMD, ec2.InstanceSize.MEDIUM);
    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(25565));

    this.serverInstance = new ec2.Instance(this, "MinecraftServer", {
      vpc,
      instanceType,
      machineImage,
      securityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      keyName: "MinecraftKeyPair",
    });

    const zone = route53.PublicHostedZone.fromHostedZoneAttributes(this, "HostedZone", {
      hostedZoneId: "Z2GCKEQH874TQR",
      zoneName: "shahab96.com",
    });
    const hostedZone = new route53.PublicHostedZone(this, "MinecraftHostedZone", {
      zoneName: `minecraft.${zone.zoneName}`,
    });
    new route53.RecordSet(this, "DelegationRecord", {
      recordType: route53.RecordType.NS,
      target: route53.RecordTarget.fromValues(...hostedZone.hostedZoneNameServers!),
      zone,
      recordName: hostedZone.zoneName,
    });
    const target = route53.RecordTarget.fromIpAddresses(this.serverInstance.instancePublicIp);
    new route53.ARecord(this, "MinecraftServerDNSRecord", {
      recordName: "minecraft.shahab96.com",
      zone: hostedZone,
      target,
    });
  }
}

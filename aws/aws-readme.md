# AWS Tutorial Roadmap

This roadmap moves from account setup to production-grade architecture. The sequence is intentional: secure the account first, understand the network next, then learn compute, data, integration, operations, and architecture patterns.

Basic Linux, HTTP, and SQL knowledge will help, but no prior AWS experience is required.

## Phase 1 - Foundations

1. [Cloud Basics and AWS Global Infrastructure](chapter-01-cloud-basics-and-aws-global-infrastructure.md)  
	Learn regions, Availability Zones, edge locations, and the shared responsibility model.
2. [AWS Account Setup and Cost Guardrails](chapter-02-aws-account-setup-and-cost-guardrails.md)  
	Protect the root user, enable MFA, set budgets, and avoid early billing mistakes.
3. [IAM Fundamentals](chapter-03-iam-fundamentals.md)  
	Understand users, groups, roles, policies, and least-privilege access.
4. [Console, CLI, and SDK Workflow](chapter-04-console-cli-and-sdk-workflow.md)  
	Learn when to use the console, automate with the CLI, and access services from code.

## Phase 2 - Networking and Compute

5. [VPC Fundamentals](chapter-05-vpc-fundamentals.md)  
	Cover CIDR blocks, subnets, route tables, internet gateways, NAT, security groups, and NACLs.
6. [EC2 Essentials](chapter-06-ec2-essentials.md)  
	Choose instance types, AMIs, storage, and pricing models for common workloads.
7. [Elastic Load Balancing and Auto Scaling](chapter-07-elastic-load-balancing-and-auto-scaling.md)  
	Distribute traffic, replace unhealthy instances, and scale with demand.
8. [Route 53 and DNS Routing](chapter-08-route-53-and-dns-routing.md)  
	Manage hosted zones, records, health checks, and failover or latency-based routing.

## Phase 3 - Storage and Databases

9. [S3 Object Storage](chapter-09-s3-object-storage.md)  
	Learn buckets, versioning, lifecycle rules, static hosting, and access control.
10. [EBS and EFS](chapter-10-ebs-and-efs.md)  
	Compare block storage and shared file storage for persistent workloads.
11. [RDS and Aurora](chapter-11-rds-and-aurora.md)  
	Study managed relational databases, backups, Multi-AZ setup, and read scaling.
12. [DynamoDB](chapter-12-dynamodb.md)  
	Focus on access patterns, partition-key design, throughput modes, and scaling behavior.
13. [ElastiCache](chapter-13-elasticache.md)  
	Use in-memory caching to reduce latency and offload databases.

## Phase 4 - Serverless and Integration

14. [Lambda](chapter-14-lambda.md)  
	Learn event-driven compute, concurrency, execution limits, and cold-start trade-offs.
15. [API Gateway](chapter-15-api-gateway.md)  
	Build secure APIs with throttling, stages, and service integrations.
16. [SQS, SNS, and EventBridge](chapter-16-sqs-sns-and-eventbridge.md)  
	Understand queues, pub/sub messaging, and event buses for decoupled systems.
17. [Step Functions](chapter-17-step-functions.md)  
	Orchestrate retries, branching, and long-running workflows without custom state logic.

## Phase 5 - Containers and Delivery

18. [ECR](chapter-18-ecr.md)  
	Store, scan, and version container images for deployment.
19. [ECS and Fargate](chapter-19-ecs-and-fargate.md)  
	Run containers on AWS without managing full server fleets.
20. [EKS Basics](chapter-20-eks-basics.md)  
	Use Kubernetes on AWS when workload portability and cluster control matter.
21. [Infrastructure as Code](chapter-21-infrastructure-as-code.md)  
	Use CloudFormation or CDK to make infrastructure repeatable and reviewable.
22. [CI/CD on AWS](chapter-22-ci-cd-on-aws.md)  
	Automate build, test, and deployment workflows with AWS delivery services.

## Phase 6 - Security, Operations, and Reliability

23. [CloudWatch](chapter-23-cloudwatch.md)  
	Collect metrics, logs, alarms, and dashboards for operational visibility.
24. [CloudTrail and AWS Config](chapter-24-cloudtrail-and-aws-config.md)  
	Audit activity, track configuration drift, and support compliance workflows.
25. [KMS, Secrets Manager, and Parameter Store](chapter-25-kms-secrets-manager-and-parameter-store.md)  
	Encrypt data and manage secrets without exposing credentials in code.
26. [WAF, Shield, and Cognito](chapter-26-waf-shield-and-cognito.md)  
	Protect applications from attacks and manage application-level identity.
27. [Backup and Disaster Recovery](chapter-27-backup-and-disaster-recovery.md)  
	Define backup plans, restore tests, RPO, RTO, and regional recovery strategies.
28. [Cost Optimization and Well-Architected Review](chapter-28-cost-optimization-and-well-architected-review.md)  
	Right-size services, remove waste, and evaluate designs against AWS best practices.

## Phase 7 - Advanced Architecture and Capstone

29. [Multi-Account and Landing Zone Design](chapter-29-multi-account-and-landing-zone-design.md)  
	Organize environments with AWS Organizations, SCPs, shared services, and centralized logging.
30. [Multi-Region Architecture](chapter-30-multi-region-architecture.md)  
	Plan for replication, failover, and global traffic routing across regions.
31. [Data and Analytics Services](chapter-31-data-and-analytics-services.md)  
	Explore Athena, Glue, Redshift, and Kinesis for reporting and streaming use cases.
32. [Capstone Project](chapter-32-capstone-project.md)  
	Build a secure, observable, scalable AWS application using the services learned above.

## Milestones

- Beginner outcome: Deploy a secure static site and a basic EC2-based application.
- Intermediate outcome: Design a VPC-based web application with managed storage, data, and monitoring.
- Advanced outcome: Ship an event-driven or containerized system with IaC, CI/CD, security controls, and cost discipline.

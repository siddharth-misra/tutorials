# 19: ECS and Fargate

Amazon Elastic Container Service (Amazon ECS) is AWS's container orchestration service, and AWS Fargate is a serverless compute option for running those containers. Together, they let you deploy applications in containers without building your own full container platform.

This chapter explains how tasks, services, clusters, and networking fit together at a high level. You will learn why some teams choose ECS on Amazon Elastic Compute Cloud (Amazon EC2) for more control, while others choose Fargate to reduce infrastructure management.

---

## 19.1 Why ECS and Fargate Matter

Containers package applications and dependencies into a consistent runtime unit, but containers still need an execution platform.

On AWS, Amazon Elastic Container Service, or Amazon ECS, provides a managed control plane for running and operating containers.

AWS Fargate is a launch model that lets you run ECS tasks without managing the underlying worker servers yourself.

These services matter because many teams want:

- more packaging consistency than raw virtual machines
- more control than purely function-based serverless workloads
- less operational burden than building a full Kubernetes platform immediately

For a solutions architect, ECS and Fargate provide a middle ground between EC2 and higher-abstraction serverless compute. They are often a strong choice when the workload needs long-running services, custom runtimes, or container-native deployment patterns without adopting Kubernetes complexity too early.

---

## 19.2 The ECS Service Model

![ECS and Fargate runtime model with task definitions, service desired count, load balancer health, rollout control, and autoscaling.](images/ch19-ecs-fargate-service-runtime.svg)

ECS organizes container workloads through a few core concepts.

### Cluster

A cluster is the logical grouping where tasks and services run.

### Task definition

A task definition describes how one or more containers should run, including:

- container images
- CPU and memory settings
- environment configuration
- networking mode details
- log configuration

### Task

A task is a running instance of a task definition.

### Service

A service keeps the desired number of task instances running and can integrate with load balancers and scaling policies.

This model matters because it separates workload description from runtime state. The task definition declares what should run, and the service tries to keep that desired state true over time.

That is a major operational step up from manually starting containers on hosts.

---

## 19.3 ECS on EC2 vs ECS on Fargate

ECS supports different launch models.

### ECS on EC2

In this model, you manage the EC2 instances that provide container capacity.

That gives you more control over:

- host sizing
- special runtime dependencies
- daemon-level customization
- packing multiple workloads onto shared instances

But it also means you manage:

- instance patching
- capacity planning
- host scaling
- AMI and runtime maintenance

### ECS on Fargate

In this model, AWS manages the underlying compute hosts.

You focus on task sizing and workload definition instead of server fleet management.

This is attractive when:

- you want operational simplicity
- workloads vary enough that per-task isolation is useful
- the team does not want to manage container hosts directly

The trade-off is reduced low-level host control and a cost model that may differ from heavily optimized EC2 fleets.

The architect question is not, "Is Fargate modern?" It is, "Do we benefit more from simplified operations or from deeper host-level control and capacity optimization?"

---

## 19.4 Networking, Load Balancing, and Service Exposure

Containerized services still need clear network boundaries.

In AWS, ECS tasks commonly run inside VPC subnets and are exposed through load balancers when they serve traffic.

Important design decisions include:

- whether tasks run in public or private subnets
- how inbound traffic reaches them
- whether they need internet egress through NAT or private endpoints
- which security groups apply to the service

For production workloads, common patterns include:

- public Application Load Balancer in public subnets
- ECS tasks in private subnets
- databases and sensitive backends in more restricted private tiers

The network design should make it obvious which components are publicly reachable and which are not. Containers do not change the underlying VPC fundamentals. They just add another deployment unit inside that network model.

---

## 19.5 Scaling, Deployments, and Health Management

ECS services can scale task count based on demand and can replace unhealthy tasks automatically.

This supports a more resilient operating model, but only if health criteria are meaningful.

Key concerns include:

- container health checks
- load balancer target health
- task restart behavior
- auto scaling based on CPU, memory, queue depth, or other metrics

Deployment strategy matters too.

Rolling deployments can gradually replace tasks with a new version, but architects still need to think about:

- how much spare capacity is available during rollout
- what happens if startup is slow
- whether the application is backward compatible during mixed-version windows

If the application fails readiness checks or opens connections too slowly, deployment behavior will look unreliable even when ECS itself is behaving correctly.

---

## 19.6 Storage, Configuration, and Secrets

Containers should generally be treated as replaceable runtime units.

That means you should assume:

- a task can stop and be recreated elsewhere
- local container filesystem state is not the source of truth
- durable data belongs in external services or persistent storage designed for that access pattern

Configuration should also be managed deliberately.

Good practice includes:

- environment-specific configuration handled outside the container image
- secrets stored in services such as Secrets Manager or Parameter Store
- image artifacts kept environment-neutral where possible

The more environment assumptions you bake into the image, the less portable and trustworthy the deployment artifact becomes.

---

## 19.7 IAM, Isolation, and Security Boundaries

Container platforms can create false confidence if the security model is vague.

For ECS, you should separate:

- the permissions used by the platform to pull images and start tasks
- the permissions that the running application needs at runtime

Runtime workloads should use task roles or equivalent mechanisms instead of baked-in credentials.

Other important security concerns include:

- least-privilege network access through security groups
- restricted image-pull permissions from ECR
- vulnerability management for container images
- careful review of which services share clusters or environments

Isolation is not just a technical setting. It is also an account, network, and operational-boundary question.

---

## 19.8 Observability, Cost, and Operations

A container platform is only useful if operators can see what the workloads are doing.

You should plan for:

- application logs
- container and service metrics
- deployment event visibility
- alarms on task failures, unhealthy targets, and scaling anomalies

Cost differs significantly between ECS on EC2 and ECS on Fargate.

Fargate often reduces operational burden, but EC2 can be more cost-efficient for steady, dense workloads when the team can manage the fleet well.

Operationally, the real trade-off is usually:

- lower platform management effort with Fargate
- greater packing efficiency and customization potential with EC2

That trade-off should be evaluated with real workload shape, not marketing assumptions.

---

## 19.9 ECS and Fargate Design Patterns and Decision Criteria

ECS is a strong fit when you want managed container orchestration on AWS without taking on full Kubernetes complexity immediately.

Good fit patterns include:

- stateless web services behind load balancers
- asynchronous workers pulling from queues
- APIs that need long-running container processes
- services that benefit from container packaging but not Kubernetes-level extensibility

An architect checkpoint should review:

- whether the workload should run on ECS or another compute model entirely
- whether Fargate or EC2 gives the better operations-to-cost trade-off
- how scaling signals map to business demand
- where configuration, secrets, and durable state live
- whether deployment safety and observability are adequate

If those answers are clear, ECS is often one of the most pragmatic AWS runtime choices.

---

## 19.10 Common Mistakes

- moving to containers without deciding whether the workload really needs long-running services
- choosing Fargate or EC2 based on brand preference instead of operational and cost trade-offs
- placing tasks in public subnets when a private-subnet plus load-balancer design is safer
- treating container filesystems as durable state
- baking secrets or environment-specific configuration into images
- using weak health checks that fail to represent application readiness
- forgetting to separate platform permissions from application runtime permissions
- scaling services without considering downstream connection and database limits
- deploying new task revisions without a clear rollback and visibility strategy
- assuming containers automatically improve reliability without good networking, logging, and deployment discipline

---

## 19.11 Hands-On Tasks

1. Create a task definition for a small containerized web application.
2. Run that workload once as a task and then as a service.
3. Compare what changes operationally between ECS on EC2 and ECS on Fargate.
4. Place the service behind an Application Load Balancer and verify health behavior.
5. Configure logs so task output is visible centrally.
6. Inject a secret through a managed mechanism instead of baking it into the image.
7. Add a scaling policy and explain which metric should drive it.
8. Describe one workload that should stay on ECS and one that should move to Lambda or EKS instead.

---

## 19.12 Recap

- ECS is AWS's managed container orchestration service for running tasks and services.
- Fargate removes host management, while ECS on EC2 offers deeper control and potentially better packing efficiency.
- Networking, load balancing, health checks, and scaling behavior are central to production container design.
- Durable state, secrets, and configuration should live outside replaceable container instances.
- IAM boundaries, image hygiene, and observability shape container security and operability.
- ECS is often the pragmatic middle path between raw servers and full Kubernetes adoption.

Next: 20: EKS Basics

# 23: CloudWatch

Amazon CloudWatch is a core observability service for AWS workloads. It collects and works with metrics, logs, alarms, dashboards, and events so operators can see what a system is doing and respond when something goes wrong.

This chapter explains why monitoring is an active part of running production systems, not just a reporting tool. You will learn how CloudWatch helps teams detect failures, track performance, and build operational awareness around applications and infrastructure.

---

## 23.1 Why CloudWatch Matters

You cannot operate a production system you cannot observe.

In AWS, workloads are distributed across managed services, networks, compute platforms, queues, and storage systems. Failures rarely announce themselves clearly. Instead, they show up as rising latency, retry storms, queue buildup, elevated error rates, throttling, or missing business events. CloudWatch is one of the main services AWS gives you to detect those signals.

CloudWatch matters because it helps answer operational questions such as:

- Is the system healthy right now?
- Is performance degrading?
- Did a deployment increase errors?
- Are requests being throttled?
- Is a backlog growing faster than workers can drain it?
- Did something stop running entirely?

This is not only about incident response. Good monitoring improves design quality. When architects think early about what must be measured, they often expose weak assumptions in scaling, failure handling, and ownership boundaries.

---

## 23.2 What CloudWatch Actually Provides

CloudWatch is not one single feature. It is a set of observability capabilities that work together.

The most important building blocks are:

- metrics for numeric time-series data such as CPU usage, request count, duration, and error count
- logs for application, platform, and service-generated text events
- alarms for threshold- or condition-based alerting
- dashboards for visualizing operational state
- events and automation hooks that can trigger remediation or downstream workflows

This distinction matters. A metric tells you that something changed. A log helps explain why. An alarm decides when the change is important enough to act on.

In practice, mature monitoring combines all three. If your team only has logs, you will struggle to see trends. If you only have metrics, root-cause analysis becomes slow. If you have no alarms, the system may be observable but still operationally unmanaged.

---

## 23.3 Metrics, Dimensions, and Resolution

Metrics are numeric data points published over time. AWS services emit many built-in metrics automatically. EC2 publishes host-level metrics, Application Load Balancers publish request and latency metrics, Lambda publishes invocation and error metrics, and SQS publishes queue depth and age metrics.

Metrics are usually scoped with dimensions. A dimension is metadata that identifies the resource or context for the measurement.

Examples:

- EC2 CPU utilization by instance ID
- Lambda errors by function name
- ALB request count by load balancer and target group

Dimensions matter because they define what you can isolate operationally. If you aggregate everything too early, you may hide failures in a single resource. If you fragment too aggressively, you may create noisy dashboards and alarms that no one trusts.

CloudWatch also supports different metric resolutions. Standard-resolution metrics are sufficient for many workloads, but high-resolution metrics can be useful for latency-sensitive or bursty systems where a one-minute view hides operational spikes.

The design question is not whether more data is better. The design question is whether the chosen metric granularity helps someone make a better operational decision.

---

## 23.4 Logs and Log Groups

Logs capture detailed events rather than numeric summaries. They are essential when you need to inspect requests, application behavior, exceptions, or state transitions.

CloudWatch Logs organizes records into log groups and log streams:

- a log group is the retention and access boundary for a logical source
- a log stream is a sequence of events from a specific producer, such as a Lambda execution environment or an EC2 agent source

Common log sources include:

- Lambda function output
- VPC Flow Logs
- API Gateway execution logs
- ECS container logs
- application logs shipped from EC2 or on-premises hosts through the CloudWatch agent

Log retention matters. Keeping everything forever is expensive and operationally lazy. Retention should reflect investigation needs, compliance needs, and cost. A common pattern is short retention for verbose debug-style logs and longer retention for security-relevant or audit-supporting data.

Teams also need logging discipline:

- structure logs where possible, usually as JSON
- avoid logging secrets, tokens, or personal data
- include request IDs, correlation IDs, or tenant identifiers when appropriate
- log meaningful state changes, not only stack traces

Without those habits, CloudWatch Logs becomes a storage bucket for noise rather than a useful operational tool.

---

## 23.5 Alarms and Alert Design

![CloudWatch observability loop showing metrics and logs, alarm evaluation, responder actions, troubleshooting queries, and tuning feedback.](images/ch23-cloudwatch-observability-loop.svg)

An alarm turns observation into action. It evaluates a metric or expression and changes state when a condition is met.

Alarms sound simple, but alert design is one of the places where operational maturity is most visible.

Poor alarms create two bad outcomes:

- alert fatigue, where engineers ignore alarms because they are noisy or low-value
- silent failure, where nothing fires because thresholds were chosen without understanding system behavior

Useful alarm design usually follows these principles:

- alert on symptoms users or operators care about
- distinguish urgent paging alerts from informational notifications
- use evaluation periods that smooth short-lived noise without masking real incidents
- combine metrics when a single threshold is misleading
- review alarms after incidents and after architecture changes

For example, a high CPU alarm on one EC2 instance may not matter if Auto Scaling is already replacing or distributing load correctly. A sustained increase in ALB 5xx errors or Lambda throttles is usually much more actionable.

Alarm actions can notify an Amazon SNS topic, trigger automation, or integrate with incident management workflows. The point is not simply to know something is wrong. The point is to route the right signal to the right responder at the right urgency level.

---

## 23.6 Dashboards, Service Views, and Operational Context

Dashboards help teams see related signals together.

A useful dashboard is not a random collection of charts. It should reflect an operational question or an ownership boundary.

Examples:

- a web application dashboard showing request rate, latency, 4xx and 5xx errors, target health, and database load
- a serverless workflow dashboard showing Lambda duration, error count, SQS queue depth, and DLQ activity
- a platform dashboard showing deployment frequency, alarm state, and infrastructure saturation across environments

Good dashboards do three things:

- show system state at a glance
- help on-call engineers narrow the problem area quickly
- expose trends that suggest scaling, tuning, or architectural work is needed

Dashboards are most effective when they reflect service relationships rather than organizational guesswork. If one team owns an API, a queue, and a Lambda consumer path, the dashboard should show the end-to-end chain, not only one isolated service.

---

## 23.7 Logs Insights, Queries, and Troubleshooting Flow

CloudWatch Logs becomes much more powerful when teams query it instead of manually scrolling through raw events.

CloudWatch Logs Insights lets you search and aggregate log data to answer questions such as:

- Which errors increased in the last hour?
- Which tenant or path is producing the highest latency?
- Did failures begin right after a deployment?
- Are timeouts concentrated in one dependency?

This is where structured logging pays off. If logs include fields such as request ID, status code, user identifier, route, or dependency name, you can group and filter on those values instead of relying on free-text guesswork.

A common troubleshooting workflow looks like this:

1. An alarm fires on an elevated error or latency metric.
2. The dashboard narrows the problem to a service or dependency.
3. Logs Insights finds the affected routes, tenants, or failure classes.
4. Engineers correlate the timing with deployments, config changes, or dependency issues.

This metric-to-log workflow is one of the core operational habits CloudWatch supports.

---

## 23.8 CloudWatch in a Solutions Architect Design Review

When reviewing an AWS design, architects should ask observability questions before the workload ships.

Useful review questions include:

- What are the service-level indicators for this workload?
- Which failures are detectable within minutes?
- How will on-call engineers know whether the problem is demand, dependency, configuration, or deployment related?
- What metrics prove the scaling model is working?
- Where are logs stored, how long are they retained, and who can access them?
- Which alarms page humans, and which only create tickets or notifications?

This review matters because observability gaps are cheaper to fix before launch than after an outage.

A strong mental model is to monitor across four layers:

- business signals, such as order completion or payment success rate
- application signals, such as latency and error rate
- infrastructure or managed service signals, such as CPU, concurrency, queue age, or storage pressure
- security and audit signals, which are expanded further in later chapters with CloudTrail, Config, and related services

If a system is only monitored at the infrastructure layer, teams often miss failures that affect users but not host health.

---

## 23.9 Cost, Scale, and Retention Trade-Offs

Observability is not free.

CloudWatch cost can grow through:

- custom metrics
- high-cardinality dimensions
- large log volumes
- long retention periods
- alarm counts and dashboard usage in large environments

That does not mean you should under-monitor. It means monitoring should be designed deliberately.

Typical cost-control practices include:

- publishing only metrics that lead to operational decisions
- avoiding unnecessary per-request custom metrics with extreme cardinality
- setting log retention instead of accepting indefinite storage
- separating verbose debug logs from durable operational or security logs
- aggregating where detail is not operationally useful

There is also a scaling trade-off. Large environments often need naming conventions, tagging, centralized dashboard patterns, and account-level logging standards. Without those, teams produce fragmented observability that works for one service but fails at organizational scale.

---

## 23.10 Common Mistakes

- treating CloudWatch as a dashboard service only instead of an end-to-end monitoring system
- creating alarms on every metric without deciding which ones require human action
- relying on host metrics while ignoring application latency, error rates, and business outcomes
- keeping logs indefinitely without retention rules or cost review
- logging secrets, credentials, tokens, or personal data
- publishing custom metrics with high-cardinality dimensions that are expensive and hard to use
- building dashboards that show many charts but answer no operational question
- waiting until after production incidents to decide what should have been monitored

---

## 23.11 Hands-On Tasks

1. Open CloudWatch and identify built-in metrics for EC2, Lambda, and SQS.
2. Choose one workload pattern, such as a web API or asynchronous worker, and define five metrics you would track first.
3. Write down one alarm that should page an engineer and one that should only create a ticket.
4. Describe a log retention policy for application logs, security-relevant logs, and short-lived debug logs.
5. Explain how you would investigate a sudden increase in API latency using metrics, dashboards, and logs together.

---

## 23.12 Recap

CloudWatch gives AWS workloads their basic operational visibility. Metrics show trends and health signals, logs explain behavior in detail, alarms decide when action is required, and dashboards provide shared context for operators. Good CloudWatch design is not about collecting everything. It is about collecting the signals that help teams detect, diagnose, and respond to real problems quickly and safely.

Next: CloudTrail and AWS Config

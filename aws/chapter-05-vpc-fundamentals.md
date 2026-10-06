# 5: VPC Fundamentals

Amazon Virtual Private Cloud (Amazon VPC) is the networking layer for many AWS workloads. It gives you a private network boundary where you choose IP ranges, divide resources into subnets, and control how traffic enters, leaves, and moves between systems.

This chapter explains why VPC design matters for both security and reliability. You will learn how ideas like Classless Inter-Domain Routing (CIDR) blocks, route tables, internet access, Network Address Translation (NAT), security groups, and network access control lists (ACLs) work together at a high level.

---

## 5.1 Why VPC Matters

Most AWS workloads do not fail because a virtual machine could not boot. They fail because the network design was unclear, overly open, or too tightly coupled to a single failure domain.

Amazon VPC is the network boundary for many AWS services. It decides:

- which private IP ranges your resources can use
- which resources can be reached from the internet
- which subnets live in which Availability Zones
- how traffic flows between subnets, gateways, and external networks
- how much network isolation exists between application layers

For a solutions architect, VPC is not just a place to launch EC2 instances. It is the base layer for security, availability, and traffic control.

---

## 5.2 What a VPC Actually Is

An Amazon VPC is a logically isolated virtual network inside an AWS region.

Inside that VPC, you define address ranges and divide them into subnets. You then attach routing and security controls to determine how traffic should move.

That isolation is logical, not magical. A workload is not secure just because it lives inside a VPC. If an instance has a public IP address, an internet path, and permissive security rules, it can still be directly exposed.

Important boundaries to remember:

- A VPC is regional.
- Subnets live in one Availability Zone each.
- Security groups attach to resources such as EC2 instances and elastic network interfaces.
- Route tables decide where traffic goes, but they do not inspect whether the traffic should be allowed.

This means networking in AWS is made of multiple layers working together:

- addressing
- placement
- routing
- ingress and egress control

If you confuse those layers, troubleshooting becomes slow and designs become risky.

---

## 5.3 CIDR Blocks and Address Planning

Every VPC starts with an IPv4 Classless Inter-Domain Routing, or CIDR, block such as `10.0.0.0/16`.

That range defines how many private IP addresses the VPC can use.

The prefix length matters:

- a smaller prefix number such as `/16` gives a larger address space
- a larger prefix number such as `/24` gives a smaller address space

There are also AWS-specific planning consequences:

- each subnet reserves a small set of addresses for AWS use
- very small subnets can run out of usable addresses earlier than beginners expect
- aggressive subnet fragmentation makes future redesign harder

For beginners, the important lesson is not binary math. It is planning.

You should choose a CIDR block that:

- leaves room for growth
- does not overlap with on-premises or other cloud networks you may later connect to
- supports multiple subnets across multiple Availability Zones

Common planning mistake:

- choosing a tiny range that works for one demo but blocks future expansion

Production-aware planning questions:

- Will this VPC later connect to a corporate network over VPN or Direct Connect?
- Will you need separate subnets for web, application, database, and internal services?
- Will multiple environments eventually need to peer or connect through a transit design?

One practical pattern is to allocate a VPC CIDR block large enough to leave unused space for later subnet tiers, extra Availability Zones, or service growth. Running out of address space in a live environment is one of those problems that looks small during setup and expensive during migration.

If overlapping address ranges exist, future connectivity becomes painful. Network address translation can sometimes hide the problem, but it is usually an architectural tax rather than a good design.

---

## 5.4 Subnets and Availability Zone Design

A subnet is a slice of the VPC CIDR range that exists in exactly one Availability Zone.

Subnets are where resources are actually placed.

The most common high-level split is:

- public subnets for internet-facing load balancers, bastion patterns, or edge-facing components
- private subnets for application servers, internal services, and databases

Some teams also distinguish isolated subnets:

- isolated private subnets with no route to an internet gateway and no route to a NAT gateway

That isolated pattern is common for databases and tightly controlled internal services.

Two rules matter immediately:

- A subnet does not become public because of its name.
- A subnet becomes public only when its route table includes a route to an internet gateway and the resource can receive a public IP or public entry point.
- A resource in a public subnet is still not directly reachable from the internet if it has no public IP address and is not behind a public-facing service.

Good subnet design usually includes one subnet of each needed type in each Availability Zone you plan to use. For example, in a two-AZ design you might create:

- public subnet A
- public subnet B
- private application subnet A
- private application subnet B
- private data subnet A
- private data subnet B

This gives you better fault isolation and cleaner separation between tiers.

---

## 5.5 Route Tables and Traffic Flow

Route tables tell AWS where traffic should go next.

Each subnet is associated with a route table, and that table contains rules such as:

- local traffic for the VPC CIDR stays inside the VPC
- internet-bound traffic goes to an internet gateway
- outbound traffic from private subnets goes to a NAT gateway
- traffic to another network goes to a virtual private gateway, transit gateway, or peering target

AWS uses the most specific matching route. That matters when a subnet has multiple possible destinations, such as local VPC traffic, internet egress, and connectivity to another private network.

Routing answers the question, "Where should this packet go?"

It does not answer the question, "Should this packet be allowed?"

That distinction matters because teams often debug the wrong layer. A route can be correct while a security group blocks the traffic. A security group can be open while the route is missing.

A useful way to reason about VPC routing is to trace one inbound flow and one outbound flow:

1. A user request reaches a public load balancer in a public subnet.
2. The load balancer forwards the request to an application target in a private subnet.
3. The application reaches a database in a private or isolated data subnet.
4. If the application needs software updates or a third-party API, outbound traffic leaves through a NAT path from the private subnet.

If you cannot describe the route for each step, the design is not fully understood yet.

Architecturally, route tables should reflect intent clearly. If every subnet shares one route table with mixed behavior, the design becomes harder to reason about and easier to misconfigure.

---

## 5.6 Internet Gateways and Public Connectivity

An internet gateway, or IGW, allows communication between a VPC and the public internet.

Attaching an internet gateway to a VPC does not automatically make everything public.

For a resource to be internet-reachable, several things usually need to line up:

- the VPC has an attached internet gateway
- the subnet route table sends internet-bound traffic to that internet gateway
- the resource has a public IP address or sits behind a public-facing load balancer
- security controls allow the intended traffic

This layered model is useful because it prevents accidental exposure from a single misstep.

In production, direct internet exposure should be limited. Common patterns include:

- public Application Load Balancer in public subnets
- NAT gateways in public subnets for private-tier outbound traffic
- application instances in private subnets
- databases in private subnets with no direct internet path

That is why many well-designed VPCs use public subnets for infrastructure edge components, not for the main application runtime itself.

That reduces attack surface and creates a cleaner trust boundary.

---

## 5.7 NAT Gateways and Private Outbound Access

Private subnets are often meant to avoid inbound internet access while still allowing outbound connections.

Typical reasons include:

- downloading operating system updates
- reaching third-party APIs
- pulling packages or container layers
- calling AWS public service endpoints when private endpoints are not used

This is where a NAT gateway is commonly used.

A NAT gateway sits in a public subnet and lets resources in private subnets initiate outbound connections to the internet without allowing unsolicited inbound connections from the internet back to them.

The production trade-offs are important:

- NAT gateways are operationally simple compared with self-managed NAT instances
- NAT gateways add cost per hour and per gigabyte processed
- if you place only one NAT gateway in one Availability Zone, private subnet egress can become an availability and data transfer concern

NAT gateways also solve a specific problem only: outbound internet access initiated from private resources. They do not make a private subnet publicly reachable, and they are not a substitute for a load balancer, a bastion pattern, or remote administration design.

Many production designs place one NAT gateway per Availability Zone and keep private subnets in each AZ routed to the NAT gateway in the same AZ. This improves resilience and avoids unnecessary cross-AZ traffic charges.

Another production consideration is whether the traffic really needs general internet egress at all. If the workload mostly talks to AWS services such as object storage or managed data services, private connectivity options may reduce NAT dependence, cost, and public-path exposure. The main lesson is to use NAT where it fits, not as the default answer to every outbound traffic need.

The quickest way to test whether you understand subnet behavior is to map each subnet type to its route target and exposure model:

![Public, private, and isolated subnet behavior within a VPC, showing which route tables point to an internet gateway, which point to a NAT gateway, and which keep only local routes.](images/ch05-subnet-reachability-and-routing.svg)

*Figure: Public, private, and isolated subnets are defined by routing and exposure, not by the subnet name.*

---

## 5.8 Security Groups and Network ACLs

Security groups and network access control lists, or NACLs, are both network security controls, but they operate differently.

### Security groups

Security groups are attached to resources.

Important traits:

- stateful
- allow rules only
- return traffic is automatically allowed for approved flows

Stateful behavior is the reason security groups are usually easier to operate. If you allow an inbound application flow, the return path does not need a second mirrored rule.

Security groups are the primary day-to-day control for workload traffic.

Examples:

- allow HTTPS from the internet to a load balancer
- allow application instances to receive traffic only from the load balancer security group
- allow database access only from the application security group

Referencing one security group from another is powerful because it expresses trust by workload role instead of by broad IP range.

This is usually a cleaner design than allowing large internal CIDR ranges everywhere. It lets you say, in effect, "only resources in this application tier may talk to this database tier."

### Network ACLs

NACLs are attached to subnets.

Important traits:

- stateless
- explicit allow and deny rules
- evaluated in numbered order

Stateless behavior means both directions of a flow must be considered. That is where many NACL problems begin. A request may be allowed in one direction while the return traffic fails because the corresponding response path was never permitted.

NACLs are usually a coarse-grained subnet guardrail, not the primary application security mechanism.

This is especially relevant for ephemeral response ports. A design that looks correct at the application port level can still fail if the NACL blocks return traffic patterns.

For many beginner and intermediate designs, careful security group usage matters more than complex NACL tuning. Overusing NACLs early often adds confusion without adding meaningful protection.

![Security groups versus NACLs, showing stateful resource-level rules, stateless subnet-level rules, and the need for explicit ephemeral-port return rules in NACLs.](images/ch05-security-groups-vs-nacl.svg)

*Figure: Security groups protect resources with stateful allow logic, while NACLs filter entire subnets and require explicit bidirectional rules.*

---

## 5.9 Core VPC Patterns, Traffic Walkthroughs, and Architect Decisions

One common baseline pattern is a multi-AZ three-tier architecture:

- public subnets contain the internet-facing load balancer
- private application subnets contain EC2 instances or container tasks
- private data subnets contain databases and internal data services

This pattern supports several good architectural defaults:

- internet exposure is limited to a small set of entry points
- application compute can scale privately
- databases remain non-public
- failure in one Availability Zone does not necessarily take down the whole workload

You can test whether the design is sound by walking one realistic request through it:

1. A client reaches the internet-facing load balancer.
2. The load balancer sends traffic only to healthy targets in private application subnets.
3. The application talks to the database on the minimum required port.
4. Outbound dependency calls leave through a controlled private egress path.
5. No tier accepts broader traffic than it needs.

This kind of walkthrough exposes mistakes quickly. If a database subnet needs no inbound internet access and no outbound internet access, it should not quietly inherit those paths from a shared route or shared subnet type.

When reviewing a VPC design, ask these questions:

- Which resources actually need inbound internet access?
- Which resources only need outbound internet access?
- Are subnets spread across enough Availability Zones for the availability target?
- Is the CIDR plan large enough for future environments and integrations?
- Are routing and security controls simple enough to audit?
- Can operators explain the traffic path from user request to database response?

When troubleshooting connectivity, a practical order is:

1. confirm the source and destination addresses or services
2. confirm the route exists
3. confirm security groups permit the flow
4. confirm any NACL rules allow both directions when relevant
5. confirm the target is actually healthy and listening

If the answer to the last question is unclear, the network design is probably too implicit.

![Multi-AZ three-tier VPC pattern showing internet entry at public ALB nodes, private application subnets, non-public data subnets, and same-AZ NAT egress for private workloads.](images/ch05-vpc-multi-az-traffic.svg)

*Figure: A resilient baseline VPC keeps public entry at the load balancer, application compute private, data non-public, and private egress local to each Availability Zone.*

---

## 5.10 Common Mistakes

- treating public and private as naming labels instead of routing behavior
- putting databases in public subnets because it seems simpler
- choosing overlapping CIDR ranges that block future connectivity
- choosing subnet sizes so small that normal growth or reserved addresses become a problem quickly
- using one flat subnet design for every workload tier
- enabling public IP assignment in places that were intended to stay private
- exposing EC2 instances directly when a load balancer would be safer
- assuming a NAT gateway provides inbound reachability when it only supports outbound initiated traffic
- relying only on NACLs while leaving security groups overly broad
- breaking traffic with stateless NACL rules that do not account for response paths
- deploying only one NAT gateway for a multi-AZ production workload without understanding the availability and cost trade-off
- treating the default VPC as a production design instead of a convenience starting point
- debugging only security groups when the route table is actually wrong

---

## 5.11 Hands-On Tasks

1. Create a VPC design on paper or in a diagram with a `/16` CIDR range.
2. Divide it into public and private subnets across at least two Availability Zones.
3. Write down which route table each subnet should use.
4. Explain why a public subnet needs an internet gateway route.
5. Explain why a private subnet may still need outbound access through NAT.
6. Define one security group for a load balancer, one for an application tier, and one for a database tier.
7. Describe whether each layer should accept traffic from the internet, from another security group, or from nowhere.
8. Review your design and identify whether any address ranges could cause overlap with future networks.
9. Trace one user request from the internet to the load balancer, then to the application tier, then to the database tier.
10. For that same design, trace one outbound request from the application tier to a patch repository or external API.
11. Describe one failure caused by a missing route and one failure caused by a blocked security control.
12. Explain whether your data subnet should be private with controlled egress or fully isolated with no internet path at all.

---

## 5.12 Recap

- A VPC is the regional network boundary for many AWS workloads.
- CIDR planning affects future scale and connectivity, not just initial setup.
- Subnets are AZ-specific and should reflect workload tier, exposure level, and availability goals.
- Public, private, and isolated subnet behavior comes from routing and reachability, not naming alone.
- Route tables control where traffic goes, while security controls decide whether it is allowed.
- Internet gateways support public connectivity, and NAT gateways support private outbound access without opening inbound internet reachability.
- Security groups are the main workload-level traffic control, while NACLs provide subnet-level filtering and require careful handling because they are stateless.
- Good VPC design reduces attack surface, improves resilience, and makes traffic paths and failure analysis easier to reason about.

Next: EC2 Essentials.
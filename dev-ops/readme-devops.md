# DevOps Learning Roadmap

**Goal:** Build DevOps skills from beginner to advanced using mostly open-source tools for hands-on practice.

**Approach:** Learn the concepts first, practice with open-source tooling locally, and keep commercial or managed products in your awareness so the roadmap stays practical for real jobs.

---

## How to Use This Roadmap

This is a staged roadmap, not a checklist to rush through. Finish the milestone for each stage before moving to the next one.

Use this rule throughout the journey:

- Learn one concept deeply.
- Practice it with one primary open-source tool.
- Compare it with 2 or 3 other tools only after you understand the core workflow.

If you are completely new, spend more time on Linux, networking, Git, and scripting than on Kubernetes. Most weak DevOps foundations come from skipping the basics.

---

## Stage 0: Core Foundations

**Level:** Beginner  
**Suggested time:** 4 to 6 weeks

### Learn

- Linux basics: files, permissions, processes, services, logs, package managers
- Networking basics: DNS, HTTP/HTTPS, ports, TCP/UDP, load balancing, proxies
- Git basics: branching, merging, rebasing, pull requests, conflict resolution
- Shell scripting: Bash fundamentals, environment variables, loops, conditionals
- Basic Python for automation
- YAML, JSON, and Markdown

### Practice With Open-Source Tools

- Linux shell utilities: `bash`, `grep`, `sed`, `awk`, `find`, `curl`, `jq`
- Git
- Vim or Neovim, or VS Code with terminal-first workflow
- `ssh`, `scp`, `rsync`
- `shellcheck` for shell linting
- `yamllint` for YAML validation

### Other Tools to Know

- PowerShell
- GitHub Desktop
- GitKraken
- iTerm2

### Milestone

Set up a Linux VM or local Unix-like environment, write shell scripts for backups and log filtering, and manage a Git repo without relying on a GUI.

---

## Stage 1: Developer Workflow and Automation Basics

**Level:** Beginner  
**Suggested time:** 2 to 4 weeks

### Learn

- How code moves from laptop to repository to deployment
- Build pipelines and artifact flow
- Reproducible development environments
- Task runners and basic quality gates

### Practice With Open-Source Tools

- `Make` or `Taskfile`
- `pre-commit`
- `shellcheck`, `hadolint`, `yamllint`, `markdownlint`
- Gitea for self-hosted source control practice

### Other Tools to Know

- GitHub
- GitLab
- Bitbucket

### Milestone

Create a sample repo with a `Makefile` or `Taskfile` that runs linting, tests, and packaging through one command.

---

## Stage 2: Containers and Image Workflows

**Level:** Beginner to Intermediate  
**Suggested time:** 4 to 5 weeks

### Learn

- Why containers exist
- Images, layers, registries, entrypoints, volumes, and networks
- Differences between containers and virtual machines
- Image security and size optimization

### Practice With Open-Source Tools

- Docker Engine or Podman
- Buildah
- `docker compose` or Podman Compose
- `dive` for image inspection
- `hadolint` for Dockerfile linting
- Harbor or a simple local registry for image hosting

### Other Tools to Know

- Docker Desktop
- Amazon ECR
- Google Artifact Registry
- JFrog Artifactory

### Milestone

Containerize a small web application, run it with a database locally, optimize the image, and publish it to a registry.

---

## Stage 3: Continuous Integration and Continuous Delivery

**Level:** Intermediate  
**Suggested time:** 4 to 6 weeks

### Learn

- CI pipeline structure
- Automated testing and artifact creation
- Promotion across environments
- Deployment strategies: rolling, blue-green, canary
- Pipeline secrets and environment variables

### Practice With Open-Source Tools

- Jenkins
- Drone CI
- Tekton
- SonarQube Community Build or Community Edition
- Nexus Repository OSS for artifact storage

### Other Tools to Know

- GitHub Actions
- GitLab CI/CD
- CircleCI
- Azure DevOps Pipelines

### Milestone

Build a CI pipeline that lints, tests, builds a container image, stores an artifact, and deploys to a non-production environment automatically.

---

## Stage 4: Infrastructure as Code and Configuration Management

**Level:** Intermediate  
**Suggested time:** 4 to 6 weeks

### Learn

- Declarative vs imperative automation
- Idempotency
- Provisioning vs configuration management
- Reusable modules and environment promotion
- Secret management basics

### Practice With Open-Source Tools

- OpenTofu
- Ansible
- Terraform-compatible module design concepts
- `sops` with `age` for secrets
- OpenBao for secret-management awareness in self-hosted setups

### Other Tools to Know

- Terraform
- HashiCorp Vault
- Pulumi
- AWS CloudFormation
- Azure Bicep

### Milestone

Provision infrastructure for a small application stack and configure the servers or services with Ansible from a clean state.

---

## Stage 5: Kubernetes and GitOps

**Level:** Intermediate to Advanced  
**Suggested time:** 6 to 8 weeks

### Learn

- Kubernetes architecture: control plane, nodes, pods, services, ingress
- Scheduling, scaling, health checks, and resource requests
- ConfigMaps, Secrets, volumes, and service discovery
- Helm and Kustomize
- GitOps workflow and declarative delivery

### Practice With Open-Source Tools

- `kind`, `k3d`, or Minikube for local clusters
- `kubectl`
- Helm
- Kustomize
- Argo CD or Flux CD
- ingress-nginx
- cert-manager

### Other Tools to Know

- Amazon EKS
- Google GKE
- Azure AKS
- OpenShift
- Rancher

### Milestone

Deploy a multi-service app to Kubernetes with health checks, autoscaling, ingress, TLS, and GitOps-based deployment updates.

---

## Stage 6: Observability, Reliability, and Incident Readiness

**Level:** Advanced  
**Suggested time:** 4 to 6 weeks

### Learn

- Logs, metrics, and traces
- Service-level indicators and objectives
- Alert design and noise reduction
- Incident response workflow
- Capacity planning and performance bottlenecks

### Practice With Open-Source Tools

- Prometheus
- Grafana
- Loki
- Alertmanager
- OpenTelemetry
- Jaeger
- `node-exporter` and `kube-state-metrics`

### Other Tools to Know

- Datadog
- New Relic
- Splunk
- Dynatrace

### Milestone

Instrument an application, build dashboards, define alert rules, and run a mock incident where you diagnose a failure from telemetry.

---

## Stage 7: DevSecOps and Policy Enforcement

**Level:** Advanced  
**Suggested time:** 4 to 6 weeks

### Learn

- Shift-left security
- Dependency and container scanning
- SBOM concepts
- Signature verification and supply-chain security
- Runtime security and policy-as-code

### Practice With Open-Source Tools

- Trivy
- Grype
- Syft
- Gitleaks
- Cosign
- Falco
- OPA Gatekeeper or Kyverno

### Other Tools to Know

- Snyk
- Wiz
- Prisma Cloud
- Aqua Security
- Lacework

### Milestone

Add image scanning, secret scanning, signed artifacts, and Kubernetes admission policies to your pipeline.

---

## Stage 8: Platform Engineering and Advanced Operations

**Level:** Advanced  
**Suggested time:** 6 to 8 weeks

### Learn

- Internal developer platforms
- Self-service infrastructure
- Multi-cluster and multi-environment management
- Service mesh basics
- Backup, disaster recovery, and upgrade strategy
- Cost awareness and operational governance

### Practice With Open-Source Tools

- Backstage
- Crossplane
- Istio or Linkerd
- Cilium
- Harbor
- Velero
- Renovate

### Other Tools to Know

- Humanitec
- Harness
- Spacelift
- Octopus Deploy
- Commercial platform engineering products

### Milestone

Build a small internal platform blueprint where developers can request an app template, deploy through GitOps, observe services, and recover from a backup.

---

## Suggested Learning Sequence

Do not learn everything at once. Follow this order:

1. Linux, networking, Git, Bash, and Python basics
2. Local automation, linting, and developer workflow
3. Containers and local multi-service environments
4. CI/CD pipelines
5. Infrastructure as code and configuration management
6. Kubernetes and GitOps
7. Observability and incident handling
8. Security, compliance, and policy
9. Platform engineering and scale concerns

If you skip steps 1 to 4 and jump to Kubernetes, you will likely memorize commands without understanding operations.

---

## Beginner-to-Advanced Project Path

### Project 1: Local Automation Starter

- Create shell scripts for setup, backup, and health checks
- Put everything in Git
- Add linting and a `Makefile`

### Project 2: Containerized Application

- Build a small app with a database
- Run it with Compose
- Add image linting and security scanning

### Project 3: CI/CD Pipeline

- Use Jenkins or Drone
- Run tests, build images, tag releases, and deploy automatically

### Project 4: Infrastructure Automation

- Use OpenTofu and Ansible to provision and configure environments
- Keep secrets encrypted with `sops`

### Project 5: Kubernetes GitOps Stack

- Deploy the app to `kind` or `k3d`
- Use Helm or Kustomize
- Sync with Argo CD or Flux CD

### Project 6: Full DevOps Capstone

- CI builds images
- GitOps deploys to Kubernetes
- Prometheus and Grafana monitor the app
- Trivy and Gitleaks protect the pipeline
- Velero backs up workloads

---

## Open-Source-First Tool Stack

If you want one practical stack to follow end to end, use this:

- OS and scripting: Linux, Bash, Python, Git
- Developer workflow: `Make`, `pre-commit`, `shellcheck`, `yamllint`
- Containers: Podman or Docker Engine, Buildah, Harbor
- CI/CD: Jenkins or Drone, Nexus OSS
- Infrastructure: OpenTofu, Ansible, `sops`, `age`
- Orchestration: Kubernetes with `kind`, Helm, Argo CD
- Observability: Prometheus, Grafana, Loki, Jaeger, OpenTelemetry
- Security: Trivy, Syft, Grype, Cosign, Gitleaks, Kyverno
- Platform and operations: Backstage, Crossplane, Velero, Renovate

This stack is strong enough to teach the real mechanics behind most managed DevOps platforms.

---

## Industry Tools to Know for Awareness

These are worth recognizing because many companies use them, even if you do not make them your primary learning tools at the start:

- Source control and CI/CD: GitHub Actions, GitLab CI/CD, Azure DevOps, CircleCI
- Artifact and registry tools: JFrog Artifactory, AWS ECR, GitHub Container Registry
- Infrastructure and secrets: Terraform, Vault, Pulumi, CloudFormation, Bicep
- Kubernetes platforms: EKS, GKE, AKS, OpenShift, Rancher
- Monitoring and APM: Datadog, Splunk, New Relic, Dynatrace
- Security platforms: Snyk, Wiz, Prisma Cloud, Aqua, Lacework
- Deployment and orchestration platforms: Harness, Octopus Deploy, Spacelift

Learn these as product awareness after you understand the open-source equivalents and the workflow behind them.

---

## What Job-Ready Looks Like

You are moving toward job-ready DevOps capability when you can do the following without copying tutorials blindly:

- Debug Linux and network problems from the terminal
- Write automation scripts and reusable pipeline steps
- Containerize applications and troubleshoot runtime issues
- Build a CI/CD pipeline that handles testing, packaging, and deployment
- Provision infrastructure as code and manage secrets safely
- Operate workloads in Kubernetes with GitOps workflows
- Create dashboards, alerts, and useful incident runbooks
- Add security scanning and policy checks to delivery pipelines

---

## Common Mistakes

- Starting with Kubernetes before learning Linux, Git, and networking
- Learning tools as isolated commands instead of learning the delivery lifecycle
- Using too many tools at once
- Memorizing YAML without understanding what the platform is doing
- Ignoring observability and security until the end
- Copying cloud tutorials without understanding local open-source equivalents

---

## Recommended Weekly Study Pattern

- 40 percent concepts
- 50 percent hands-on labs and projects
- 10 percent reading architecture blogs, postmortems, and tool documentation

Try to end every week with one visible artifact: a script, pipeline file, Dockerfile, dashboard, Terraform module, Helm chart, or runbook.

---

## Final Advice

Use open-source tools to learn the mechanics. Use commercial and managed tools to understand what the industry buys for convenience, scale, support, and integrations.

The best learning path is not the one with the most tools. It is the one where each stage clearly prepares you for the next stage.

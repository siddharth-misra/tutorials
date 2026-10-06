# 31: Data and Analytics Services

AWS offers a wide range of data and analytics services, each built for a different job. Services such as Amazon Athena, AWS Glue, Amazon Redshift, and Amazon Kinesis help teams query data, prepare datasets, run large-scale analytics, and process streams of events.

This chapter explains how these services fit together at a high level instead of treating them as isolated tools. You will learn how to think about batch versus streaming, data lake versus warehouse patterns, and how latency, scale, and operational effort influence the right choice.

---

## 31.1 Why Analytics Architecture Matters

Operational systems answer immediate application needs. Analytics systems answer broader business questions.

Organizations eventually want to know:

- what users are doing over time
- how revenue, traffic, or error patterns are changing
- how to combine data from multiple systems
- how to analyze streams of events rather than only current transaction state

Analytics architecture matters because those questions usually require different storage, processing, and query patterns than online transaction systems.

If teams force analytical workloads directly onto primary application databases, they often create contention, poor performance, and fragile reporting pipelines.

---

## 31.2 The Main Analytics Workload Types

AWS data and analytics services are easier to understand when grouped by workload type.

Common categories include:

- interactive querying of data already stored in files or objects
- ETL or ELT processing to transform and prepare datasets
- warehouse-style analytics across curated, structured data
- streaming ingestion and near-real-time processing

These categories overlap, but the design question is always similar: what is the shape of the data, how quickly must insights be available, and who needs to query it?

Once that is clear, the service choices become easier to reason about.

---

## 31.3 Athena for Querying Data in S3

Amazon Athena is commonly used to run SQL queries directly against data stored in Amazon S3.

Athena is attractive when:

- you already have data landing in S3
- the workload is analytical rather than transactional
- you want serverless querying without managing database servers
- query frequency is moderate or highly variable

Athena works best when the underlying data is organized well. File format, partitioning, schema management, and dataset layout strongly affect both performance and cost.

That means Athena is simple to start with, but good results still require data discipline. Dumping raw files into S3 without structure often leads to slow and expensive queries.

---

## 31.4 Glue for Metadata and Data Preparation

AWS Glue is commonly used for data cataloging, schema discovery, and data transformation workflows.

It helps teams:

- maintain a metadata catalog for datasets
- discover schema from data sources
- transform data into more useful analytical forms
- orchestrate preparation workflows

Glue is important because analytics systems depend on more than storage. Analysts and downstream tools need to understand what a dataset means, how it is structured, and whether it is ready for use.

In many architectures, Glue becomes the bridge between raw data landing zones and curated analytical datasets.

---

## 31.5 Redshift for Warehouse-Style Analytics

Amazon Redshift is designed for warehouse-style analytics over large structured datasets.

It is often a better fit than ad hoc querying when:

- many users run repeated analytical queries
- performance expectations are stricter
- data is curated into a model designed for business analysis
- teams need more warehouse-like behavior and tuning control

Redshift is not simply "bigger Athena" and Athena is not simply "serverless Redshift." They fit different operating models.

Athena is often strong for flexible querying over data in S3. Redshift is stronger when a managed warehouse with curated analytical structures and predictable performance is justified.

---

## 31.6 Kinesis and Streaming Data Patterns

Not all analytics begins with static files.

Streaming systems are used when events must be collected and processed continuously, such as:

- clickstream or telemetry events
- application logs and metrics pipelines
- IoT device events
- operational event processing for alerts or dashboards

Amazon Kinesis supports streaming ingestion and downstream processing patterns for workloads that need near-real-time data flow.

Streaming architecture introduces different design concerns:

- ordering and partitioning
- consumer lag
- replay and retention
- downstream scaling
- cost tied to sustained event volume

Streaming is powerful, but it should be chosen because the latency requirement is real, not because batch processing sounds less modern.

---

## 31.7 Data Lake Versus Warehouse Thinking

Many AWS analytics environments use both data lake and warehouse patterns.

At a high level:

- a data lake stores raw and transformed datasets, often in S3
- a warehouse stores curated analytical data optimized for business queries

The lake can be flexible and broad. The warehouse is usually more modeled and intentional.

This distinction helps avoid confusion. If every dataset is treated as fully curated from day one, ingestion slows down. If everything remains raw forever, analytical usability suffers.

Mature systems usually separate raw, processed, and curated layers.

---

## 31.8 Choosing the Right Analytical Path

![Analytics reference flow from ingest to S3 lake, Glue cataloging, Athena and Redshift query paths, and governance controls.](images/ch31-analytics-platform-reference-flow.svg)

Architects should ask:

- Is the data queried occasionally or constantly?
- Is the need ad hoc exploration or structured repeated reporting?
- Does the business need near-real-time reaction, or is batch acceptable?
- How clean and structured is the source data?
- Who will use the data: engineers, analysts, dashboards, or machine-driven workflows?

Example decision patterns:

- S3 plus Athena fits flexible, serverless analytics on well-organized files.
- Glue supports schema management and transformation for datasets moving through analytical stages.
- Redshift fits repeated warehouse-style analytical workloads with stronger performance expectations.
- Kinesis fits event-driven streaming ingestion where latency matters.

The best architecture often combines these rather than choosing one service for every analytical job.

---

## 31.9 Governance, Security, and Cost Considerations

Analytics environments introduce their own governance issues.

Important concerns include:

- controlling access to sensitive datasets
- knowing which data can move into broader analytical stores
- managing schema quality and data ownership
- optimizing storage format and query patterns to avoid waste
- tracking who can access curated business data and raw event data

Analytics can also become a major cost center if datasets are duplicated carelessly, poorly partitioned, or queried inefficiently.

Architects should treat analytics as a platform design problem, not only as a collection of tools.

---

## 31.10 Common Mistakes

- querying primary application databases directly for heavy analytical workloads
- storing data in S3 without partitioning, metadata discipline, or lifecycle thinking
- using streaming systems when batch processing would have been sufficient
- treating Athena, Glue, Redshift, and Kinesis as interchangeable
- building a warehouse without clear ownership of data modeling and quality
- ignoring access control and sensitivity classification for analytical datasets
- duplicating large datasets without understanding the cost impact
- assuming analytics architecture is only a data-team concern instead of a broader platform concern

---

## 31.11 Hands-On Tasks

1. Compare an S3 plus Athena design with a Redshift design for a weekly executive reporting workload.
2. Explain where Glue fits between raw data ingestion and analyst-ready datasets.
3. Define one use case where Kinesis is justified and one where a scheduled batch process is sufficient.
4. Sketch raw, processed, and curated data layers for an e-commerce analytics platform.
5. List the governance questions you would ask before giving analysts access to customer event data.

---

## 31.12 Recap

AWS analytics services support different data shapes and latency requirements. Athena is useful for querying well-structured data in S3, Glue helps catalog and prepare data, Redshift supports warehouse-style analytics, and Kinesis handles streaming event flows. Strong analytical architecture chooses among these tools based on workload patterns, data quality needs, governance requirements, and cost discipline.

Next: 32: Capstone Project

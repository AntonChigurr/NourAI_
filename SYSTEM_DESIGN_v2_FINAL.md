# SYSTEM_DESIGN.md — NourAI v2

> **NourAI — AI-Powered Unified Healthcare Platform**  
> Technical architecture document for Tatweer Hackathon  
> Current MVP architecture + future production-grade medical platform design

---

## Document Purpose

This document explains the technical architecture of NourAI.

It is written for reviewers, judges, engineers, and future contributors who want to understand:

- what the current MVP is built with;
- how the platform works today;
- how the system can evolve after the hackathon;
- how AI fits into the healthcare workflow;
- how NourAI can scale to rural communities, the UAE, GCC, and beyond;
- how privacy, security, and medical safety are handled.

This document complements:

- [`README.md`](./README.md)
- [`VALIDATION.md`](./VALIDATION.md)
- [`REFERENCES.md`](./REFERENCES.md)

---

# 1. Executive Summary

NourAI is a unified healthcare platform that connects patients, doctors, pharmacies, insurance workflows, telemedicine, AI assistance, and public health insights.

The current MVP is a working web application built with:

- React 18
- Vite 6
- React Router
- TailwindCSS
- Radix UI
- Recharts
- Base44 SDK
- Base44 Entities
- Base44 AI integrations
- Twilio Video component

The future production version is designed as a secure cloud-native healthcare platform using:

- Next.js / React Native
- NestJS + FastAPI
- PostgreSQL
- Redis
- Object Storage
- RAG
- Medical LLM
- FHIR-ready data model
- Kubernetes
- Azure / AWS deployment

The current MVP proves the workflow. The future architecture shows how the platform can become a real medical-grade infrastructure layer.

---

# 2. Architecture Goals

NourAI is designed around the following goals:

| Goal | Description |
|---|---|
| Accessibility | Improve access to healthcare for rural and remote communities |
| Continuity of Care | Keep patient history available across providers |
| AI Assistance | Help organize, summarize, and navigate healthcare information |
| Safety | Keep doctors responsible for diagnosis and treatment |
| Privacy | Protect patient data and use only anonymized analytics |
| Scalability | Grow from one community to national and GCC-level deployment |
| Interoperability | Prepare for future FHIR-compatible healthcare integrations |
| Maintainability | Use modular services and clear separation of concerns |

---

# 3. Current MVP Architecture

## 3.1 Real Technology Stack

The uploaded NourAI MVP uses the following real stack.

### Frontend

- React 18
- Vite 6
- JavaScript / JSX
- React Router DOM v7
- TailwindCSS
- Radix UI
- Lucide React
- Framer Motion
- Recharts
- React Hook Form
- Zod
- Sonner
- Date-fns

### Backend / Platform

- Base44 SDK
- Base44 Authentication
- Base44 Entities
- Base44 Functions
- Base44 Integrations

### AI

- InvokeLLM
- UploadFile
- UploadPrivateFile
- ExtractDataFromUploadedFile
- CreateFileSignedUrl
- TranscribeAudio
- GenerateSpeech
- GenerateImage
- GenerateVideo

### Telemedicine

- Twilio Video component
- Video consultation workflow

### Analytics

- Recharts
- Health summary cards
- Appointment analytics
- Mental health charts
- Vital signs charts

---

# 4. Current MVP Modules

The current project includes the following modules and pages:

| Area | Modules |
|---|---|
| Patient | Profile, medical records, prescriptions, insurance, reminders, mental health |
| Doctor | Dashboard, patients, appointments, prescriptions, doctor profile |
| Admin | Doctor verification, insurance, pharmacies, admin dashboard |
| AI | DrNourChat, AI summaries, document analysis |
| Telemedicine | Video consultation, Twilio video component |
| Pharmacy | Pharmacy list, pharmacy detail, pharmacy orders |
| Analytics | HealthAnalytics, charts, appointment analytics |
| Authentication | Base44 user authentication and role-based flows |

---

# 5. Current MVP High-Level Diagram

```mermaid
flowchart TD
    User[Patient / Doctor / Admin] --> Browser[React + Vite Web App]

    Browser --> Router[React Router]
    Router --> Pages[Application Pages]

    Pages --> UI[Radix UI + TailwindCSS Components]
    Pages --> Charts[Recharts Analytics]
    Pages --> Base44SDK[Base44 SDK Client]

    Base44SDK --> Auth[Base44 Auth]
    Base44SDK --> Entities[Base44 Entities]
    Base44SDK --> Integrations[Base44 AI & File Integrations]
    Base44SDK --> Functions[Base44 Functions]

    Integrations --> LLM[InvokeLLM]
    Integrations --> Upload[UploadFile / UploadPrivateFile]
    Integrations --> Extract[ExtractDataFromUploadedFile]

    Functions --> VideoFn[Video Call Functions]
    VideoFn --> Twilio[Twilio Video]

    Entities --> Data[(Base44 Managed Data Layer)]
```

---

# 6. C4 Context Diagram

```mermaid
flowchart TD
    Patient[Patient] --> NourAI[NourAI Platform]
    Doctor[Doctor] --> NourAI
    Admin[Admin] --> NourAI
    Pharmacy[Pharmacy] --> NourAI
    Insurance[Insurance Provider] --> NourAI
    PublicHealth[Public Health Authority] --> NourAI

    NourAI --> AI[AI Services]
    NourAI --> Video[Telemedicine Provider]
    NourAI --> Storage[Medical Document Storage]
    NourAI --> Analytics[Anonymized Analytics]
```

## Explanation

At the highest level, NourAI is a coordination platform between multiple healthcare stakeholders. It does not replace hospitals or doctors. It connects people, records, and workflows.

---

# 7. C4 Container Diagram

```mermaid
flowchart TD
    subgraph ClientLayer[Client Layer]
        Web[React Web App]
        FutureMobile[Future Mobile App]
    end

    subgraph PlatformLayer[Current MVP Platform Layer]
        Base44SDK[Base44 SDK]
        Base44Auth[Base44 Auth]
        Base44Entities[Base44 Entities]
        Base44Functions[Base44 Functions]
    end

    subgraph AIIntegrationLayer[AI Integration Layer]
        InvokeLLM[InvokeLLM]
        FileExtraction[ExtractDataFromUploadedFile]
        FileUpload[UploadFile]
    end

    subgraph ExternalServices[External Services]
        Twilio[Twilio Video]
    end

    Web --> Base44SDK
    FutureMobile --> Base44SDK

    Base44SDK --> Base44Auth
    Base44SDK --> Base44Entities
    Base44SDK --> Base44Functions

    Base44SDK --> InvokeLLM
    Base44SDK --> FileExtraction
    Base44SDK --> FileUpload

    Base44Functions --> Twilio
```

---

# 8. Current MVP Entity Model

The current project uses Base44-managed entities. These are mapped conceptually below.

```mermaid
erDiagram
    USER ||--o| PATIENT : may_have
    USER ||--o| DOCTOR : may_have

    PATIENT ||--o{ APPOINTMENT : books
    DOCTOR ||--o{ APPOINTMENT : receives

    PATIENT ||--o{ MEDICAL_RECORD : owns
    PATIENT ||--o{ PRESCRIPTION : receives
    DOCTOR ||--o{ PRESCRIPTION : creates

    PATIENT ||--o{ PATIENT_INSURANCE : has
    INSURANCE_PROVIDER ||--o{ INSURANCE_PLAN : offers
    INSURANCE_PLAN ||--o{ INSURANCE_COVERAGE : defines

    PHARMACY ||--o{ PHARMACY_ORDER : fulfills
    PATIENT ||--o{ PHARMACY_ORDER : places

    PATIENT ||--o{ CHAT_CONVERSATION : starts
    PATIENT ||--o{ REMINDER : sets
    PATIENT ||--o{ MENTAL_HEALTH_ENTRY : records
```

---

# 9. Current MVP User Flow

## 9.1 Patient Journey

```mermaid
sequenceDiagram
    participant P as Patient
    participant UI as React App
    participant B as Base44 SDK
    participant AI as AI Integration
    participant DB as Base44 Entities

    P->>UI: Login
    UI->>B: Authenticate user
    B-->>UI: User session

    P->>UI: Open patient dashboard
    UI->>B: Fetch patient data
    B->>DB: Query Patient, Records, Appointments
    DB-->>B: Return data
    B-->>UI: Render dashboard

    P->>UI: Upload medical record
    UI->>B: UploadFile
    B-->>UI: File URL

    UI->>AI: Extract / summarize document
    AI-->>UI: Structured summary

    UI->>DB: Save MedicalRecord
    DB-->>UI: Record saved
```

## 9.2 Doctor Journey

```mermaid
sequenceDiagram
    participant D as Doctor
    participant UI as Doctor Dashboard
    participant B as Base44 SDK
    participant DB as Base44 Entities

    D->>UI: Login
    UI->>B: Authenticate doctor
    B-->>UI: Doctor session

    D->>UI: Open dashboard
    UI->>B: Fetch appointments and patients
    B->>DB: Query Doctor, Appointment, Patient, MedicalRecord
    DB-->>B: Return authorized data
    B-->>UI: Display patient list and summaries

    D->>UI: Review patient
    UI->>B: Fetch patient timeline
    B->>DB: Query MedicalRecord and Prescription
    DB-->>UI: Patient medical timeline
```

## 9.3 Telemedicine Flow

```mermaid
sequenceDiagram
    participant P as Patient
    participant UI as VideoConsultation
    participant F as Base44 Function
    participant T as Twilio Video
    participant D as Doctor

    P->>UI: Start video consultation
    UI->>F: Request video room
    F->>T: Create video room / token
    T-->>F: Room metadata
    F-->>UI: Session details

    UI->>T: Patient joins
    D->>T: Doctor joins
    P-->>D: Video consultation
```

---

# 10. Current MVP Strengths

The current MVP is strong because it demonstrates a real multi-role healthcare workflow.

## Implemented Strengths

- Patient portal exists.
- Doctor dashboard exists.
- Admin dashboard exists.
- AI assistant exists.
- Medical records workflow exists.
- Insurance module exists.
- Pharmacy module exists.
- Prescriptions module exists.
- Telemedicine component exists.
- Analytics components exist.
- Mental health module exists.
- Reminders exist.

This makes the project much stronger than a concept-only submission.

---

# 11. Current MVP Limitations

The current MVP is not yet a medical-grade production system.

## Known MVP Limitations

- It uses Base44 managed backend rather than custom healthcare microservices.
- It does not yet integrate with real hospital systems.
- It does not yet implement FHIR interoperability.
- It uses general-purpose AI integrations, not a dedicated medical LLM.
- It uses synthetic data, not real patient data.
- It is not clinically validated.
- It is not a certified medical device.
- It does not replace licensed doctors.

These limitations are expected for a hackathon MVP and are addressed in the future architecture.

---

# 12. Future Production Architecture

The production version should migrate toward a modular, secure, healthcare-grade architecture.

## Recommended Future Stack

| Layer | Recommended Technology |
|---|---|
| Web Frontend | Next.js + TypeScript |
| Mobile | React Native / Expo |
| Backend Business Services | NestJS |
| AI Services | FastAPI |
| Database | PostgreSQL |
| Vector Search | pgvector / Pinecone |
| Cache | Redis |
| Object Storage | Azure Blob Storage / AWS S3 |
| Queue | Azure Service Bus / AWS SQS / BullMQ |
| Auth | OAuth2 / OpenID Connect / UAE PASS-ready |
| Deployment | Docker + Kubernetes |
| Monitoring | Prometheus + Grafana |
| Logging | OpenTelemetry + Azure Monitor / CloudWatch |
| AI | RAG + Medical LLM |
| Interoperability | FHIR-ready data model |

---

# 13. Future Production Diagram

```mermaid
flowchart TD
    PatientApp[Patient Web/Mobile App] --> CDN[CDN / Edge]
    DoctorApp[Doctor Dashboard] --> CDN
    AdminApp[Admin Dashboard] --> CDN

    CDN --> Gateway[API Gateway]

    Gateway --> Auth[Auth Service]
    Gateway --> PatientSvc[Patient Service]
    Gateway --> DoctorSvc[Doctor Service]
    Gateway --> AppointmentSvc[Appointment Service]
    Gateway --> RecordsSvc[Medical Records Service]
    Gateway --> PrescriptionSvc[Prescription Service]
    Gateway --> InsuranceSvc[Insurance Service]
    Gateway --> PharmacySvc[Pharmacy Service]
    Gateway --> TelemedicineSvc[Telemedicine Service]
    Gateway --> AISvc[AI Service]
    Gateway --> AnalyticsSvc[Analytics Service]
    Gateway --> NotificationSvc[Notification Service]

    RecordsSvc --> DB[(PostgreSQL)]
    RecordsSvc --> ObjectStorage[(Encrypted Medical File Storage)]

    AISvc --> OCR[OCR Service]
    AISvc --> EntityExtraction[Medical Entity Extraction]
    AISvc --> VectorDB[(Vector Database)]
    AISvc --> RAG[RAG Orchestrator]
    RAG --> MedicalLLM[Medical LLM]

    AnalyticsSvc --> Anonymizer[Anonymization Layer]
    Anonymizer --> PublicHealthDB[(Aggregated Analytics DB)]
    PublicHealthDB --> Dashboard[Public Health Dashboard]
```

---

# 14. Service Responsibilities

| Service | Responsibility |
|---|---|
| Auth Service | Login, sessions, MFA, role-based access |
| Patient Service | Patient profiles and health overview |
| Doctor Service | Doctor profiles, specialties, verification |
| Appointment Service | Booking and scheduling |
| Medical Records Service | File metadata, record timeline, document access |
| AI Service | LLM, RAG, summaries, extraction |
| Telemedicine Service | Video consultation sessions |
| Prescription Service | E-prescriptions and medication history |
| Insurance Service | Insurance providers, plans, coverage |
| Pharmacy Service | Pharmacy orders and fulfillment |
| Analytics Service | Aggregated public health insights |
| Notification Service | Reminders, alerts, follow-ups |

---

# 15. AI Architecture

## 15.1 Current MVP AI

The MVP uses Base44 AI capabilities:

- InvokeLLM
- UploadFile
- ExtractDataFromUploadedFile
- DrNourChat
- AI-supported document understanding
- AI-supported summaries

## 15.2 Future Medical AI Architecture

```mermaid
flowchart TD
    Upload[Medical Document Upload] --> Validate[File Validation]
    Validate --> OCR[OCR / Text Extraction]
    OCR --> Clean[Text Cleaning]
    Clean --> Chunk[Chunking]
    Chunk --> Embed[Embedding Model]
    Embed --> VectorDB[(Vector Database)]

    Clean --> NER[Medical Entity Extraction]
    NER --> Structure[FHIR-Compatible Structuring]

    VectorDB --> Retrieve[Semantic Retrieval]
    Retrieve --> Prompt[Clinical Prompt Template]
    Structure --> Prompt
    Prompt --> LLM[Medical LLM]
    LLM --> Guardrails[Safety Guardrails]
    Guardrails --> Summary[Doctor-Facing Summary]
    Summary --> HumanReview[Human-in-the-Loop Review]
```

---

# 16. RAG Pipeline

RAG stands for Retrieval-Augmented Generation.

Instead of asking the AI to answer from memory, NourAI retrieves relevant patient records and gives them as grounded context.

```mermaid
flowchart LR
    Query[Doctor or Patient Query] --> EmbedQ[Embed Query]
    EmbedQ --> Search[Vector Search]
    Search --> Context[Relevant Medical Chunks]
    Context --> Prompt[Prompt Builder]
    Prompt --> LLM[Medical LLM]
    LLM --> Answer[Grounded Answer / Summary]
```

## Why RAG Matters

RAG reduces hallucination by grounding the response in patient-specific medical documents.

---

# 17. Future Medical LLM

Future NourAI will train or fine-tune a domain-specific medical language model.

## Model Goals

- Summarize patient history.
- Extract medications.
- Extract allergies.
- Extract diagnoses.
- Extract lab values.
- Support Arabic and English.
- Generate doctor-facing summaries.
- Improve patient preparation before consultation.

## Model Boundary

The model must not:

- replace doctors;
- issue autonomous diagnosis;
- prescribe medication independently;
- override licensed healthcare professionals.

The model should:

- summarize;
- organize;
- retrieve;
- explain;
- assist;
- prepare.

---

# 18. Mathematical Models

This section describes mathematical foundations for the future AI layer.

## 18.1 Embeddings

Each medical document chunk can be represented as a vector:

```text
f(d_i) = v_i ∈ R^n
```

Where:

- `d_i` = document chunk
- `v_i` = vector embedding
- `R^n` = n-dimensional semantic space

## 18.2 Cosine Similarity

Semantic search uses cosine similarity:

```text
cos(q, d) = (q · d) / (||q|| ||d||)
```

Where:

- `q` = query vector
- `d` = document vector

Higher score means higher semantic relevance.

## 18.3 RAG Formula

```text
Answer = LLM(Query, TopK(Retrieve(Query, Records)))
```

Where:

- `TopK` = top relevant medical chunks
- `Records` = patient medical records
- `LLM` = medical language model

## 18.4 Transformer Attention

```text
Attention(Q, K, V) = softmax((QKᵀ) / sqrt(d_k))V
```

This allows the model to focus on relevant parts of medical context.

## 18.5 Risk Prioritization Score

Future non-diagnostic prioritization:

```text
RiskScore = σ(w₁x₁ + w₂x₂ + ... + wₙxₙ + b)
```

Where:

- `x_i` = features such as age, vitals, labs, chronic conditions
- `w_i` = learned weights
- `σ` = sigmoid function

This should be used for prioritization only, not diagnosis.

## 18.6 Public Health Incidence Rate

```text
IncidenceRate = NewCases / PopulationAtRisk
```

Used for anonymized public health trends.

---

# 19. FHIR-Ready Medical Data Model

Future production should map NourAI entities to FHIR resources.

| NourAI Entity | FHIR Resource |
|---|---|
| Patient | Patient |
| Doctor | Practitioner |
| Appointment | Appointment |
| Medical Record | DocumentReference |
| Lab Result | Observation |
| Diagnosis | Condition |
| Prescription | MedicationRequest |
| Insurance | Coverage |
| Allergy | AllergyIntolerance |
| Emergency Summary | Composition |

FHIR readiness improves future interoperability with healthcare providers.

---

# 20. Future Database ERD

```mermaid
erDiagram
    USERS ||--o| PATIENTS : has
    USERS ||--o| DOCTORS : has

    PATIENTS ||--o{ APPOINTMENTS : books
    DOCTORS ||--o{ APPOINTMENTS : receives

    PATIENTS ||--o{ MEDICAL_DOCUMENTS : owns
    MEDICAL_DOCUMENTS ||--o{ AI_SUMMARIES : generates

    PATIENTS ||--o{ PRESCRIPTIONS : receives
    DOCTORS ||--o{ PRESCRIPTIONS : writes

    PATIENTS ||--o{ INSURANCE_POLICIES : holds
    INSURANCE_PROVIDERS ||--o{ INSURANCE_POLICIES : provides

    PHARMACIES ||--o{ PHARMACY_ORDERS : fulfills
    PATIENTS ||--o{ PHARMACY_ORDERS : places

    PATIENTS ||--o{ CONSENT_RECORDS : grants
    USERS ||--o{ AUDIT_LOGS : creates

    PATIENTS ||--o{ MENTAL_HEALTH_ENTRIES : records
    PATIENTS ||--o{ REMINDERS : sets
```

---

# 21. API Architecture

Future production APIs.

## Authentication

```text
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/me
```

## Patients

```text
GET    /patients/{id}
PATCH  /patients/{id}
GET    /patients/{id}/timeline
GET    /patients/{id}/emergency-summary
```

## Doctors

```text
GET   /doctors
GET   /doctors/{id}
POST  /doctors/register
PATCH /doctors/{id}/verify
```

## Medical Records

```text
POST /records/upload
GET  /records/{id}
GET  /patients/{id}/records
POST /records/{id}/analyze
```

## AI

```text
POST /ai/chat
POST /ai/summarize-record
POST /ai/generate-emergency-summary
POST /ai/extract-medical-entities
```

## Appointments

```text
POST  /appointments
GET   /appointments/{id}
PATCH /appointments/{id}
```

## Public Health Analytics

```text
GET /analytics/aggregated
GET /analytics/chronic-disease-trends
GET /analytics/regional-demand
```

---

# 22. Security Architecture

```mermaid
flowchart TD
    User --> Auth[Authentication]
    Auth --> RBAC[Role-Based Access Control]
    RBAC --> Consent[Consent Engine]
    Consent --> DataAccess[Authorized Medical Data Access]
    DataAccess --> Audit[Audit Logging]
    DataAccess --> Encryption[Encrypted Storage]
    DataAccess --> Anonymizer[Anonymization Layer]
    Anonymizer --> Analytics[Public Health Analytics]
```

## Security Controls

- HTTPS / TLS
- encryption at rest
- role-based access control
- multi-factor authentication readiness
- audit logs
- patient consent records
- signed URLs for private documents
- secret management
- anonymization before analytics
- synthetic data for demo

---

# 23. Privacy Model

NourAI follows privacy-by-design principles.

## Principles

1. Patients control access to their records.
2. Doctors see only authorized patient data.
3. Public health dashboards use anonymized aggregation.
4. Demo data is synthetic.
5. Medical access is auditable.
6. Personally identifiable information is never exposed in analytics.

## Consent Model

A future `ConsentRecord` should include:

```text
patient_id
authorized_party_id
scope
purpose
expiration_date
created_at
revoked_at
```

---

# 24. Public Health Analytics Pipeline

```mermaid
flowchart TD
    PatientData[(Patient Medical Records)] --> ConsentCheck[Consent Check]
    ConsentCheck --> RemovePII[Remove Personally Identifiable Information]
    RemovePII --> Aggregate[Aggregate by Region / Condition / Time]
    Aggregate --> Suppress[Small Group Suppression]
    Suppress --> StatsDB[(Public Health Statistics DB)]
    StatsDB --> Dashboard[Public Health Dashboard]
```

## Possible Metrics

- chronic disease prevalence;
- appointment demand;
- medication demand;
- mental health demand;
- regional healthcare needs;
- preventive care indicators.

---

# 25. Queue-Based AI Processing

Large medical file processing should be asynchronous.

```mermaid
sequenceDiagram
    participant U as User
    participant API as API Gateway
    participant Q as Queue
    participant W as AI Worker
    participant DB as Database

    U->>API: Upload medical document
    API->>DB: Save metadata
    API->>Q: Add AI analysis job
    API-->>U: Upload accepted

    Q->>W: Process job
    W->>W: OCR + extraction + summary
    W->>DB: Save AI result
    DB-->>U: Summary available
```

Recommended tools:

- Redis Queue
- Celery
- BullMQ
- Azure Service Bus
- AWS SQS

---

# 26. Deployment Architecture

## Current MVP Deployment

```mermaid
flowchart TD
    Browser[User Browser] --> Vite[React + Vite Frontend]
    Vite --> Base44[Base44 SDK]
    Base44 --> Base44Cloud[Base44 Managed Backend]
    Vite --> Twilio[Twilio Video Component]
```

## Future Production Deployment

```mermaid
flowchart TD
    Internet --> CDN
    CDN --> LoadBalancer
    LoadBalancer --> APIGateway
    APIGateway --> K8s[Kubernetes Cluster]

    K8s --> AuthSvc
    K8s --> PatientSvc
    K8s --> DoctorSvc
    K8s --> RecordsSvc
    K8s --> AISvc
    K8s --> AnalyticsSvc
    K8s --> NotificationSvc

    RecordsSvc --> Postgres[(PostgreSQL)]
    RecordsSvc --> Blob[(Encrypted Blob Storage)]
    AISvc --> VectorDB[(pgvector)]
    AISvc --> LLM[Medical LLM]
    AnalyticsSvc --> AnalyticsDB[(Aggregated DB)]
```

---

# 27. Scalability Strategy

## Current MVP

Base44 allows rapid MVP delivery and managed backend functionality.

## Future Scale

Future NourAI should support:

- horizontal scaling;
- stateless backend services;
- independent AI workers;
- queue-based processing;
- read replicas;
- CDN delivery;
- regional deployment;
- separate analytics database.

---

# 28. Monitoring and Observability

Recommended production monitoring:

- API latency;
- frontend errors;
- authentication failures;
- AI processing time;
- failed document extraction;
- video consultation reliability;
- database performance;
- storage usage;
- suspicious access patterns.

Recommended tools:

- Prometheus
- Grafana
- Sentry
- OpenTelemetry
- Azure Monitor
- AWS CloudWatch

---

# 29. CI/CD Pipeline

```mermaid
flowchart LR
    Dev[Developer Push] --> GitHub[GitHub Repository]
    GitHub --> CI[CI Pipeline]
    CI --> Lint[Lint]
    CI --> Test[Tests]
    CI --> Build[Build]
    Build --> Staging[Deploy Staging]
    Staging --> Review[Manual Review]
    Review --> Production[Deploy Production]
```

Recommended checks:

- linting;
- unit tests;
- build verification;
- dependency audit;
- security scan;
- environment validation.

---

# 30. Disaster Recovery

Recommended disaster recovery plan:

- encrypted backups;
- point-in-time database restore;
- object storage versioning;
- infrastructure as code;
- multi-zone deployment;
- tested restore procedures.

Suggested targets:

```text
MVP RPO: 24 hours
MVP RTO: 4–8 hours

Production RPO: less than 1 hour
Production RTO: less than 2 hours
```

---

# 31. Design Decisions

## Why React + Vite for MVP?

Fast development, strong ecosystem, and simple deployment.

## Why Base44 for MVP?

Base44 enables rapid backend, authentication, entities, functions, and AI integration for hackathon development.

## Why Twilio for video?

Twilio provides reliable programmable video infrastructure.

## Why Recharts?

Recharts enables fast dashboard and analytics visualization inside React.

## Why PostgreSQL for future production?

PostgreSQL is reliable, mature, and suitable for structured healthcare data.

## Why pgvector?

It allows vector search inside PostgreSQL, reducing architecture complexity.

## Why RAG?

RAG grounds AI outputs in patient-specific medical records and reduces hallucination risk.

## Why a Medical LLM?

A domain-specific model can better understand medical language than a general-purpose model.

## Why FHIR-ready design?

FHIR improves future healthcare interoperability.

---

# 32. How This Supports Tatweer Criteria

| Tatweer Criterion | Architecture Support |
|---|---|
| Impact | Supports patients, doctors, pharmacies, insurers, and public health |
| Relevance | Designed for remote communities such as Al Qua'a |
| Feasibility | Current MVP uses working web stack and managed backend |
| Readiness | Existing project includes real pages and workflows |
| Scalability | Future architecture supports national expansion |
| Evidence | Features are testable through demo and validation document |
| Documentation | Architecture, validation, references, and README are separated clearly |

---

# 33. Conclusion

The current NourAI MVP is a real React + Vite + Base44 healthcare web application with:

- patient portal;
- doctor dashboard;
- admin dashboard;
- AI assistant;
- medical records;
- prescriptions;
- insurance;
- pharmacy;
- telemedicine;
- mental health;
- reminders;
- analytics.

The future production architecture evolves this MVP into a secure, scalable, interoperable, AI-assisted healthcare infrastructure platform.

NourAI is not positioned as a replacement for doctors.

It is a digital healthcare coordination layer that helps patients access care, helps doctors review history faster, and helps healthcare systems plan using anonymized evidence.


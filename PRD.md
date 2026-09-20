# SKILLFORGE — Product Requirements Document (PRD)

**Agentic AI Hackathon • Product Space • 19–20 September 2026**  
**Status:** MVP Ready for Development  
**Core Loop:** `Learn → Prove → Diagnose → Adapt`

---

## 1. Product Summary

**SkillForge** is an adaptive career-learning agent that turns a learner's current skills, experience, and target role into a personalized, living learning path. 

Instead of treating course or video completion as proof of learning, SkillForge requires practical skill evidence to diagnose weak subskills and dynamically replans what the learner should study next in real time.

> [!IMPORTANT]
> **Core Product Principle:**  
> Do not optimize for the number of AI features. Optimize for a believable closed loop where learner evidence directly changes the next action.

---

## 2. Problem Statement

1. **Blind Spots:** Learners know the job they want, but cannot pinpoint the exact subskills they lack.
2. **One-Size-Fits-All Curricula:** Generic roadmaps provide the same linear sequence regardless of prior knowledge.
3. **Passive Consumption Illusion:** Watching tutorials or completing courses does not prove practical application capability.
4. **Search Fatigue:** Learners waste hours finding quality tutorials instead of practicing in a structured sequence.
5. **Static Plans:** When a learner struggles or excels, traditional learning paths fail to automatically re-adjust.
6. **Flawed Metrics:** Progress is tracked by hours watched or checkboxes clicked, not demonstrated proficiency.

---

## 3. Target Users

- **Primary:** College students and early-career learners preparing for a specific entry-level tech role.
  - *Demo Focus Role:* **Data Analyst**
- **Secondary:** Career switchers who already have a baseline resume or portfolio but need an accelerated, gap-targeted roadmap.

---

## 4. Product Goal

Given a learner profile and target role:
1. Generate an evidence-grounded skill roadmap.
2. Recommend targeted learning resources and practical skill-proof tasks.
3. Evaluate submitted work against granular subskill rubrics.
4. Dynamically rewrite and adapt the roadmap when evidence shows the learner is stronger or weaker than initial assumptions.

---

## 5. Hackathon MVP Scope

### P0 — Must Work in Demo (Core Scope)
- [x] **Profile Onboarding:** Target role, current background, education, and weekly hours.
- [x] **Resume PDF Upload:** Extraction of existing skills, projects, tools, and experience evidence with confidence scores.
- [x] **Target-Role Skill Map:** Hierarchical skill & subskill tree (Data Analyst).
- [x] **Skill-Gap Analysis:** Categorization into `Strong`, `Developing`, `Weak`, or `Missing`.
- [x] **Personalized Weekly Roadmap:** Dynamic sequencing of modules based on gap priority and prerequisites.
- [x] **Curated Resource Track:** High-signal resources (articles, docs, verified YouTube videos).
- [x] **Practical Skill-Proof Task:** Interactive code/query/scenario challenge per subskill.
- [x] **AI Diagnostic Evaluator:** Rubric-based scoring assessing specific subskill competencies.
- [x] **Dynamic Replanner:** Immediate roadmap mutation triggered by evaluation outcomes.
- [x] **Progress Dashboard:** Visual breakdown of Acquired, Improving, and Remaining gaps.
- [x] **Explainable Agent Q&A:** Grounded conversational assistant explaining *"Why did my plan change?"* and *"What should I do next?"*

### P1 — Stretch Goals (Only if time permits)
- Resource quality rating & duplicate filtering.
- Calendar & time-budget schedule optimization.
- Multi-role support (e.g., Frontend Engineer, Data Engineer).
- Historical mastery progression analytics.
- Exportable learning plan (PDF / Markdown / Notion).

### Non-Goals (Explicitly Out of Scope)
- ❌ Massive course marketplace or user-submitted content library.
- ❌ Social network feeds, forums, or peer-messaging.
- ❌ Full LMS with native video hosting.
- ❌ Over-engineered multi-agent swarms without functional necessity.
- ❌ Complex deep learning mastery estimators.
- ❌ Payments, enterprise RBAC, or subscription tiers.

---

## 6. Key Differentiator: Evidence-Based Diagnosis & Dynamic Replanning

SkillForge is **not** a static roadmap generator or a glorified YouTube playlist maker. It maintains a **persistent skill-evidence state** and mutates the curriculum when diagnostic proof reveals a specific subskill deficiency.

### Concrete Example Flow:
```mermaid
flowchart TD
    A[Initial State: SQL Developing / JOINs Weak] --> B[Initial Plan: JOIN Fundamentals → Assessment → Advanced SQL]
    B --> C[Learner Submits SQL Task]
    C --> D[AI Evaluation: Aggregations & GROUP BY ✅ Correct | Multi-Table JOIN Logic ❌ Failed]
    D --> E[Skill Evidence Store Updated: JOINs subskill remains Weak]
    E --> F[Replanner Mutates Roadmap: Inserts Multi-Table JOIN Deep Dive & Practice]
    F --> G[Explainability: Visible notice and Agent Q&A explaining the exact reason for the change]
```

---

## 7. Core User Journey

1. **Profile Setup:** Enter target role (*Data Analyst*), career goal, and available hours/week.
2. **Resume Ingestion:** Upload resume PDF; inspect and verify extracted skills, projects, and evidence.
3. **Skill Map Generation:** SkillForge compares the learner's profile against the Target Role Skill Ontology.
4. **Gap Identification:** Skills are categorized with initial confidence values (`Strong` / `Developing` / `Weak` / `Missing`).
5. **Initial Roadmap Delivery:** Weekly modular plan generated with sequenced milestones.
6. **Learning Phase:** Learner engages with targeted short-form resources for the current objective.
7. **Skill-Proof Submission:** Learner completes a practical hands-on task (e.g., writing a SQL query or interpreting a dataset).
8. **Subskill Diagnosis:** Evaluation engine scores the submission against subskill criteria.
9. **Evidence Persistence:** Skill Evidence Store is updated with scores, timestamps, and error patterns.
10. **Dynamic Replanning:** If weaknesses are detected, the planner inserts prerequisite remediation before unlocking advanced modules.
11. **Explainability Review:** UI highlights the roadmap mutation with direct reasoning.
12. **Grounded Inquiries:** Learner can query the agent: *"Why am I doing this exercise now?"*
13. **Progress Tracking:** Dashboard reflects evolving mastery states.

---

## 8. Functional Requirements

### 8.1 Profile & Resume Analyzer
- Ingest user profile parameters and parse PDF resumes.
- Extract structured entities: Skills, Projects, Certifications, Tools, Education, Experience.
- Differentiate between **explicit evidence** (e.g., *"Built ETL pipeline using PostgreSQL"*) and **inferred familiarity**.
- Provide learner an editable review screen to adjust or confirm extracted skills.

### 8.2 Skill-Gap Engine
- Maintain a structured ontology for target roles (e.g., Data Analyst: SQL, Excel, Python, Statistics, BI/Visualization).
- Benchmark extracted learner evidence against role requirements.
- Classify each competency: `Strong`, `Developing`, `Weak`, or `Missing`.
- Weight skills by market demand and logical prerequisites to establish learning priority.

### 8.3 Learning Planner
- Convert high-priority gaps into concrete, measurable weekly learning objectives.
- Enforce prerequisite validation (e.g., Basic SELECT & JOINs before Window Functions).
- Balance cognitive load based on learner's declared weekly hours.
- Mix theoretical conceptual resources with practical challenges.

### 8.4 Adaptive Learning Track
- Provide 2–3 curated resources per learning objective with explicit rationale (*"Why this resource"*).
- Include verified YouTube video recommendations with time-to-complete estimates.
- Prevent broken or hallucinated links via pre-validated resource indices.
- Support real-time item substitution post-assessment.

### 8.5 Skill Proof & Evaluation
- Dynamically generate scenario-based practical tasks testing target subskills.
- Accept raw input (SQL queries, code snippets, written analyses, formulas).
- Evaluate against structured rubrics: correctness, edge-case handling, and underlying concept understanding.
- Produce granular diagnostic feedback outlining strengths, specific misconceptions, and remediation suggestions.

### 8.6 Progress & Grounded Q&A
- Visual state tracker: Acquired vs. Improving vs. Remaining skills.
- Transparent audit trail of roadmap mutations.
- Chat assistant with retrieval-augmented context over the learner's profile, roadmap, and evidence history.

---

## 9. Screen & Interface Architecture

| # | Screen | Key Capabilities & Elements |
|---|---|---|
| **1** | **Onboarding** | Target role picker, career aspirations, weekly hour commitment slider. |
| **2** | **Resume Analyzer** | PDF drag-and-drop, real-time extraction progress, editable extracted skill badges. |
| **3** | **Skill Gap Dashboard** | Visual role ontology, color-coded gap matrix (`Strong` / `Dev` / `Weak` / `Missing`). |
| **4** | **My Roadmap** | Interactive timeline, weekly sprints, milestone cards, prerequisite locks. |
| **5** | **Learning Track** | Curated videos/articles, estimated time, key takeaways, *"Start Practice"* CTA. |
| **6** | **Skill Proof** | Interactive prompt, code/text editor, execution/submit interface. |
| **7** | **Diagnostic Modal** | Subskill score breakdown, identified strengths, precise conceptual gaps. |
| **8** | **Roadmap Mutation Alert** | Visual diff indicator showing inserted review steps and delayed advanced topics. |
| **9** | **Progress Report** | Cumulative mastery percentage, competency timeline, skill ledger. |
| **10** | **Ask SkillForge** | Context-aware chat drawer answering questions regarding plan rationale and next steps. |

---

## 10. System Architecture & Orchestration

SkillForge implements a single **Career/Learning Orchestrator** managing specialized functional modules and persistent state:

```mermaid
graph TB
    subgraph Client [Learner Frontend (React + Vite)]
        UI[UI / Dashboard / Workspace]
        ChatUI[Ask SkillForge Drawer]
    end

    subgraph Orchestrator [Career & Learning Orchestrator]
        ROUTER[Agent Dispatcher & State Controller]
    end

    subgraph Modules [Specialized Functional Modules]
        PA[Resume & Profile Analyzer]
        SGE[Skill-Gap Engine]
        LP[Learning Planner]
        RR[Resource Retrieval Engine]
        TG[Task Generator]
        EE[Evidence Evaluator]
        ARP[Adaptive Replanner]
        QA[Grounded Q&A Agent]
    end

    subgraph Storage [State & Knowledge Store]
        DB[(User & Profile DB)]
        ONTOLOGY[(Role Skill Map Ontology)]
        EVID[(Skill Evidence Store)]
        RESOURCES[(Curated Resource Repository)]
    end

    UI -->|Profile & Resume| ROUTER
    ROUTER --> PA
    PA --> DB
    
    ROUTER --> SGE
    SGE --> ONTOLOGY
    SGE --> EVID

    ROUTER --> LP
    LP --> RESOURCES
    LP --> UI

    UI -->|Task Submission| ROUTER
    ROUTER --> EE
    EE --> EVID
    
    EVID --> ARP
    ARP -->|Mutated Roadmap| LP
    LP --> UI

    ChatUI -->|Why did this change?| QA
    QA --> EVID
    QA --> LP
    QA --> ChatUI
```

---

## 11. Recommended Tech Stack

- **Frontend:** React (Vite) with modern Vanilla CSS design system (Dark mode, glassmorphism, responsive micro-interactions).
- **Backend / Orchestration:** Python (FastAPI) or Node.js / Serverless API routes.
- **LLM / Agent Engine:** High-performance LLM (Gemini 1.5 Pro / Flash) with structured JSON Schema enforcement.
- **Database & State:** Supabase or Firebase (Firestore) for fast profile, evidence, and roadmap storage.
- **PDF Extraction:** `pdf-parse` / `pypdf` with structured LLM entity extraction.
- **Curated Resource Index:** Local JSON repository of verified tutorials and YouTube videos for foolproof demo reliability.
- **Deployment:** Vercel (Frontend & Serverless) / Railway / Render.

---

## 12. Core Data Models

```typescript
// Learner Profile
interface User {
  id: string;
  name: string;
  target_role: string;       // e.g. "Data Analyst"
  goal: string;              // e.g. "Get an entry-level analyst job in 3 months"
  hours_per_week: number;    // e.g. 10
  created_at: string;
}

// Role Skill Ontology
interface Skill {
  id: string;
  role: string;
  name: string;              // e.g. "SQL"
  subskills: string[];       // e.g. ["SELECT", "JOINs", "GROUP BY", "Window Functions"]
  prerequisites: string[];   // Skill IDs
}

// Identified Skill Gap
interface Gap {
  id: string;
  user_id: string;
  skill_id: string;
  subskill: string;
  status: 'Strong' | 'Developing' | 'Weak' | 'Missing';
  confidence: number;        // 0.0 - 1.0
  priority: number;          // 1 (Highest) - 5
}

// Persistent Skill Evidence
interface Evidence {
  id: string;
  user_id: string;
  source: 'resume' | 'assessment' | 'project';
  skill: string;
  subskill: string;
  evidence_text: string;
  score: number;             // 0 - 100
  confidence: number;
  timestamp: string;
}

// Learning Resource
interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'article' | 'documentation';
  skill: string;
  subskill: string;
  duration_minutes: number;
  reason_selected: string;
}

// Practical Task
interface Task {
  id: string;
  skill: string;
  subskill: string;
  title: string;
  prompt: string;
  starter_code?: string;
  expected_concepts: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

// Task Assessment
interface Assessment {
  id: string;
  task_id: string;
  user_id: string;
  submitted_work: string;
  score: number;
  subskill_diagnostics: {
    subskill: string;
    passed: boolean;
    feedback: string;
  }[];
  overall_feedback: string;
  timestamp: string;
}

// Adaptive Roadmap Item
interface RoadmapWeek {
  week: number;
  title: string;
  objective: string;
  status: 'locked' | 'active' | 'completed' | 'remediated';
  resources: Resource[];
  tasks: Task[];
}

// Roadmap Mutation Log
interface RoadmapChange {
  id: string;
  user_id: string;
  timestamp: string;
  trigger_evidence_id: string;
  old_step: string;
  new_step: string;
  explanation: string;
}
```

---

## 13. Example Demo Scenario

1. **Persona:** Priya — 3rd-year CS student targeting **Data Analyst**. Has basic Python and Excel experience, but zero formal SQL work experience.
2. **Upload:** Ingests her academic resume. Extracted: Python (Developing), Excel (Strong), SQL (Missing), Tableau (Missing).
3. **Skill Map & Gaps:** SkillForge marks SQL as a Critical Missing Gap and queues a personalized 6-week curriculum.
4. **Learning Phase:** Priya views a curated 12-minute breakdown on SQL relational queries.
5. **Practical Test:** SkillForge prompts:  
   > *"Write a query to calculate total revenue per customer category, combining customers, orders, and products tables."*
6. **Submission & Evaluation:**
   - Priya submits a query utilizing `SUM()` and `GROUP BY` correctly, but makes a Cartesian product error with improper `JOIN` conditions.
   - Evaluator Diagnostic:
     - `GROUP BY & Aggregations`: ✅ Passed (95%)
     - `Multi-table JOIN logic`: ❌ Failed (40%)
7. **Roadmap Mutation:**
   - Instead of advancing to *"Window Functions & Subqueries"*, SkillForge inserts a focused module: *"Relational Keys & Multi-Table INNER/LEFT JOIN Drill"*.
8. **Explainability:**
   - Notification banner: *"Roadmap Updated: We inserted a targeted JOIN practice exercise because your latest submission had trouble joining orders to products."*
   - Priya opens chat: *"Why was my plan modified?"* SkillForge responds directly with citation to her query logic.
9. **Progress Dashboard:** Shows SQL progressing from `Missing` → `Developing`, highlighting aggregation as acquired and JOINs as in remediation.

---

## 14. Demo "Wow" Moment

Do not spend demo time showing long generic text generations. **Show the live state mutation:**

| State | Visual Interface Display |
|---|---|
| **BEFORE** | Roadmap displays: `Week 2: SQL Basics` ➔ `Week 3: Advanced SQL & Window Functions` |
| **PROOF** | Learner executes SQL query in the interactive runner. |
| **DIAGNOSIS** | Subskill breakdown: Aggregation (Strong) \| Multi-Table JOINs (Weak). |
| **AFTER** | Roadmap instantly updates: Inserts `Week 2.5: Multi-Table JOIN Mastery & Interactive Drill` before allowing access to Advanced SQL. |
| **EXPLANATION** | Dynamic card appears: *"Your roadmap adapted based on practical task evidence."* |

---

## 15. Prototype Success Metrics

- **Time to Initial Roadmap:** < 90 seconds from resume upload to active plan.
- **Evidence-Driven Mutation:** 100% reliable roadmap update triggered by test failure.
- **Explainability Grounding:** Agent cites exact code/submission lines when explaining roadmap adjustments.
- **Demo Velocity:** The full 4-step loop (`Learn → Prove → Diagnose → Adapt`) can be demonstrated live in **under 3 minutes**.

---

## 16. Risks & Mitigations

| Identified Risk | Impact | Mitigation Strategy |
|---|---|---|
| **LLM generates generic advice** | High | Strictly constrain generation using pre-defined role skill ontologies and structured JSON schemas. |
| **Hallucinated resource links** | High | Pre-seed a verified database of curated YouTube videos and documentation for the demo role. |
| **Feels like a standard chatbot** | High | Anchor the UX around state dashboards, visual diffs, and interactive task submissions rather than a chat interface. |
| **Scope creep during hackathon** | Critical | Lock focus onto one target role (*Data Analyst*) and one deep subskill loop (*SQL JOINs*). |
| **PDF parsing failure** | Medium | Fallback to pre-parsed sample resumes or direct editable text review. |

---

## 17. Demo Checklist

- [ ] Complete profile creation with Data Analyst target role.
- [ ] Resume PDF upload and entity extraction preview.
- [ ] Visual skill-gap dashboard loaded with status indicators.
- [ ] Initial personalized roadmap rendered.
- [ ] Learning track opened with curated resources.
- [ ] Skill-proof challenge displayed with interactive submission.
- [ ] Subskill-level diagnostic modal rendered.
- [ ] Roadmap visibly mutates (before/after diff).
- [ ] Explicit reason for change displayed on screen.
- [ ] Progress report updated with current mastery metrics.
- [ ] Grounded Q&A successfully answers *"Why did my plan change?"*.
- [ ] End-to-end demo execution completes in under 3 minutes without manual intervention.

---

## 18. Hackathon Build Priorities

```
[ Priority 1 ] Target Role Skill Map & Gap Analysis Engine
       ↓
[ Priority 2 ] Initial Personalized Roadmap Generator
       ↓
[ Priority 3 ] Practical Skill-Proof Task Runner
       ↓
[ Priority 4 ] AI Subskill Diagnostic Evaluator
       ↓
[ Priority 5 ] Dynamic Replanner & Roadmap Mutation Engine
       ↓
[ Priority 6 ] Curated Learning Track & YouTube Resource Viewer
       ↓
[ Priority 7 ] Progress Ledger & Explainable Agentic Q&A
       ↓
[ Final Polish ] Visual Design System (Dark mode, micro-interactions, animations)
```

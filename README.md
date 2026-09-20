````markdown
# 🎓 EduPath

## AI-Powered Adaptive Learning Platform

> **Learn what you need. Prove what you know. Adapt as you grow.**

EduPath is an AI-powered adaptive learning platform that creates a personalized learning journey for each learner.

Instead of giving every learner the same courses and roadmap, EduPath first understands the learner's current skills, identifies skill gaps, creates a personalized roadmap, provides focused learning, evaluates practical performance, diagnoses mistakes, and adapts the next learning step.

The main idea behind EduPath is simple:

> **A learner's performance should change their learning path.**

---

# 📌 Table of Contents

- [Overview](#-overview)
- [Problem](#-problem)
- [Solution](#-solution)
- [How EduPath Works](#-how-edupath-works)
- [Core Learning Loop](#-core-learning-loop)
- [Key Features](#-key-features)
- [AI Integration](#-ai-integration)
- [Adaptive Learning Example](#-adaptive-learning-example)
- [System Architecture](#-system-architecture)
- [Application Flow](#-application-flow)
- [Shared Learner State](#-shared-learner-state)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [Testing](#-testing)
- [Example User Journey](#-example-user-journey)
- [Why EduPath](#-why-edupath)
- [Current Scope](#-current-scope)
- [Future Improvements](#-future-improvements)
- [Security](#-security)
- [License](#-license)

---

# 🌟 Overview

Traditional online learning platforms often follow a predefined structure:

```text
Course
   ↓
Lesson
   ↓
Quiz
   ↓
Next Lesson
````

This assumes that learners have similar backgrounds and learning needs.

In reality, learners are different.

One learner may already understand Python but struggle with SQL.

Another learner may understand SQL basics but have difficulty with database joins.

Another learner may understand the theory but struggle to apply it in a practical problem.

A fixed learning path cannot easily handle these differences.

EduPath takes a different approach.

```text
Learner
   ↓
Understand Current Skills
   ↓
Identify Skill Gaps
   ↓
Create Personalized Roadmap
   ↓
Learn
   ↓
Prove Knowledge
   ↓
Diagnose Mistakes
   ↓
Adapt Learning Path
   ↓
Continue Learning
```

The learner's performance and mistakes become new information for the system.

---

# ❗ Problem

Learners commonly face several challenges when developing new skills.

### One roadmap for everyone

Many learning platforms provide predefined learning paths that follow the same sequence for every learner.

### Difficulty identifying the actual skill gap

A learner may know that they are struggling but may not know exactly which concept is causing the problem.

### Learning without practical validation

Completing a lesson does not necessarily mean that the learner can apply the concept.

### Mistakes are underused

A wrong answer is often treated simply as:

```text
❌ Incorrect
```

However, a mistake can provide useful information about what the learner does not understand.

### Learning paths do not always adapt

Even after repeated mistakes, a learner may continue following the original learning sequence.

---

# 💡 Solution

EduPath creates an adaptive learning system around the learner.

The platform connects:

```text
Profile
   ↓
Skill Gap
   ↓
Roadmap
   ↓
Learn
   ↓
Prove
   ↓
Diagnose
   ↓
Adapt
   ↓
Updated Learning Path
```

Each stage uses information from the previous stages.

For example, if the system identifies that a learner is weak in SQL JOINs:

```text
Skill Gap
    ↓
SQL JOINs identified as weak
    ↓
Roadmap
    ↓
JOIN-focused learning
    ↓
Learn
    ↓
JOIN challenge
    ↓
Prove
    ↓
Learner makes a mistake
    ↓
Diagnose
    ↓
AI identifies the problem
    ↓
Adapt
    ↓
Additional targeted learning
```

This creates a continuous feedback loop.

---

# 🔄 How EduPath Works

EduPath is organized into seven connected stages.

```text
1. Profile
      ↓
2. Skill Gap
      ↓
3. Roadmap
      ↓
4. Learn
      ↓
5. Prove
      ↓
6. Diagnose
      ↓
7. Adapt
      ↓
Updated Learner State
      ↓
Updated Roadmap
```

Each section has a specific purpose.

---

# 👤 1. Profile

The learner begins by providing information about their learning goal.

Example:

```text
Target Role:
Data Analyst

Current Skills:
Python
Excel
SQL

Experience:
Beginner

Learning Goal:
Become job-ready as a Data Analyst
```

The profile provides the initial context for personalization.

Information can include:

* Target role
* Existing skills
* Experience level
* Learning objective
* Available learning time
* Existing evidence of skills

---

# 🔍 2. Skill Gap

The Skill Gap section identifies the difference between:

```text
What the learner currently knows
                 vs
What the learner needs to know
```

The system can identify:

* Current proficiency
* Required proficiency
* Missing skills
* Weak skills
* Prerequisites
* Skill priority
* Supporting evidence

Example:

```text
Skill                 Current Level       Required Level

Python                Good                Good
Excel                 Good                Good
SQL Basics             Moderate            Good
SQL JOINs              Weak                Good
Data Analysis          Basic               Good
```

The system can then select an active skill that should receive attention.

Example:

```text
Current Focus:
SQL JOINs
```

This active skill becomes important for the next sections.

---

# 🗺️ 3. Roadmap

The roadmap is personalized according to the learner's current state.

Instead of relying only on a fixed course sequence, the roadmap can consider:

* Target role
* Current skills
* Skill gaps
* Current proficiency
* Required proficiency
* Previous assessments
* Failed concepts
* Learning objective
* Available learning time

Example:

```text
Personalized Data Analyst Roadmap

Week 1
SQL Fundamentals

Week 2
SQL Filtering and Aggregation

Week 3
SQL JOINs
        ↑
        Current Focus

Week 4
Advanced SQL

Week 5
Data Analysis Projects
```

If the learner struggles with a particular concept, the roadmap can change accordingly.

---

# 📚 4. Learn

The Learn section provides learning guidance based on the learner's current focus.

For example:

```text
Current Skill Gap:
SQL JOINs
```

Instead of showing unrelated material, EduPath can provide learning focused on:

* JOIN concepts
* INNER JOIN
* LEFT JOIN
* Multiple-table relationships
* Practical examples
* Common mistakes
* Practice guidance

The learning experience is connected to the current skill gap.

---

# 🧪 5. Prove

EduPath does not assume that completing a lesson means the learner has mastered the topic.

The learner must demonstrate their understanding.

The Prove section provides a practical challenge related to the learner's current skill.

Example:

```text
Learning Focus:
SQL JOINs

Challenge:
Write a query that combines customer
and order information using the appropriate JOIN.
```

The learner submits an answer.

The system then evaluates the answer.

---

# 🧠 6. Diagnose

When the learner makes a mistake, EduPath does more than determine whether the answer is correct or incorrect.

It attempts to understand the reason behind the mistake.

The diagnosis can consider:

```text
Was the answer incorrect?

Was there a conceptual mistake?

Is a prerequisite missing?

Which skill is weak?

What should the learner practice next?

Should the difficulty change?
```

Example:

```text
Result:
Incorrect

Possible Issue:
Incorrect understanding of JOIN relationships

Prerequisite:
Understanding primary/foreign key relationships

Next Step:
Review table relationships and practice
basic JOIN examples before attempting
multi-table problems again.
```

The diagnosis becomes new learning evidence.

---

# 🔄 7. Adapt

The Adapt section uses the latest learner evidence to determine what should happen next.

For example:

### Before

```text
SQL Basics
    ↓
SQL JOINs
    ↓
Advanced SQL
```

### After the learner struggles

```text
SQL Basics
    ↓
Database Relationships
    ↓
Basic JOIN Practice
    ↓
SQL JOINs
    ↓
Advanced SQL
```

The system can therefore change the learner's next step based on their performance.

---

# 🔁 Core Learning Loop

The central idea of EduPath can be represented in one simple loop:

```text
┌───────────────┐
│   UNDERSTAND  │
│    LEARNER    │
└───────┬───────┘
        ↓
┌───────────────┐
│  FIND SKILL   │
│     GAP       │
└───────┬───────┘
        ↓
┌───────────────┐
│     TEACH     │
└───────┬───────┘
        ↓
┌───────────────┐
│     TEST      │
└───────┬───────┘
        ↓
┌───────────────┐
│   DIAGNOSE    │
│    MISTAKE    │
└───────┬───────┘
        ↓
┌───────────────┐
│     ADAPT     │
└───────┬───────┘
        │
        └──────────────→ New Learning Step
```

### Key principle

> **Every assessment creates new information about the learner.**

That information can influence the next learning step.

---

# ✨ Key Features

## 🎯 Personalized Skill Analysis

Identifies the difference between current and required skills.

## 🤖 AI-Powered Reasoning

Uses AI to support skill analysis, roadmap generation, learning guidance, challenge generation, answer evaluation, diagnosis, and adaptation.

## 🗺️ Adaptive Roadmap

Creates a learning path based on the learner's current state.

## 📖 Personalized Learning

Provides learning guidance related to the learner's active skill gap.

## 🧪 Practical Assessment

Learners demonstrate their knowledge through practical challenges.

## 🧠 Mistake Diagnosis

Analyzes learner answers to identify possible conceptual issues and weak areas.

## 🔄 Continuous Adaptation

Uses new learner evidence to update the recommended learning path.

## 🌱 Role-Agnostic Design

The system is designed around skills and learning goals rather than being limited to a single career path.

---

# 🤖 AI Integration

AI is used as the main reasoning layer of the adaptive workflow.

### Skill Gap Analysis

AI can analyze learner information and available evidence to identify relevant skill gaps.

### Roadmap Generation

AI can use the learner's target role, skill gaps, proficiency, previous performance, and learning objective to generate a personalized roadmap.

### Learning Guidance

AI can provide guidance related to the learner's current skill focus.

### Challenge Generation

AI can generate or customize practical challenges according to the learner's current skill.

### Answer Evaluation

AI can evaluate submitted answers and provide structured feedback.

### Diagnosis

AI can identify possible conceptual mistakes, weak skills, prerequisites, and recommended next steps.

### Adaptation

AI can use the latest learner evidence to determine how the learning path should change.

---

# 🧩 Shared Learner State

The different sections of EduPath are connected through a shared learner state.

The state can contain information such as:

```text
Target Role
Current Skills
Required Skills
Skill Gaps
Active Skill
Current Proficiency
Required Proficiency
Evidence
Assessment History
Failed Concepts
Prerequisites
Learning Objective
Roadmap
Next Action
```

This allows information to move between different stages.

For example:

```text
Skill Gap
    ↓
Identifies weak skill
    ↓
Roadmap
    ↓
Uses weak skill
    ↓
Learn
    ↓
Teaches weak skill
    ↓
Prove
    ↓
Tests weak skill
    ↓
Diagnose
    ↓
Analyzes performance
    ↓
Adapt
    ↓
Updates next action
```

---

# 🏗️ System Architecture

High-level architecture:

```text
                         ┌─────────────────┐
                         │     LEARNER     │
                         └────────┬────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │     PROFILE     │
                         └────────┬────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │   SKILL GAP     │
                         │       AI        │
                         └────────┬────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │    ROADMAP      │
                         │       AI        │
                         └────────┬────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │      LEARN      │
                         │       AI        │
                         └────────┬────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │      PROVE      │
                         │   Assessment    │
                         └────────┬────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │    DIAGNOSE     │
                         │       AI        │
                         └────────┬────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │      ADAPT      │
                         │       AI        │
                         └────────┬────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │ UPDATED LEARNER │
                         │      STATE      │
                         └────────┬────────┘
                                  │
                                  └─────────────→ ROADMAP
```

---

# 🔄 Application Flow

```text
START
  │
  ↓
Create Profile
  │
  ↓
Select Target Role
  │
  ↓
Analyze Skills
  │
  ↓
Identify Skill Gaps
  │
  ↓
Select Active Skill
  │
  ↓
Generate Roadmap
  │
  ↓
Start Learning
  │
  ↓
Attempt Challenge
  │
  ↓
Evaluate Answer
  │
  ├────────────── Correct ──────────────┐
  │                                     │
  │                                     ↓
  │                              Increase Difficulty
  │                                     │
  │                                     ↓
  │                                Next Skill
  │
  └────────────── Incorrect ────────────┐
                                        │
                                        ↓
                                  Diagnose Error
                                        │
                                        ↓
                              Identify Weak Concept
                                        │
                                        ↓
                              Identify Prerequisite
                                        │
                                        ↓
                                  Adapt Roadmap
                                        │
                                        ↓
                                  Targeted Learning
                                        │
                                        ↓
                                    Re-assess
```

---

# 🧠 Shared Learner State

EduPath keeps the different sections connected using shared learner information.

The learner state can include:

```text
Target Role
Current Skills
Required Skills
Skill Gaps
Active Skill
Skill Proficiency
Evidence
Assessment History
Failed Concepts
Prerequisites
Learning Objective
Roadmap
Next Action
```

This prevents the different sections from behaving as completely separate features.

For example:

```text
Skill Gap detects:
"SQL JOINs need improvement"

        ↓

Roadmap:
Adds SQL JOIN practice

        ↓

Learn:
Provides JOIN-focused learning

        ↓

Prove:
Gives a JOIN challenge

        ↓

Learner makes a mistake

        ↓

Diagnose:
Identifies the underlying issue

        ↓

Adapt:
Changes the next learning step
```

---

# 🛠️ Technology Stack

## Frontend

* React
* TypeScript
* Vite
* HTML
* CSS
* Component-based UI

## Backend

* Python
* API-based backend
* Structured JSON responses

## Artificial Intelligence

* Large Language Model based reasoning
* AI skill-gap analysis
* AI roadmap generation
* AI learning guidance
* AI challenge generation
* AI answer evaluation
* AI diagnosis
* AI adaptation

## Development Tools

* Git
* GitHub
* VS Code
* npm
* Python

---

# 📂 Project Structure

A simplified project structure:

```text
EduPath/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── sections/
│   │   ├── context/
│   │   └── ...
│   │
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── ...
│
├── README.md
├── package.json
└── ...
```

> The exact structure may change as the project evolves.

---

# ⚙️ Installation

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Python 3.x
* Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/EduPath.git
```

Move into the project directory:

```bash
cd EduPath
```

---

## 2. Install Frontend Dependencies

```bash
npm install
```

---

## 3. Install Backend Dependencies

If the project contains a backend requirements file:

```bash
pip install -r backend/requirements.txt
```

---

# 🔐 Environment Variables

EduPath uses an AI service for its AI-powered functionality.

Create a `.env` file according to the environment variables expected by the backend.

Example:

```env
AI_API_KEY=your_api_key_here
```

Replace the placeholder with your actual API key.

### Important

Never upload API keys to GitHub.

Make sure your `.gitignore` contains:

```text
.env
.env.local
```

---

# ▶️ Running the Project

## Start the Backend

From the project root:

```bash
python backend/main.py
```

If your backend uses a different startup command, use the command defined by the project configuration.

---

## Start the Frontend

In another terminal:

```bash
npm run dev
```

Vite will provide a local development URL.

Open that URL in your browser.

---

# 🧪 Testing

The project can be tested using the available frontend build and backend tests.

## Frontend Build

```bash
npm run build
```

A successful build confirms that the frontend can be compiled successfully.

## Backend Tests

```bash
pytest backend/tests/test_phase1.py
```

Tests help verify that important backend functionality continues to work after changes.

---

# 🧠 AI Response Handling

AI responses are expected to follow structured formats so that the frontend can safely use the generated information.

The application can also use fallback behavior when:

* An AI API key is unavailable
* An AI request fails
* An AI response is malformed
* A service temporarily becomes unavailable

The fallback behavior is intended for reliability.

When the AI service is available, the AI-based adaptive workflow is the primary path.

---

# 🔐 Security

EduPath should follow standard security practices.

### API Keys

Never expose API keys in frontend code.

### Environment Variables

Store sensitive credentials in environment variables.

### GitHub

Do not commit:

```text
.env
API keys
Passwords
Private credentials
Secret tokens
```

### User Data

If EduPath is deployed publicly, appropriate protections should be added for learner information and submitted answers.

---

# 🎯 Design Principles

EduPath follows several core principles.

## 1. Learner First

The system should adapt to the learner instead of forcing every learner into the same path.

## 2. Evidence Based

Learning decisions should use available learner evidence such as:

* Profile information
* Skill assessments
* Answers
* Mistakes
* Previous performance

## 3. Continuous Feedback

Every assessment can provide information for the next learning step.

## 4. Practical Learning

Learners should demonstrate their knowledge through practical tasks.

## 5. Adaptation

The learning path should be able to change when new evidence indicates that a different learning step is needed.

---

# 🆚 Traditional Learning vs EduPath

| Traditional Learning     | EduPath                          |
| ------------------------ | -------------------------------- |
| Fixed roadmap            | Adaptive roadmap                 |
| Same path for learners   | Personalized path                |
| Lesson-focused           | Skill-gap-focused                |
| Basic quiz results       | Performance evidence             |
| Wrong answer = incorrect | Wrong answer = learning evidence |
| Static sequence          | Adaptable sequence               |
| Limited diagnosis        | AI-assisted diagnosis            |
| Learn → Test             | Learn → Test → Diagnose → Adapt  |

---

# 🌍 Potential Applications

EduPath can be applied to different learning domains.

### Students

Personalized academic and technical learning.

### Career Preparation

Learning paths based on target roles.

### Technical Skills

Programming, data science, electronics, cloud, cybersecurity, and more.

### Professional Upskilling

Helping professionals identify and improve missing skills.

### Interview Preparation

Identifying weak areas and generating targeted practice.

### Certification Preparation

Adapting preparation based on assessment performance.

---

# 🚀 Future Improvements

## 📈 Advanced Progress Analytics

Track:

* Skill growth
* Learning time
* Assessment performance
* Improvement rate
* Repeated mistakes

## 🧠 Better Skill Knowledge Graph

Create relationships between skills and prerequisites.

Example:

```text
Programming Basics
        ↓
Python
        ↓
Data Structures
        ↓
Data Analysis
        ↓
Machine Learning
```

This could help the system better understand prerequisite relationships.

## 🎯 More Assessment Types

Future versions could support:

* Multiple-choice questions
* Coding problems
* SQL problems
* Debugging tasks
* Case studies
* Projects
* Open-ended answers
* Practical simulations

## 📚 Larger Learning Resource System

The platform could connect learners with:

* Courses
* Documentation
* Videos
* Articles
* Tutorials
* Practice platforms
* Projects

## 📊 Long-Term Skill Tracking

EduPath could maintain a long-term learner profile showing how skills improve over time.

## 👥 Multi-Role Learning

A learner could create different learning goals.

Example:

```text
Goal 1:
Data Analyst

Goal 2:
Machine Learning Engineer

Goal 3:
Software Developer
```

Each goal could have a different skill map and roadmap.

## 🧑‍💻 Portfolio Integration

After developing important skills, EduPath could recommend projects that demonstrate those skills.

---

# 📌 Current Scope

The current version focuses on the core adaptive learning workflow:

* Learner profile
* Skill-gap identification
* Personalized roadmap
* Adaptive learning guidance
* Practical skill challenges
* AI-based answer evaluation
* AI-assisted diagnosis
* Adaptive next-step recommendations
* Shared learner state

The architecture is designed to be extended to additional skills, roles, and learning domains.

---

# ⚠️ Current Limitations

EduPath is an evolving application and currently has some limitations.

Some areas may still use:

* Curated learning resources
* Static fallback data
* Rule-based fallback logic
* Limited assessment types
* Limited skill datasets

These components can be expanded as the platform develops.

The core focus is the adaptive learning workflow and the feedback loop connecting learning, assessment, diagnosis, and adaptation.

---

# 🔮 Future Vision

The long-term vision of EduPath is to create a learning system where learners do not always have to manually decide what to learn next.

Instead:

```text
Learner
   ↓
System understands learner
   ↓
System identifies skill gap
   ↓
System creates learning path
   ↓
Learner learns
   ↓
Learner demonstrates skill
   ↓
System analyzes performance
   ↓
System identifies weakness
   ↓
System changes learning path
   ↓
Learner improves
   ↓
Repeat
```

The goal is not simply to recommend more content.

The goal is to recommend the **right next learning action** based on the learner's current state.

---

# 💡 Core Idea

### Traditional Learning

> "Here is the course. Follow it."

### EduPath

> "Here is what you need to improve. Let's work on it."

---

# ❤️ Why EduPath

Learning is not a straight line.

Learners make mistakes.

Learners learn at different speeds.

Learners come from different backgrounds.

A learning system should be able to recognize these differences.

EduPath is built around one simple idea:

> **Learning should adapt to the learner, not the other way around.**

---

# 📄 License

This project is available for educational and development purposes.

If you plan to distribute or reuse the project, add an appropriate open-source license such as MIT according to your requirements.

---

# 🎓 EduPath

> **Learn what you need. Prove what you know. Adapt as you grow.**

```
```

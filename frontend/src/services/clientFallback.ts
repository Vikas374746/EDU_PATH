import type {
  UserProfile,
  SkillGapResponse,
  RoadmapState,
  ResourceItem,
  EvaluationResponse,
  EvidenceRecord,
  RoadmapMutationLog,
  QAResponse,
} from '../types';
import { extractSkillsFromText } from './parseResume';

export const clientFallback = {
  getHealth(): { status: string; service: string } {
    return {
      status: 'healthy',
      service: 'EduPath Agent (Client Runtime)',
    };
  },

  getOntology(): any {
    return {
      role: 'Data Analyst',
      description: 'Canonical skill ontology for Data Analyst careers',
      domains: [
        {
          id: 'spreadsheets',
          name: 'Spreadsheets & Business Modeling',
          weight: 0.25,
          subskills: [
            { id: 'excel_lookups', name: 'Excel Lookups & Pivot Tables', level: 'Advanced', prerequisites: [] },
          ],
        },
        {
          id: 'programming',
          name: 'Programming & Data Wrangling',
          weight: 0.25,
          subskills: [
            { id: 'python_pandas', name: 'Python (Pandas & DataFrames)', level: 'Intermediate', prerequisites: [] },
          ],
        },
        {
          id: 'analytics',
          name: 'Statistical Analytics',
          weight: 0.2,
          subskills: [
            { id: 'stats_descriptive', name: 'Descriptive & Inferential Stats', level: 'Intermediate', prerequisites: [] },
          ],
        },
        {
          id: 'databases',
          name: 'Relational Databases & SQL',
          weight: 0.3,
          subskills: [
            { id: 'sql_joins', name: 'Relational Multi-Table JOINs', level: 'Intermediate', prerequisites: ['sql_basics'] },
          ],
        },
      ],
    };
  },

  getResources(_subskill: string = 'sql_joins'): { subskill: string; resources: ResourceItem[] } {
    return {
      subskill: 'sql_joins',
      resources: [
        {
          id: 'res-joins-1',
          title: 'SQL JOINs Explained Visually',
          author: 'Luke Barousse',
          url: 'https://www.youtube.com/watch?v=9jmg_c7N438',
          type: 'video',
          duration_minutes: 18,
          difficulty: 'Beginner to Intermediate',
          reason_selected: 'Visualizes Venn diagrams and execution order for INNER, LEFT, and RIGHT joins with realistic business data.',
        },
        {
          id: 'res-joins-2',
          title: 'LEFT JOIN and Relational Modeling Practice',
          author: 'Mode SQL Tutorial',
          url: 'https://mode.com/sql-tutorial/sql-joins-where-vs-on/',
          type: 'documentation',
          duration_minutes: 12,
          difficulty: 'Intermediate',
          reason_selected: 'Explains the critical distinction between WHERE filters and ON join predicates to prevent accidental Cartesian cross-products.',
        },
        {
          id: 'res-joins-3',
          title: 'Multi-Table Aggregation Patterns in Production',
          author: 'Data School',
          url: 'https://www.youtube.com/watch?v=HXV3zeRRBAc',
          type: 'video',
          duration_minutes: 16,
          difficulty: 'Intermediate',
          reason_selected: 'Shows how to group aggregated revenue metrics across customers, orders, and line items without duplicate row inflation.',
        },
      ],
    };
  },

  seedDemoProfile(): { profile: UserProfile; gaps: SkillGapResponse } {
    const profile: UserProfile = {
      id: 'candidate-001',
      name: 'Demo Candidate: Priya',
      target_role: 'Data Analyst',
      goal: 'Transition from university coursework to an entry-level Data Analyst role in 3 months',
      hours_per_week: 10,
      education: 'B.S. in Computer Science, State University (Expected May 2027)',
      skills: [
        {
          name: 'Microsoft Excel',
          subskill: 'excel_lookups',
          category: 'Spreadsheets',
          proficiency: 'Advanced',
          confidence: 0.95,
          evidence: 'Built dynamic multi-tab sales model using XLOOKUP, INDEX/MATCH, and nested IF statements.',
        },
        {
          name: 'Python Data Analysis',
          subskill: 'python_pandas',
          category: 'Programming',
          proficiency: 'Intermediate',
          confidence: 0.7,
          evidence: 'Cleaned customer survey datasets with Pandas and generated Matplotlib distributions.',
        },
        {
          name: 'Descriptive Statistics',
          subskill: 'stats_descriptive',
          category: 'Analytics',
          proficiency: 'Intermediate',
          confidence: 0.65,
          evidence: 'Completed coursework in probability distributions, hypothesis testing, and regression analysis.',
        },
        {
          name: 'SQL & Databases',
          subskill: 'sql_joins',
          category: 'Databases',
          proficiency: 'Novice',
          confidence: 0.25,
          evidence: 'Understands basic SELECT and WHERE statements from introductory class. Zero multi-table JOIN or production query experience.',
        },
      ],
    };

    const gaps: SkillGapResponse = {
      target_role: 'Data Analyst',
      readiness_percentage: 42,
      strong_count: 1,
      developing_count: 2,
      weak_count: 0,
      missing_count: 1,
      primary_bottleneck: 'Relational Multi-Table JOINs',
      primaryBottleneck: 'Relational Multi-Table JOINs',
      ai_diagnostic_summary:
        'Critical bottleneck identified: Candidate demonstrates strong analytical foundations (Excel 95%, Python 70%), but lacks applied production SQL skills. Missing multi-table relational joins blocks analytical capability.',
      aiDiagnosticSummary:
        'Critical bottleneck identified: Candidate demonstrates strong analytical foundations (Excel 95%, Python 70%), but lacks applied production SQL skills. Missing multi-table relational joins blocks analytical capability.',
      agent_reasoning:
        'Automated skill ontology comparison identifies SQL JOINs as the highest priority prerequisite for entry-level analyst roles.',
      gaps: [
        {
          subskill_id: 'excel_lookups',
          name: 'Excel Lookups & Modeling',
          domain_id: 'spreadsheets',
          domain_name: 'Spreadsheets',
          status: 'Strong',
          confidence: 0.95,
          priority: 4,
          evidence_text: 'Dynamic sales models using XLOOKUP, INDEX/MATCH',
        },
        {
          subskill_id: 'python_pandas',
          name: 'Python Data Manipulation',
          domain_id: 'programming',
          domain_name: 'Programming',
          status: 'Developing',
          confidence: 0.7,
          priority: 3,
          evidence_text: 'Cleaned datasets using Pandas & Matplotlib',
        },
        {
          subskill_id: 'stats_descriptive',
          name: 'Statistical Foundations',
          domain_id: 'analytics',
          domain_name: 'Analytics',
          status: 'Developing',
          confidence: 0.65,
          priority: 3,
          evidence_text: 'Hypothesis testing, regression, distributions',
        },
        {
          subskill_id: 'sql_joins',
          name: 'Relational Multi-Table JOINs',
          domain_id: 'databases',
          domain_name: 'Databases',
          status: 'Missing',
          confidence: 0.2,
          priority: 1,
          evidence_text: 'Zero multi-table query evidence detected. Prerequisite for analytics.',
        },
      ],
    };

    return { profile, gaps };
  },

  parseTextResume(text: string, name: string = 'Learner', targetRole: string = 'Data Analyst'): { profile: UserProfile; gaps: SkillGapResponse } {
    const parseResult = extractSkillsFromText(text, name, targetRole);
    const gaps = parseResult.toSkillGapResponse();
    const skills = parseResult.toExtractedSkills();

    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      name,
      target_role: targetRole,
      goal: `Achieve job-readiness for ${targetRole} within 3 months`,
      hours_per_week: 10,
      skills,
    };

    return { profile, gaps };
  },

  generateRoadmap(
    userId: string = 'candidate-001',
    targetRole: string = 'Data Analyst',
    _hoursPerWeek: number = 10
  ): RoadmapState & { weekly_plan: any[] } {
    const weekly_plan = [
      {
        week: 1,
        week_number: 1,
        week_label: 'Week 1',
        title: 'SQL Foundations & Relational Schemas',
        objective: 'Master filtering, grouping, and single-table aggregation patterns with realistic business datasets.',
        focus_subskill: 'sql_basics',
        status: 'active' as const,
        modules: [
          { id: 'm1', name: 'SELECT, WHERE, and Logical Operators', status: 'completed' },
          { id: 'm2', name: 'GROUP BY and Aggregate Functions (SUM, COUNT, AVG)', status: 'active' },
        ],
        resources: [
          {
            id: 'res-w1-1',
            title: 'SQL Foundations Guide',
            author: 'EduPath Advisor',
            url: 'https://mode.com/sql-tutorial/',
            type: 'documentation' as const,
            duration_minutes: 20,
            difficulty: 'Beginner',
            reason_selected: 'Foundational SQL patterns.',
          },
        ],
      },
      {
        week: 2,
        week_number: 2,
        week_label: 'Week 2',
        title: 'Multi-Table Relational JOINs',
        objective: 'Connect multiple tables using explicit INNER, LEFT, and RIGHT JOIN conditions without row multiplication.',
        focus_subskill: 'sql_joins',
        status: 'active' as const,
        modules: [
          { id: 'm3', name: 'Relational Foreign Keys & Join Logic', status: 'active' },
          { id: 'm4', name: 'Multi-Table Revenue Aggregation Drill', status: 'active' },
        ],
        resources: [
          {
            id: 'res-w2-1',
            title: 'Visual SQL JOINs',
            author: 'Luke Barousse',
            url: 'https://www.youtube.com/watch?v=9jmg_c7N438',
            type: 'video' as const,
            duration_minutes: 18,
            difficulty: 'Intermediate',
            reason_selected: 'Visualizes join execution order.',
          },
        ],
      },
      {
        week: 3,
        week_number: 3,
        week_label: 'Week 3',
        title: 'Window Functions & Advanced Partitioning',
        objective: 'Apply OVER, PARTITION BY, and rolling window calculations to analyze customer behavior over time.',
        focus_subskill: 'sql_window_functions',
        status: 'locked' as const,
        modules: [
          { id: 'm5', name: 'ROW_NUMBER(), RANK(), and DENSE_RANK()', status: 'locked' },
          { id: 'm6', name: 'Running Totals & Moving Averages', status: 'locked' },
        ],
        resources: [],
      },
      {
        week: 4,
        week_number: 4,
        week_label: 'Week 4',
        title: 'Business Intelligence & Capstone Project',
        objective: 'Transform multi-table SQL queries into interactive executive dashboards with KPIs and visual breakdown.',
        focus_subskill: 'bi_dashboards',
        status: 'locked' as const,
        modules: [
          { id: 'm7', name: 'Data Modeling for BI', status: 'locked' },
          { id: 'm8', name: 'End-to-End Executive Dashboard Portfolio Project', status: 'locked' },
        ],
        resources: [],
      },
    ];

    return {
      user_id: userId,
      target_role: targetRole,
      has_mutation: false,
      weeks: weekly_plan as any,
      weekly_plan,
    };
  },

  getSkillProof(_subskill: string = 'multi_table_joins'): any {
    return {
      challenge: {
        id: 'challenge_sql_join_01',
        title: 'Practical Skill-Proof: Multi-Table Revenue by Customer Tier',
        domain: 'SQL',
        target_subskill: 'sql_joins',
        secondary_subskill: 'sql_aggregations',
        difficulty: 'Intermediate',
        prompt:
          "The executive team wants to understand how spending is distributed across customer tiers. Write a SQL query to calculate total sales revenue (quantity * unit_price) grouped by customer tier ('Gold', 'Silver', 'Bronze'). Your result must return columns `tier` and `total_revenue`, sorted by `total_revenue` descending.",
        tables: [
          {
            name: 'customers',
            columns: [
              { name: 'customer_id', type: 'INT', is_pk: true },
              { name: 'customer_name', type: 'VARCHAR(100)' },
              { name: 'tier', type: 'VARCHAR(20)', note: "'Gold', 'Silver', 'Bronze'" },
            ],
            sample_rows: [
              { customer_id: 101, customer_name: 'Apex Retail', tier: 'Gold' },
              { customer_id: 102, customer_name: 'BlueSky Tech', tier: 'Silver' },
              { customer_id: 103, customer_name: 'Cedar Logistics', tier: 'Bronze' },
            ],
          },
          {
            name: 'orders',
            columns: [
              { name: 'order_id', type: 'INT', is_pk: true },
              { name: 'customer_id', type: 'INT', is_fk: true, references: 'customers.customer_id' },
              { name: 'order_date', type: 'DATE' },
              { name: 'status', type: 'VARCHAR(20)' },
            ],
            sample_rows: [
              { order_id: 5001, customer_id: 101, order_date: '2026-03-01', status: 'Completed' },
              { order_id: 5002, customer_id: 101, order_date: '2026-03-05', status: 'Completed' },
              { order_id: 5003, customer_id: 102, order_date: '2026-03-08', status: 'Completed' },
            ],
          },
          {
            name: 'order_items',
            columns: [
              { name: 'item_id', type: 'INT', is_pk: true },
              { name: 'order_id', type: 'INT', is_fk: true, references: 'orders.order_id' },
              { name: 'product_name', type: 'VARCHAR(100)' },
              { name: 'quantity', type: 'INT' },
              { name: 'unit_price', type: 'DECIMAL(10,2)' },
            ],
            sample_rows: [
              { item_id: 901, order_id: 5001, product_name: 'Enterprise License', quantity: 2, unit_price: 1200.0 },
              { item_id: 902, order_id: 5002, product_name: 'Analytics Addon', quantity: 1, unit_price: 500.0 },
              { item_id: 903, order_id: 5003, product_name: 'Starter Seat', quantity: 4, unit_price: 150.0 },
            ],
          },
        ],
        starter_code:
          'SELECT \n    c.tier,\n    SUM(oi.quantity * oi.unit_price) AS total_revenue\nFROM customers c\n-- Complete the JOIN and GROUP BY logic below\n',
        canonical_buggy_query:
          'SELECT \n    c.tier, \n    SUM(oi.quantity * oi.unit_price) AS total_revenue\nFROM customers c, orders o, order_items oi\nGROUP BY c.tier\nORDER BY total_revenue DESC;',
      },
    };
  },

  evaluateTask(_userId: string, _challengeId: string, queryText: string): EvaluationResponse {
    const textLower = queryText.toLowerCase();
    const hasExplicitJoin = textLower.includes('join') && textLower.includes(' on ');
    const hasGroupBy = textLower.includes('group by');
    const hasSum = textLower.includes('sum(');

    if (hasExplicitJoin && hasGroupBy && hasSum) {
      return {
        challenge_id: 'challenge_sql_join_01',
        overall_score: 94,
        passed: true,
        summary_feedback:
          'Excellent work! Your query correctly applies INNER/LEFT JOIN with proper foreign key ON predicates, and aggregates revenue by tier accurately without Cartesian duplication.',
        requires_replanning: false,
        persisted_evidence_id: `ev-${Date.now()}`,
        diagnostics: [
          {
            subskill_id: 'sql_aggregations',
            subskill_name: 'Aggregations & Grouping',
            score: 96,
            passed: true,
            weak_concepts: [],
            feedback: 'Accurate SUM() aggregation grouped by tier and sorted descending.',
          },
          {
            subskill_id: 'sql_joins',
            subskill_name: 'Multi-Table Relational JOINs',
            score: 92,
            passed: true,
            weak_concepts: [],
            feedback: 'Proper relational key linking using ON predicates between customers, orders, and order_items.',
          },
        ],
      };
    }

    // Flawed query (default demo scenario: comma-separated tables with Cartesian product)
    return {
      challenge_id: 'challenge_sql_join_01',
      overall_score: 52,
      passed: false,
      summary_feedback:
        'Partial mastery: Aggregation and grouping syntax was written correctly (95%), but the query omitted explicit JOIN ... ON conditions, triggering an unintentional Cartesian product (cross-join). Diagnostic proof requires curriculum adaptation.',
      requires_replanning: true,
      persisted_evidence_id: `ev-${Date.now()}`,
      diagnostics: [
        {
          subskill_id: 'sql_aggregations',
          subskill_name: 'Aggregations & Grouping',
          score: 95,
          passed: true,
          weak_concepts: [],
          feedback: 'Valid SUM(quantity * unit_price) calculation grouped by customer tier.',
        },
        {
          subskill_id: 'sql_joins',
          subskill_name: 'Multi-Table Relational JOINs',
          score: 35,
          passed: false,
          weak_concepts: [
            'Cartesian cross-product caused by comma-separated table listing',
            'Missing explicit ON join predicates (c.customer_id = o.customer_id)',
          ],
          feedback:
            'Critical flaw: Comma-separated tables without matching primary/foreign keys duplicate customer spending across unrelated orders.',
        },
      ],
    };
  },

  triggerReplan(userId: string = 'candidate-001'): {
    mutation: RoadmapMutationLog;
    roadmap: RoadmapState & { weekly_plan: any[] };
  } {
    const weekly_plan = [
      {
        week: 1,
        week_number: 1,
        week_label: 'Week 1',
        title: 'SQL Foundations & Relational Schemas',
        objective: 'Master filtering, grouping, and single-table aggregation patterns with realistic business datasets.',
        focus_subskill: 'sql_basics',
        status: 'completed' as const,
        modules: [
          { id: 'm1', name: 'SELECT, WHERE, and Logical Operators', status: 'completed' },
          { id: 'm2', name: 'GROUP BY and Aggregate Functions (SUM, COUNT, AVG)', status: 'completed' },
        ],
      },
      {
        week: 1.5,
        week_number: 1.5,
        week_label: 'Week 1.5 (Inserted Remediation Drill)',
        title: 'Remediation Drill: Relational INNER & LEFT JOIN Mastery',
        objective:
          'Deep dive into relational key mapping. Eliminate Cartesian products and master ON vs. WHERE predicate evaluation.',
        focus_subskill: 'sql_joins',
        status: 'remediated' as const,
        is_mutation_insert: true,
        modules: [
          { id: 'm-rem-1', name: 'Preventing Cartesian Cross-Products', status: 'active' },
          { id: 'm-rem-2', name: 'Explicit INNER JOIN vs. Comma Tables', status: 'active' },
          { id: 'm-rem-3', name: 'Multi-Table Line Item Aggregation Lab', status: 'active' },
        ],
        resources: [
          {
            id: 'res-rem-1',
            title: 'Fixing Accidental Cross-Joins in SQL',
            author: 'EduPath Advisor',
            url: 'https://mode.com/sql-tutorial/sql-joins-where-vs-on/',
            type: 'documentation' as const,
            duration_minutes: 15,
            difficulty: 'Targeted Remediation',
            reason_selected: 'Directly addresses the Cartesian product error observed during the SQL diagnostic challenge.',
          },
        ],
      },
      {
        week: 2,
        week_number: 2,
        week_label: 'Week 2',
        title: 'Applied Multi-Table Query Optimization',
        objective: 'Connect multiple normalized tables and benchmark query execution speed.',
        focus_subskill: 'sql_joins',
        status: 'active' as const,
        modules: [
          { id: 'm3', name: 'Complex Subqueries & CTEs', status: 'active' },
          { id: 'm4', name: 'Execution Plan Inspection', status: 'active' },
        ],
      },
      {
        week: 3,
        week_number: 3,
        week_label: 'Week 3',
        title: 'Window Functions & Advanced Partitioning',
        objective: 'Apply OVER, PARTITION BY, and rolling window calculations.',
        focus_subskill: 'sql_window_functions',
        status: 'locked' as const,
        modules: [
          { id: 'm5', name: 'ROW_NUMBER(), RANK(), and DENSE_RANK()', status: 'locked' },
          { id: 'm6', name: 'Running Totals & Moving Averages', status: 'locked' },
        ],
      },
      {
        week: 4,
        week_number: 4,
        week_label: 'Week 4',
        title: 'Business Intelligence & Capstone Project',
        objective: 'Transform multi-table SQL queries into interactive executive dashboards.',
        focus_subskill: 'bi_dashboards',
        status: 'locked' as const,
        modules: [
          { id: 'm7', name: 'Data Modeling for BI', status: 'locked' },
          { id: 'm8', name: 'End-to-End Executive Dashboard Portfolio Project', status: 'locked' },
        ],
      },
    ];

    const mutation: RoadmapMutationLog = {
      mutation_id: `mut-${Date.now()}`,
      timestamp: new Date().toISOString(),
      trigger_evidence_id: `ev-diag-${Date.now()}`,
      trigger_subskill: 'sql_joins',
      old_step: 'Week 2 (Multi-Table Relational JOINs)',
      new_step: 'Week 1.5 (Relational JOIN Remediation Drill)',
      explanation:
        'Because the SQL proof query lacked explicit LEFT/INNER JOIN logic, EduPath automatically restructured your curriculum. Week 1.5 (Relational JOIN Deep-Dive) has been inserted to build join fluency before you encounter multi-table window analytics.',
    };

    return {
      mutation,
      roadmap: {
        user_id: userId,
        target_role: 'Data Analyst',
        has_mutation: true,
        mutation_explanation: mutation.explanation,
        weeks: weekly_plan as any,
        weekly_plan,
      },
    };
  },

  getEvidence(userId: string = 'candidate-001'): EvidenceRecord[] {
    return [
      {
        id: 'ev-1',
        user_id: userId,
        skill: 'Microsoft Excel',
        subskill: 'excel_lookups',
        evidence: 'Verified dynamic XLOOKUP & INDEX/MATCH formulas in sales modeling portfolio piece.',
        score: 95,
        confidence: 0.95,
        weak_concepts: [],
        next_action: 'Proficiency confirmed — prerequisite satisfied.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'ev-2',
        user_id: userId,
        skill: 'SQL & Databases',
        subskill: 'sql_joins',
        evidence: 'Diagnostic query omitted explicit ON conditions; Cartesian product detected across 3 tables.',
        score: 35,
        confidence: 0.88,
        weak_concepts: ['Cartesian cross-product', 'Missing ON predicates'],
        next_action: 'Mutate curriculum: Insert Week 1.5 Relational JOIN Remediation Drill.',
        timestamp: new Date().toISOString(),
      },
    ];
  },

  askAssistant(_userId: string, question: string): QAResponse {
    const qLower = question.toLowerCase();

    if (qLower.includes('why') && (qLower.includes('change') || qLower.includes('plan') || qLower.includes('adapt') || qLower.includes('mutation'))) {
      return {
        answer:
          'EduPath adapted your learning plan because your SQL diagnostic challenge revealed a 35% score in Multi-Table Relational JOINs. Your query used comma-separated tables (`FROM customers c, orders o, order_items oi`) without explicit `ON` conditions, creating an accidental Cartesian cross-product. Instead of advancing to Window Functions, Week 1.5 (Relational JOIN Deep-Dive) was inserted to ensure join fluency.',
        citations: [
          'Evidence ID: ev-diag-sql-joins (Score: 35%)',
          'Rubric: Multi-Table Relational JOINs (Missing foreign key ON predicates)',
          'Mutated Roadmap: Week 1.5 inserted, Week 3 temporarily locked until remediation is verified',
        ],
        suggested_actions: [
          'Review the Mode SQL Tutorial on WHERE vs. ON',
          'Complete the Week 1.5 Relational Keys Drill',
          'Retake the SQL Skill-Proof challenge to unlock Week 3',
        ],
      };
    }

    return {
      answer:
        `EduPath continuously tracks your evidence ledger. Currently, your critical learning priority is mastering Multi-Table Relational JOINs for the Data Analyst career path. Once you demonstrate mastery of explicit join keys, your roadmap will automatically unlock advanced window functions.`,
      citations: [
        'Target Role: Data Analyst (Prerequisite: Relational Databases)',
        'Active Focus: Multi-Table JOINs',
      ],
      suggested_actions: [
        'Inspect your Skill Gap Dashboard',
        'Practice with the SQL challenge editor',
        'Review the adaptive roadmap diff in Step 7',
      ],
    };
  },
};

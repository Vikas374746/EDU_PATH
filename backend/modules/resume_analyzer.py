import json
import os
import re
from typing import List

from pypdf import PdfReader

from models import ExtractedSkill, UserProfile

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def get_demo_profile() -> UserProfile:
    path = os.path.join(DATA_DIR, "sample_resumes.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    demo = data.get("demo_candidate", data.get("priya", {}))
    skills = [ExtractedSkill(**s) for s in demo.get("skills", [])]
    return UserProfile(
        id="demo-candidate",
        name="Demo Candidate: Data Analyst",
        target_role=demo.get("target_role", "Data Analyst"),
        goal="Transition to entry-level Data Analyst",
        hours_per_week=demo.get("hours_per_week", 10),
        education=demo.get("education", "B.S. in Computer Science"),
        skills=skills,
    )


def extract_text_from_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"


def analyze_raw_text(text: str, name: str = "Candidate", target_role: str = "Data Analyst") -> UserProfile:
    text_lower = text.lower()
    extracted_skills: List[ExtractedSkill] = []

    def match_any(patterns: List[str]) -> bool:
        for pat in patterns:
            escaped = re.escape(pat)
            if re.search(r'\b' + escaped + r'\b', text_lower, re.IGNORECASE):
                return True
        return False

    # 1. sql_basics: Matches "sql", "queries", "select", "group by" -> "Developing" if beginner, "Strong" if advanced
    sql_basics_matched = match_any(["sql", "queries", "select", "group by"])
    is_sql_beginner = bool(
        re.search(r'\bsql\s*\([^)]*beginner[^)]*\)', text_lower)
        or re.search(r'\b(beginner|novice|introductory|basic|fundamentals?)\s+sql\b', text_lower)
        or re.search(r'\bsql\s+(basics?|fundamentals?)\b', text_lower)
        or re.search(r'\bsql\s*:\s*[^,\n]*beginner', text_lower)
    )
    is_sql_advanced = bool(
        re.search(r'\bsql\s*\([^)]*advanced[^)]*\)', text_lower)
        or re.search(r'\b(advanced|expert|senior|mastery)\s+sql\b', text_lower)
        or re.search(r'\bsql\s*:\s*[^,\n]*advanced', text_lower)
    )

    if sql_basics_matched:
        if is_sql_advanced:
            sql_basics_prof = "Advanced"
            sql_basics_conf = 0.90
            sql_basics_evidence = "Advanced SQL query composition and aggregation verified."
        else:
            sql_basics_prof = "Novice" if is_sql_beginner else "Intermediate"
            sql_basics_conf = 0.65
            sql_basics_evidence = "Foundational SQL querying awareness verified (SELECT, GROUP BY, single-table queries)."

        extracted_skills.append(ExtractedSkill(
            name="SQL & Relational Databases",
            subskill="basic_queries",
            category="Databases",
            proficiency=sql_basics_prof,
            confidence=sql_basics_conf,
            evidence=sql_basics_evidence,
        ))
    else:
        extracted_skills.append(ExtractedSkill(
            name="SQL & Relational Databases",
            subskill="basic_queries",
            category="Databases",
            proficiency="None",
            confidence=0.10,
            evidence="No explicit SQL querying detected in resume.",
        ))

    # 2. sql_joins: Matches "join", "inner join", "left join", "relational database" -> "Weak" or "Missing" if not found
    sql_joins_matched = match_any(["join", "inner join", "left join", "relational database"])
    if sql_joins_matched:
        extracted_skills.append(ExtractedSkill(
            name="SQL Multi-Table JOINs",
            subskill="multi_table_joins",
            category="Databases",
            proficiency="Intermediate",
            confidence=0.70,
            evidence="Multi-table relational join concepts detected in profile.",
        ))
    else:
        # Mark as Weak or Missing if not found (for candidate with basic SQL, mark as Weak)
        extracted_skills.append(ExtractedSkill(
            name="SQL Multi-Table JOINs",
            subskill="multi_table_joins",
            category="Databases",
            proficiency="Novice",  # Maps to Weak in gap engine
            confidence=0.25,
            evidence="No multi-table relational JOIN logic or relational schema linking verified.",
        ))

    # 3. sql_advanced: Matches "window function", "cte", "partition by", "rank" -> "Missing"
    sql_adv_matched = match_any(["window function", "window functions", "cte", "partition by", "rank"])
    if sql_adv_matched and is_sql_advanced:
        extracted_skills.append(ExtractedSkill(
            name="Window Functions & CTEs",
            subskill="window_functions",
            category="Databases",
            proficiency="Advanced",
            confidence=0.85,
            evidence="Demonstrated advanced analytical SQL (CTEs, Window Functions).",
        ))
    else:
        extracted_skills.append(ExtractedSkill(
            name="Window Functions & CTEs",
            subskill="window_functions",
            category="Databases",
            proficiency="None",  # Maps to Missing in gap engine
            confidence=0.10,
            evidence="No window functions (PARTITION BY, RANK, CTEs) identified.",
        ))

    # 4. excel: Matches "excel", "pivot", "vlookup", "xlookup" -> "Developing"
    excel_matched = match_any(["excel", "pivot", "vlookup", "xlookup"])
    if excel_matched:
        extracted_skills.append(ExtractedSkill(
            name="Microsoft Excel",
            subskill="excel_lookups",
            category="Spreadsheets",
            proficiency="Intermediate",  # Maps to Developing
            confidence=0.75,
            evidence="Spreadsheet modeling and lookup formulas (Pivot, VLOOKUP/XLOOKUP) verified.",
        ))
    else:
        extracted_skills.append(ExtractedSkill(
            name="Microsoft Excel",
            subskill="excel_lookups",
            category="Spreadsheets",
            proficiency="None",
            confidence=0.10,
            evidence="No spreadsheet modeling identified.",
        ))

    # 5. python_r_pandas: Matches "python", "pandas", "r", "tidyverse", "data wrangling" -> "Strong"
    python_r_matched = match_any(["python", "pandas", "r", "tidyverse", "data wrangling"])
    if python_r_matched:
        extracted_skills.append(ExtractedSkill(
            name="Python & R Data Wrangling",
            subskill="python_pandas",
            category="Programming",
            proficiency="Advanced",  # Status: Strong
            confidence=0.92,
            evidence="Strong data wrangling proficiency in Python / R / Pandas / Tidyverse verified.",
        ))
    else:
        extracted_skills.append(ExtractedSkill(
            name="Python & R Data Wrangling",
            subskill="python_pandas",
            category="Programming",
            proficiency="None",
            confidence=0.10,
            evidence="No Python or R data manipulation libraries detected.",
        ))

    # 6. bi_dashboards: Matches "tableau", "power bi", "dashboard", "data visualization" -> "Developing"
    bi_matched = match_any(["tableau", "power bi", "dashboard", "data visualization"])
    if bi_matched:
        extracted_skills.append(ExtractedSkill(
            name="Business Intelligence & Dashboards",
            subskill="powerbi_modeling",
            category="BI Tools",
            proficiency="Intermediate",  # Status: Developing
            confidence=0.70,
            evidence="Experience with BI reporting tools (Tableau, Power BI, Dashboards) verified.",
        ))
    else:
        extracted_skills.append(ExtractedSkill(
            name="Business Intelligence & Dashboards",
            subskill="powerbi_modeling",
            category="BI Tools",
            proficiency="None",
            confidence=0.10,
            evidence="No business intelligence dashboard tools detected.",
        ))

    # Coursework statistics if mentioned
    if match_any(["statistics", "regression", "probability", "hypothesis test", "a/b test"]):
        extracted_skills.append(ExtractedSkill(
            name="Applied Statistics",
            subskill="stats_descriptive",
            category="Analytics",
            proficiency="Intermediate",
            confidence=0.65,
            evidence="Coursework or applied experience in statistical methods verified.",
        ))

    return UserProfile(
        id="learner-" + re.sub(r'\W+', '', name.lower())[:10],
        name=name,
        target_role=target_role,
        goal=f"Attain {target_role} readiness and close skill gaps",
        hours_per_week=10,
        education="Detected from resume",
        skills=extracted_skills,
    )

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
    priya = data.get("priya", {})
    skills = [ExtractedSkill(**s) for s in priya.get("skills", [])]
    return UserProfile(
        id="priya-101",
        name=priya.get("name", "Priya Sharma"),
        target_role=priya.get("target_role", "Data Analyst"),
        goal=priya.get("goal", "Transition to entry-level Data Analyst"),
        hours_per_week=priya.get("hours_per_week", 10),
        education=priya.get("education", "B.S. in Computer Science"),
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


def analyze_raw_text(text: str, name: str = "Learner", target_role: str = "Data Analyst") -> UserProfile:
    text_lower = text.lower()
    extracted_skills: List[ExtractedSkill] = []

    if any(k in text_lower for k in ["excel", "vlookup", "xlookup", "pivot table", "spreadsheet"]):
        if any(k in text_lower for k in ["xlookup", "index/match", "complex formulas", "pivot"]):
            extracted_skills.append(ExtractedSkill(
                name="Microsoft Excel",
                subskill="excel_lookups",
                category="Spreadsheets",
                proficiency="Advanced",
                confidence=0.92,
                evidence="Detected advanced Excel keywords (XLOOKUP / Pivot Tables / Data Modeling).",
            ))
        else:
            extracted_skills.append(ExtractedSkill(
                name="Microsoft Excel",
                subskill="excel_formulas",
                category="Spreadsheets",
                proficiency="Intermediate",
                confidence=0.75,
                evidence="Mentioned spreadsheet usage and standard formulas.",
            ))

    if any(k in text_lower for k in ["python", "pandas", "numpy", "matplotlib", "seaborn"]):
        extracted_skills.append(ExtractedSkill(
            name="Python for Data Analysis",
            subskill="python_pandas",
            category="Programming",
            proficiency="Intermediate",
            confidence=0.70,
            evidence="Detected Python scripting with Pandas / data exploration libraries.",
        ))

    if any(k in text_lower for k in ["statistics", "regression", "probability", "hypothesis test", "a/b test"]):
        extracted_skills.append(ExtractedSkill(
            name="Applied Statistics",
            subskill="stats_descriptive",
            category="Analytics",
            proficiency="Intermediate",
            confidence=0.65,
            evidence="Mentioned statistical coursework or exploratory metric analysis.",
        ))

    if "sql" in text_lower or "database" in text_lower or "postgres" in text_lower or "mysql" in text_lower:
        if any(k in text_lower for k in ["window function", "cte", "rank over", "lag", "lead", "query optimization"]):
            extracted_skills.append(ExtractedSkill(
                name="SQL & Relational Databases",
                subskill="window_functions",
                category="Databases",
                proficiency="Advanced",
                confidence=0.85,
                evidence="Demonstrated advanced SQL queries (CTEs, Window Functions).",
            ))
        elif any(k in text_lower for k in ["join", "inner join", "left join", "foreign key", "relational"]):
            extracted_skills.append(ExtractedSkill(
                name="SQL & Relational Databases",
                subskill="multi_table_joins",
                category="Databases",
                proficiency="Intermediate",
                confidence=0.60,
                evidence="Mentioned multi-table relational joins in databases.",
            ))
        elif any(k in text_lower for k in ["group by", "sum(", "avg(", "count(", "aggregation"]):
            extracted_skills.append(ExtractedSkill(
                name="SQL & Relational Databases",
                subskill="aggregations_group_by",
                category="Databases",
                proficiency="Intermediate",
                confidence=0.62,
                evidence="Demonstrated aggregate functions and grouping in SQL.",
            ))
        else:
            extracted_skills.append(ExtractedSkill(
                name="SQL & Relational Databases",
                subskill="basic_queries",
                category="Databases",
                proficiency="Novice",
                confidence=0.30,
                evidence="Brief introductory mention of SQL (SELECT / WHERE) with limited practical depth.",
            ))
    else:
        extracted_skills.append(ExtractedSkill(
            name="SQL & Relational Databases",
            subskill="basic_queries",
            category="Databases",
            proficiency="None",
            confidence=0.05,
            evidence="No explicit SQL or relational database experience identified in resume.",
        ))

    if any(k in text_lower for k in ["power bi", "powerbi", "tableau", "dax", "dashboard"]):
        extracted_skills.append(ExtractedSkill(
            name="Business Intelligence & Dashboards",
            subskill="powerbi_modeling",
            category="BI Tools",
            proficiency="Intermediate",
            confidence=0.60,
            evidence="Experience building BI dashboards and visual metrics.",
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

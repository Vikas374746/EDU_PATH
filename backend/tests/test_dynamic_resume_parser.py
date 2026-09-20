import os
import pytest
from modules.resume_analyzer import extract_text_from_pdf, analyze_raw_text
from modules.skill_gap_engine import compute_skill_gaps

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
PDF_PATH = os.path.join(DATA_DIR, "uploads", "Data_Science_and_Analytics_1.pdf")


def test_dynamic_pdf_parsing_and_subskill_statuses():
    assert os.path.exists(PDF_PATH), f"Uploaded test PDF does not exist at {PDF_PATH}"
    text = extract_text_from_pdf(PDF_PATH)
    assert len(text) > 500

    profile = analyze_raw_text(text, name="Columbia Candidate", target_role="Data Analyst")
    gaps = compute_skill_gaps(profile)

    gap_dict = {g.subskill_id: g.status for g in gaps.gaps}

    # Verify extraction schema requirements:
    # sql_basics -> Developing (candidate has SQL (Beginner))
    assert gap_dict.get("basic_queries") == "Developing" or gap_dict.get("sql_basics") == "Developing"

    # sql_joins -> Weak (candidate lacks relational JOINs)
    assert gap_dict.get("multi_table_joins") == "Weak" or gap_dict.get("sql_joins") == "Weak"

    # sql_advanced -> Missing (candidate has no CTEs or window functions)
    assert gap_dict.get("window_functions") == "Missing" or gap_dict.get("sql_advanced") == "Missing"

    # excel -> Developing (Excel (Intermediate))
    assert gap_dict.get("excel_lookups") == "Developing" or gap_dict.get("excel") == "Developing"

    # python_r_pandas -> Strong (R (Advanced), Tidyverse, Data Wrangling, Python)
    assert gap_dict.get("python_pandas") == "Strong" or gap_dict.get("python_r_pandas") == "Strong"

    # bi_dashboards -> Developing (Tableau (Intermediate), Data Visualization)
    assert (
        gap_dict.get("powerbi_modeling") == "Developing"
        or gap_dict.get("powerbi_dashboards") == "Developing"
        or gap_dict.get("bi_dashboards") == "Developing"
    )

    # Verify exact summary counts on the 6 core taxonomy skills:
    assert gaps.strong_count == 1
    assert gaps.developing_count == 3
    assert gaps.weak_count == 1
    assert gaps.missing_count == 1

    # Verify Automatic Bottleneck Isolation:
    assert gaps.primary_bottleneck == "Relational Multi-Table JOINs"
    expected_summary = (
        "Candidate shows strong foundational data wrangling in R/Excel and basic SQL awareness, "
        "but lacks multi-table relational JOIN logic. The baseline sprint will prioritize SQL JOIN mastery."
    )
    assert gaps.ai_diagnostic_summary == expected_summary

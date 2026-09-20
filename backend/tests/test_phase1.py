import os
import json
import pytest
from fastapi.testclient import TestClient
import main
from main import app
from config import settings
from modules.skill_gap_engine import load_ontology

client = TestClient(app)

def test_config_loaded():
    assert settings.PROJECT_NAME == "SkillForge API"
    assert settings.PORT == 8000
    assert os.path.exists(settings.DATA_DIR)

def test_ontology_structure():
    ontology = load_ontology()
    assert ontology.get("role") == "Data Analyst"
    domains = ontology.get("domains", [])
    assert len(domains) == 5
    
    domain_ids = [d["id"] for d in domains]
    assert "sql" in domain_ids
    assert "excel" in domain_ids
    assert "python" in domain_ids
    assert "bi_tools" in domain_ids
    assert "statistics" in domain_ids
    
    # Check SQL subskills and prerequisites
    sql_domain = next(d for d in domains if d["id"] == "sql")
    subskill_ids = [s["id"] for s in sql_domain["subskills"]]
    assert "basic_queries" in subskill_ids
    assert "aggregations_group_by" in subskill_ids
    assert "multi_table_joins" in subskill_ids
    assert "window_functions" in subskill_ids
    
    # Verify JOINs prerequisite
    sql_joins = next(s for s in sql_domain["subskills"] if s["id"] == "multi_table_joins")
    assert "basic_queries" in sql_joins["prerequisites"]
    assert "aggregations_group_by" in sql_joins["prerequisites"]

def test_curated_resources_dataset():
    path = os.path.join(settings.DATA_DIR, "curated_resources.json")
    assert os.path.exists(path)
    with open(path, "r", encoding="utf-8") as f:
        resources = json.load(f)
    
    assert "sql_joins" in resources
    assert len(resources["sql_joins"]) >= 2
    for r in resources["sql_joins"]:
        assert "id" in r
        assert "title" in r
        assert "url" in r
        assert "duration_minutes" in r
        assert "reason_selected" in r

def test_api_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "SkillForge" in data["service"]

def test_api_ontology_endpoint():
    response = client.get("/api/ontology")
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "Data Analyst"
    assert len(data["domains"]) == 5

def test_api_resources_endpoint():
    response = client.get("/api/resources?subskill=sql_joins")
    assert response.status_code == 200
    data = response.json()
    assert data["subskill"] == "sql_joins"
    assert len(data["resources"]) >= 2


def test_dynamic_roadmap_uses_hours_and_gap_priority():
    response = client.post("/api/roadmap/generate", json={"hours_per_week": 5})
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data["weekly_plan"], list)
    assert len(data["weekly_plan"]) == 6
    week_subskills = [week["focus_subskill"] for week in data["weekly_plan"]]
    assert week_subskills[0] == "multi_table_joins"
    assert "multi_table_joins" in week_subskills
    assert week_subskills.index("multi_table_joins") < week_subskills.index("window_functions")


def test_roadmap_does_not_mark_new_user_as_completed_without_evidence():
    profile = main.get_demo_profile()
    gaps = main.compute_skill_gaps(profile)
    data = main.generate_roadmap_compact(gaps=gaps, user_id="candidate-001", hours_per_week=10)
    statuses = [week["status"] for week in data["weekly_plan"]]
    assert "completed" not in statuses
    assert any(status in {"in_progress", "upcoming"} for status in statuses)


def test_resume_gap_parser_normalizes_model_schema(monkeypatch):
    def fake_generate(prompt: str):
        return json.dumps({
            "diagnostic_summary": "Strong SQL fundamentals but weak dashboarding.",
            "primary_bottleneck": "Multi-Table JOINs",
            "subskill_matrix": [
                {"id": "sql_basics", "status": "Strong"},
                {"id": "sql_joins", "status": "Weak"},
                {"id": "window_functions", "status": "Developing"},
                {"id": "lookups_pivot_tables", "status": "Missing"},
                {"id": "python_data_wrangling", "status": "Strong"},
                {"id": "data_modeling_dashboards", "status": "Weak"},
            ],
        })

    monkeypatch.setattr(main, "_generate_gemini_text", fake_generate)
    result = main._parse_resume_gap_analysis(fake_generate("test prompt"))
    assert result["diagnostic_summary"] == "Strong SQL fundamentals but weak dashboarding."
    assert result["primary_bottleneck"] == "Multi-Table JOINs"
    assert [item["id"] for item in result["subskill_matrix"]] == [
        "sql_basics",
        "sql_joins",
        "window_functions",
        "lookups_pivot_tables",
        "python_data_wrangling",
        "data_modeling_dashboards",
    ]
    assert result["subskill_matrix"][1]["status"] == "Weak"

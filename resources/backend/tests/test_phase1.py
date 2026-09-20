import os
import json
import pytest
from fastapi.testclient import TestClient
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
    assert "sql_basics" in subskill_ids
    assert "sql_aggregations" in subskill_ids
    assert "sql_joins" in subskill_ids
    assert "sql_window_functions" in subskill_ids
    
    # Verify JOINs prerequisite
    sql_joins = next(s for s in sql_domain["subskills"] if s["id"] == "sql_joins")
    assert "sql_basics" in sql_joins["prerequisites"]
    assert "sql_aggregations" in sql_joins["prerequisites"]

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

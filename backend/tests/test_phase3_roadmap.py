from fastapi.testclient import TestClient
import pytest
from main import app

client = TestClient(app)

def test_roadmap_prerequisite_ordering_10_hours():
    """The roadmap must reflect the learner's highest-priority current gaps."""
    client.post("/api/profile/demo")
    response = client.post("/api/roadmap/generate", json={"hours_per_week": 10})
    assert response.status_code == 200
    data = response.json()
    assert data["sprint_title"] == "4-Week Standard Sprint"
    assert len(data["weekly_plan"]) == 4

    first_focus = data["weekly_plan"][0]["focus_subskill"]
    assert first_focus == "multi_table_joins"
    assert "Relational Multi-Table JOINs" in data["weekly_plan"][0]["title"]

    w2 = data["weekly_plan"][1]
    assert w2["focus_subskill"] in {"aggregations_group_by", "powerbi_modeling", "window_functions"}

    w3 = data["weekly_plan"][2]
    assert w3["focus_subskill"] in {"aggregations_group_by", "powerbi_modeling", "window_functions"}

    w4 = data["weekly_plan"][3]
    assert w4["focus_subskill"] in {"powerbi_modeling", "window_functions"}


def test_roadmap_fast_track_20_hours():
    """The 20-hour sprint must still compress the current highest-priority gaps into two weeks."""
    client.post("/api/profile/demo")
    response = client.post("/api/roadmap/generate", json={"hours_per_week": 20})
    assert response.status_code == 200
    data = response.json()
    assert data["sprint_title"] == "2-Week Fast-Track Sprint"
    assert len(data["weekly_plan"]) == 2

    w1 = data["weekly_plan"][0]
    assert w1["focus_subskill"] == "multi_table_joins"

    w2 = data["weekly_plan"][1]
    assert w2["focus_subskill"] in {"aggregations_group_by", "powerbi_modeling", "window_functions"}


def test_roadmap_extended_5_hours():
    """The 5-hour sprint keeps the same gap-driven sequence but stretches it into six weeks."""
    client.post("/api/profile/demo")
    response = client.post("/api/roadmap/generate", json={"hours_per_week": 5})
    assert response.status_code == 200
    data = response.json()
    assert data["sprint_title"] == "6-Week Extended Sprint"
    assert len(data["weekly_plan"]) == 6

    assert data["weekly_plan"][0]["focus_subskill"] == "multi_table_joins"
    assert data["weekly_plan"][1]["focus_subskill"] in {"aggregations_group_by", "powerbi_modeling", "window_functions", "excel_lookups", "python_pandas"}
    assert data["weekly_plan"][2]["focus_subskill"] in {"aggregations_group_by", "powerbi_modeling", "window_functions", "excel_lookups", "python_pandas"}
    assert data["weekly_plan"][3]["focus_subskill"] in {"aggregations_group_by", "powerbi_modeling", "window_functions", "excel_lookups", "python_pandas"}
    assert data["weekly_plan"][4]["focus_subskill"] in {"aggregations_group_by", "powerbi_modeling", "window_functions", "excel_lookups", "python_pandas"}
    assert data["weekly_plan"][5]["focus_subskill"] in {"aggregations_group_by", "powerbi_modeling", "window_functions", "excel_lookups", "python_pandas"}


def test_roadmap_is_ordered_by_current_gap_priority():
    """The roadmap must reflect the most urgent current skill gaps, not a fixed generic sequence."""
    session = client.post("/api/profile/analyze-gap", json={
        "resume_text": "Built dashboards with Excel and Python, but no multi-table SQL joins or window functions."
    })
    assert session.status_code == 200

    response = client.post("/api/roadmap/generate", json={"hours_per_week": 10})
    assert response.status_code == 200
    data = response.json()

    first_focus = data["weekly_plan"][0]["focus_subskill"]
    assert first_focus in {"multi_table_joins", "window_functions"}
    assert "multi_table_joins" in [item["focus_subskill"] for item in data["weekly_plan"]]

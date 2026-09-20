from modules.skill_gap_engine import load_ontology


def test_sql_domain_has_unique_skill_cards_and_canonical_ids():
    ontology = load_ontology()
    sql_domain = next(domain for domain in ontology["domains"] if domain["id"] == "sql")

    expected_names = [
        "Basic Queries & Filtering",
        "Aggregations & GROUP BY",
        "Multi-Table JOINs",
        "Window Functions & CTEs",
    ]

    actual_names = [subskill["name"] for subskill in sql_domain["subskills"]]

    assert actual_names == expected_names
    assert len(actual_names) == len(set(actual_names))
    assert {subskill["id"] for subskill in sql_domain["subskills"]} == {
        "basic_queries",
        "aggregations_group_by",
        "multi_table_joins",
        "window_functions",
    }

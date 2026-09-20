from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_skill_proof_route_returns_join_challenge():
    response = client.get('/api/skill-proof/multi_table_joins')
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['subskill'] == 'multi_table_joins'
    assert 'LEFT JOIN' in body['challenge']['prompt']
    assert 'users' in body['challenge']['prompt']
    assert 'orders' in body['challenge']['prompt']


def test_diagnose_route_marks_weak_when_join_is_missing():
    response = client.post(
        '/api/evaluation/diagnose',
        json={
            'user_id': 'learner-001',
            'challenge_id': 'challenge_sql_join_01',
            'query_text': 'SELECT name FROM users;'  # deliberately missing LEFT JOIN
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['overall_score'] == 40
    assert body['diagnostics'][0]['subskill_id'] == 'multi_table_joins'
    assert body['diagnostics'][0]['status'] == 'Weak'
    assert body['requires_replanning'] is True


def test_replan_route_mutates_roadmap_after_weak_join_evidence():
    diagnose = client.post(
        '/api/evaluation/diagnose',
        json={
            'user_id': 'learner-001',
            'challenge_id': 'challenge_sql_join_01',
            'query_text': 'SELECT * FROM users;'  # still weak
        },
    )
    assert diagnose.status_code == 200, diagnose.text

    response = client.post('/api/roadmap/replan', json={'user_id': 'learner-001'})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['mutation']['trigger_subskill'] == 'multi_table_joins'
    assert body['roadmap']['has_mutation'] is True
    assert any('Remediation' in week['title'] for week in body['roadmap']['weekly_plan'])

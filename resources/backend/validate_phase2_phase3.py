from fastapi.testclient import TestClient

from main import app
from modules.skill_gap_engine import load_ontology

ontology = load_ontology()
sql_ids = [s['id'] for s in next(d for d in ontology['domains'] if d['id'] == 'sql')['subskills']]
assert 'basic_queries' in sql_ids
assert 'aggregations_group_by' in sql_ids
assert 'multi_table_joins' in sql_ids
assert 'window_functions' in sql_ids

client = TestClient(app)
profile_resp = client.post(
    '/api/profile/analyze-gap',
    json={
        'resume_text': 'SQL, JOINs, GROUP BY, window functions, Excel, Power BI, Python pandas',
        'target_role': 'Data Analyst',
    },
)
assert profile_resp.status_code == 200, profile_resp.text
profile_body = profile_resp.json()
assert 'gaps' in profile_body and 'gaps' in profile_body['gaps']
assert len(profile_body['gaps']['gaps']) >= 4
assert any(g['subskill_id'] == 'multi_table_joins' for g in profile_body['gaps']['gaps'])

roadmap_resp = client.post('/api/roadmap/generate', json={'target_role': 'Data Analyst'})
assert roadmap_resp.status_code == 200, roadmap_resp.text
roadmap_body = roadmap_resp.json()
assert 'weekly_plan' in roadmap_body and len(roadmap_body['weekly_plan']) >= 2
assert roadmap_body['weekly_plan'][0]['week'] == 1

print('taxonomy_ok', sql_ids)
print('gap_statuses', sorted({g['status'] for g in profile_body['gaps']['gaps']}))
print('first_week', roadmap_body['weekly_plan'][0]['title'])

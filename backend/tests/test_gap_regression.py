from modules.resume_analyzer import get_demo_profile
from modules.skill_gap_engine import compute_skill_gaps


def test_demo_profile_gap_summary_matches_extracted_domain_strengths():
    profile = get_demo_profile()
    gaps = compute_skill_gaps(profile)

    by_name = {item.name: item.status for item in gaps.gaps}

    assert by_name.get('Lookups & Pivot Tables') == 'Strong'
    assert by_name.get('Data Wrangling with Pandas') == 'Developing'
    assert by_name.get('Descriptive Statistics & Distributions') == 'Developing'
    assert by_name.get('Multi-Table JOINs') == 'Weak'
    assert by_name.get('Window Functions & CTEs') == 'Missing'
    assert gaps.strong_count >= 1
    assert gaps.developing_count >= 2
    assert gaps.weak_count >= 1
    assert gaps.missing_count >= 1

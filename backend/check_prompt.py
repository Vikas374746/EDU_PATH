import main

prompt = main._build_resume_gap_prompt('SQL, Python, Excel, BI, dashboarding, queries, joins, pandas.', 'Learner', 'Data Analyst')
raw = main._generate_gemini_text(prompt)
print('RAW_START')
print(raw if raw else 'NONE')
print('RAW_END')
print('PARSED', main._parse_resume_gap_analysis(raw))

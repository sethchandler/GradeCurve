
import zipfile
import os

files = [
    'grade_assignment_scenario_1.csv', 
    'grade_assignment_scenario_2.csv', 
    'grade_assignment_scenario_3.csv', 
    'config.json'
]
artifact_files = [
    '/home/seth/.gemini/antigravity/brain/e4481331-0a9a-41af-b92e-e8936e134bee/compliance_report.md', 
    '/home/seth/.gemini/antigravity/brain/e4481331-0a9a-41af-b92e-e8936e134bee/walkthrough.md'
]

with zipfile.ZipFile('grade_curving_package.zip', 'w') as zipf:
    for f in files:
        if os.path.exists(f):
            zipf.write(f)
        else:
            print(f"Warning: {f} not found.")
    for f in artifact_files:
        if os.path.exists(f):
            zipf.write(f, arcname=f.split('/')[-1])
        else:
            print(f"Warning: {f} not found.")

print("Created grade_curving_package.zip")

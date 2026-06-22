import os
import subprocess
import sys

test_dir = "testsprite_tests"
files = sorted([f for f in os.listdir(test_dir) if f.startswith("TC") and f.endswith(".py")])

passed = 0
failed = 0

for file in files:
    print(f"Running {file}...")
    result = subprocess.run([sys.executable, os.path.join(test_dir, file)], capture_output=True, text=True)
    if result.returncode == 0:
        print(f"[PASS] {file}")
        passed += 1
    else:
        print(f"[FAIL] {file}")
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        failed += 1
        
print(f"\nSummary: {passed} passed, {failed} failed.")
if failed > 0:
    sys.exit(1)

import subprocess
try:
    subprocess.run(["git", "add", "."], check=True, text=True)
    subprocess.run(["git", "commit", "-m", "update notifications component"], check=False, text=True)
    res = subprocess.run(["git", "push"], check=True, capture_output=True, text=True)
    print("SUCCESS: \n" + res.stdout + "\n" + res.stderr)
except Exception as e:
    print("FAILED: " + str(e))

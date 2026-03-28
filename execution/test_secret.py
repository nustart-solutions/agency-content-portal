import modal
import os

app = modal.App("test-google-secret")

@app.function(
    secrets=[modal.Secret.from_name("googlecloud-secret")]
)
def check_secret():
    keys = list(os.environ.keys())
    relevant_keys = [k for k in keys if "service" in k.lower() or "google" in k.lower()]
    print("--------------------------------------------------")
    print("Relevant Environment Keys Found in 'googlecloud-secret':")
    print(relevant_keys)
    print("--------------------------------------------------")
    
    for key in relevant_keys:
        val = os.environ[key]
        print(f"Key: {key} -> Length of value: {len(val)} characters")

@app.local_entrypoint()
def run():
    check_secret.remote()

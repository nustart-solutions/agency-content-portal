import requests
import json

url = "https://anne-72185--content-portal-execution-generate-asset.modal.run"

print(f"Pinging Modal Webhook: {url}")
try:
    # Send a dummy payload. The new code in modal_pipeline.py will print errors safely.
    resp = requests.post(url, json={"asset_id": "test-id-to-force-error"}, timeout=30)
    print(f"Status Code: {resp.status_code}")
    print("Response Body:")
    print(json.dumps(resp.json(), indent=2))
except Exception as e:
    print(f"Request failed: {e}")

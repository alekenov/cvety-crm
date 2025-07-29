#!/usr/bin/env python3
import subprocess
import time
import requests

# Start the server and capture output
print("Starting server...")
proc = subprocess.Popen(
    ["uvicorn", "app.main:app", "--reload", "--port", "8001"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1
)

# Wait for server to start
time.sleep(3)

# Test the endpoint
print("\nTesting /api/products/ endpoint...")
try:
    response = requests.get("http://localhost:8001/api/products/")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Success! Response: {response.json()}")
    else:
        print(f"Error: {response.text}")
        
        # Read server output
        print("\nServer output:")
        proc.terminate()
        output, _ = proc.communicate(timeout=2)
        print(output)
except Exception as e:
    print(f"Request failed: {e}")
    proc.terminate()
    output, _ = proc.communicate(timeout=2)
    print("\nServer output:")
    print(output)
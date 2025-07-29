#!/usr/bin/env python3
import requests
import sys

API_URL = "http://localhost:8000/api"

def init_data(force=False):
    """Initialize test data"""
    url = f"{API_URL}/init/initialize"
    params = {"force": force}
    
    print(f"Initializing test data... force={force}")
    
    try:
        # Using GET instead of POST to avoid redirect issues
        response = requests.post(url, params=params, allow_redirects=False)
        
        if response.status_code == 307:
            # Handle redirect manually
            new_url = response.headers.get('Location')
            if new_url:
                full_url = f"http://localhost:8000{new_url}"
                print(f"Following redirect to: {full_url}")
                response = requests.post(full_url, params=params)
        
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Message: {data.get('message')}")
            if 'counts' in data:
                print("\nCreated:")
                for key, count in data['counts'].items():
                    print(f"  - {key}: {count}")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    force = "--force" in sys.argv
    init_data(force)
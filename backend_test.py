#!/usr/bin/env python3
"""
Backend API Testing for NotePilot
Tests all FastAPI endpoints with comprehensive validation
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("❌ Could not get backend URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BASE_URL}/api"
print(f"🔗 Testing backend at: {API_BASE}")

def test_root_endpoint():
    """Test GET /api/ endpoint"""
    print("\n🧪 Testing GET /api/ (Root endpoint)")
    try:
        response = requests.get(f"{API_BASE}/")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("   ✅ Root endpoint working correctly")
                return True
            else:
                print(f"   ❌ Unexpected response: {data}")
                return False
        else:
            print(f"   ❌ Failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_post_status_endpoint():
    """Test POST /api/status endpoint"""
    print("\n🧪 Testing POST /api/status (Create status check)")
    
    # Test with valid data
    test_data = {"client_name": "NotePilot_Test_Client"}
    
    try:
        response = requests.post(
            f"{API_BASE}/status",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Validate response structure
            required_fields = ["id", "client_name", "timestamp"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"   ❌ Missing fields: {missing_fields}")
                return False
            
            # Validate field values
            if data["client_name"] != test_data["client_name"]:
                print(f"   ❌ Client name mismatch: expected {test_data['client_name']}, got {data['client_name']}")
                return False
            
            # Validate UUID format
            try:
                uuid.UUID(data["id"])
            except ValueError:
                print(f"   ❌ Invalid UUID format: {data['id']}")
                return False
            
            # Validate timestamp format
            try:
                datetime.fromisoformat(data["timestamp"].replace('Z', '+00:00'))
            except ValueError:
                print(f"   ❌ Invalid timestamp format: {data['timestamp']}")
                return False
            
            print("   ✅ POST /api/status working correctly")
            return True
        else:
            print(f"   ❌ Failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_post_status_error_handling():
    """Test POST /api/status error handling"""
    print("\n🧪 Testing POST /api/status error handling")
    
    # Test with missing client_name
    try:
        response = requests.post(
            f"{API_BASE}/status",
            json={},
            headers={"Content-Type": "application/json"}
        )
        print(f"   Empty payload - Status Code: {response.status_code}")
        
        if response.status_code == 422:  # FastAPI validation error
            print("   ✅ Correctly handles missing client_name")
        else:
            print(f"   ⚠️  Unexpected status code for invalid input: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error testing error handling: {e}")
        return False
    
    # Test with invalid JSON
    try:
        response = requests.post(
            f"{API_BASE}/status",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        print(f"   Invalid JSON - Status Code: {response.status_code}")
        
        if response.status_code in [400, 422]:
            print("   ✅ Correctly handles invalid JSON")
        else:
            print(f"   ⚠️  Unexpected status code for invalid JSON: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error testing invalid JSON: {e}")
        return False
    
    return True

def test_get_status_endpoint():
    """Test GET /api/status endpoint"""
    print("\n🧪 Testing GET /api/status (Get all status checks)")
    
    try:
        response = requests.get(f"{API_BASE}/status")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list):
                print(f"   ✅ Returns array with {len(data)} items")
                
                # If there are items, validate structure
                if data:
                    first_item = data[0]
                    required_fields = ["id", "client_name", "timestamp"]
                    missing_fields = [field for field in required_fields if field not in first_item]
                    
                    if missing_fields:
                        print(f"   ❌ Items missing fields: {missing_fields}")
                        return False
                    else:
                        print("   ✅ Items have correct structure")
                
                return True
            else:
                print(f"   ❌ Expected array, got: {type(data)}")
                return False
        else:
            print(f"   ❌ Failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_data_persistence():
    """Test that data persists between POST and GET operations"""
    print("\n🧪 Testing data persistence (POST then GET)")
    
    # Create a unique client name for this test
    unique_client = f"PersistenceTest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # First, POST a new status check
    post_data = {"client_name": unique_client}
    try:
        post_response = requests.post(
            f"{API_BASE}/status",
            json=post_data,
            headers={"Content-Type": "application/json"}
        )
        
        if post_response.status_code != 200:
            print(f"   ❌ POST failed: {post_response.status_code}")
            return False
        
        posted_data = post_response.json()
        posted_id = posted_data["id"]
        print(f"   ✅ Posted status check with ID: {posted_id}")
        
        # Then, GET all status checks and verify our data is there
        get_response = requests.get(f"{API_BASE}/status")
        
        if get_response.status_code != 200:
            print(f"   ❌ GET failed: {get_response.status_code}")
            return False
        
        all_status_checks = get_response.json()
        
        # Find our posted item
        found_item = None
        for item in all_status_checks:
            if item["id"] == posted_id:
                found_item = item
                break
        
        if found_item:
            if found_item["client_name"] == unique_client:
                print("   ✅ Data persisted correctly in MongoDB")
                return True
            else:
                print(f"   ❌ Data corrupted: expected {unique_client}, got {found_item['client_name']}")
                return False
        else:
            print(f"   ❌ Posted item not found in GET response")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing persistence: {e}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting NotePilot Backend API Tests")
    print("=" * 50)
    
    tests = [
        ("Root Endpoint", test_root_endpoint),
        ("POST Status Endpoint", test_post_status_endpoint),
        ("POST Status Error Handling", test_post_status_error_handling),
        ("GET Status Endpoint", test_get_status_endpoint),
        ("Data Persistence", test_data_persistence)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"   ❌ Test {test_name} crashed: {e}")
            results[test_name] = False
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(tests)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests PASSED!")
        return True
    else:
        print("⚠️  Some backend tests FAILED!")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
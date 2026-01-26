#!/usr/bin/env python3
"""
Backend API Testing for NotePilot
Tests all FastAPI endpoints with comprehensive validation
"""

import requests
import json
import sys
from datetime import datetime, timezone, timedelta
import uuid
import subprocess
import time

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

# ============ OAUTH TESTING FUNCTIONS ============

def create_test_user_and_session():
    """Create test user and session in MongoDB using mongosh"""
    print("   📝 Creating test user and session in MongoDB...")
    
    timestamp = int(time.time() * 1000)
    user_id = f"test-user-{timestamp}"
    session_token = f"test_session_{timestamp}"
    email = f"test.user.{timestamp}@example.com"
    
    # MongoDB command to create test data
    mongo_cmd = f"""
    use('test_database');
    var userId = '{user_id}';
    var sessionToken = '{session_token}';
    var email = '{email}';
    db.users.insertOne({{
      user_id: userId,
      email: email,
      name: 'Test User OAuth',
      picture: 'https://via.placeholder.com/150',
      created_at: new Date()
    }});
    db.user_sessions.insertOne({{
      user_id: userId,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + 7*24*60*60*1000),
      created_at: new Date()
    }});
    print('SUCCESS: Created user and session');
    """
    
    try:
        result = subprocess.run(
            ['mongosh', '--eval', mongo_cmd],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0 and 'SUCCESS' in result.stdout:
            print(f"   ✅ Created test user: {user_id}")
            print(f"   ✅ Created session token: {session_token}")
            return user_id, session_token, email
        else:
            print(f"   ❌ MongoDB command failed: {result.stderr}")
            return None, None, None
            
    except Exception as e:
        print(f"   ❌ Error creating test data: {e}")
        return None, None, None

def cleanup_test_data():
    """Clean up test data from MongoDB"""
    print("   🧹 Cleaning up test data...")
    
    mongo_cmd = """
    use('test_database');
    db.users.deleteMany({email: /test\\.user\\./});
    db.user_sessions.deleteMany({session_token: /test_session/});
    print('CLEANUP: Test data removed');
    """
    
    try:
        result = subprocess.run(
            ['mongosh', '--eval', mongo_cmd],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("   ✅ Test data cleaned up")
        else:
            print(f"   ⚠️  Cleanup warning: {result.stderr}")
            
    except Exception as e:
        print(f"   ⚠️  Cleanup error: {e}")

def test_oauth_session_exchange():
    """Test POST /api/auth/session endpoint"""
    print("\n🧪 Testing POST /api/auth/session (Session Exchange)")
    
    # This endpoint requires a valid session_id from Emergent Auth
    # Since we can't get a real session_id in testing, we test the endpoint structure
    # and error handling
    
    test_data = {"session_id": "invalid_test_session_id"}
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/session",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        # We expect this to fail with 401 since we're using an invalid session_id
        # This is the expected behavior for testing
        if response.status_code == 401:
            try:
                error_data = response.json()
                if "detail" in error_data:
                    print("   ✅ Session exchange endpoint structure correct")
                    print("   ✅ Properly handles invalid session_id (expected behavior)")
                    return True
                else:
                    print("   ❌ Error response missing 'detail' field")
                    return False
            except:
                print("   ❌ Error response not valid JSON")
                return False
        elif response.status_code == 504:
            print("   ✅ Auth service timeout handled correctly")
            return True
        else:
            print(f"   ❌ Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_oauth_auth_me():
    """Test GET /api/auth/me endpoint"""
    print("\n🧪 Testing GET /api/auth/me (Auth Verification)")
    
    # Create test user and session
    user_id, session_token, email = create_test_user_and_session()
    
    if not session_token:
        print("   ❌ Failed to create test data")
        return False
    
    try:
        # Test 1: Authorization header method
        print("   🔍 Testing Authorization header method...")
        response = requests.get(
            f"{API_BASE}/auth/me",
            headers={"Authorization": f"Bearer {session_token}"},
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Validate response structure
            required_fields = ["user_id", "email", "name", "created_at"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"   ❌ Missing fields in response: {missing_fields}")
                cleanup_test_data()
                return False
            
            # Validate field values
            if data["user_id"] != user_id:
                print(f"   ❌ User ID mismatch: expected {user_id}, got {data['user_id']}")
                cleanup_test_data()
                return False
            
            if data["email"] != email:
                print(f"   ❌ Email mismatch: expected {email}, got {data['email']}")
                cleanup_test_data()
                return False
            
            print("   ✅ Authorization header authentication working")
            
            # Test 2: Cookie method
            print("   🔍 Testing cookie method...")
            cookie_response = requests.get(
                f"{API_BASE}/auth/me",
                cookies={"session_token": session_token},
                timeout=10
            )
            
            if cookie_response.status_code == 200:
                cookie_data = cookie_response.json()
                if cookie_data["user_id"] == user_id:
                    print("   ✅ Cookie authentication working")
                    cleanup_test_data()
                    return True
                else:
                    print("   ❌ Cookie auth returned wrong user")
                    cleanup_test_data()
                    return False
            else:
                print(f"   ❌ Cookie auth failed: {cookie_response.status_code}")
                cleanup_test_data()
                return False
                
        else:
            print(f"   ❌ Auth verification failed: {response.status_code}")
            cleanup_test_data()
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        cleanup_test_data()
        return False

def test_oauth_logout():
    """Test POST /api/auth/logout endpoint"""
    print("\n🧪 Testing POST /api/auth/logout (Logout)")
    
    # Create test user and session
    user_id, session_token, email = create_test_user_and_session()
    
    if not session_token:
        print("   ❌ Failed to create test data")
        return False
    
    try:
        # First verify the session exists
        auth_response = requests.get(
            f"{API_BASE}/auth/me",
            headers={"Authorization": f"Bearer {session_token}"},
            timeout=10
        )
        
        if auth_response.status_code != 200:
            print("   ❌ Test session not working before logout test")
            cleanup_test_data()
            return False
        
        print("   ✅ Test session verified before logout")
        
        # Test logout
        logout_response = requests.post(
            f"{API_BASE}/auth/logout",
            headers={"Authorization": f"Bearer {session_token}"},
            timeout=10
        )
        
        print(f"   Logout Status Code: {logout_response.status_code}")
        print(f"   Logout Response: {logout_response.text}")
        
        if logout_response.status_code == 200:
            logout_data = logout_response.json()
            
            if "message" in logout_data and "Logged out" in logout_data["message"]:
                print("   ✅ Logout endpoint returns correct message")
                
                # Verify session is deleted - should get 401 now
                verify_response = requests.get(
                    f"{API_BASE}/auth/me",
                    headers={"Authorization": f"Bearer {session_token}"},
                    timeout=10
                )
                
                if verify_response.status_code == 401:
                    print("   ✅ Session properly deleted from database")
                    cleanup_test_data()
                    return True
                else:
                    print(f"   ❌ Session still valid after logout: {verify_response.status_code}")
                    cleanup_test_data()
                    return False
            else:
                print(f"   ❌ Unexpected logout response: {logout_data}")
                cleanup_test_data()
                return False
        else:
            print(f"   ❌ Logout failed: {logout_response.status_code}")
            cleanup_test_data()
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        cleanup_test_data()
        return False

def test_oauth_error_scenarios():
    """Test OAuth error handling scenarios"""
    print("\n🧪 Testing OAuth Error Scenarios")
    
    try:
        # Test 1: No authentication
        print("   🔍 Testing no authentication...")
        no_auth_response = requests.get(f"{API_BASE}/auth/me", timeout=10)
        
        if no_auth_response.status_code == 401:
            print("   ✅ Correctly returns 401 for no authentication")
        else:
            print(f"   ❌ Expected 401, got {no_auth_response.status_code}")
            return False
        
        # Test 2: Invalid session token
        print("   🔍 Testing invalid session token...")
        invalid_response = requests.get(
            f"{API_BASE}/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"},
            timeout=10
        )
        
        if invalid_response.status_code == 401:
            print("   ✅ Correctly returns 401 for invalid token")
        else:
            print(f"   ❌ Expected 401 for invalid token, got {invalid_response.status_code}")
            return False
        
        # Test 3: Expired session (create and immediately expire)
        print("   🔍 Testing expired session...")
        
        timestamp = int(time.time() * 1000)
        expired_user_id = f"expired-user-{timestamp}"
        expired_session_token = f"expired_session_{timestamp}"
        
        # Create session that's already expired
        mongo_cmd = f"""
        use('test_database');
        var userId = '{expired_user_id}';
        var sessionToken = '{expired_session_token}';
        db.users.insertOne({{
          user_id: userId,
          email: 'expired.{timestamp}@example.com',
          name: 'Expired User',
          created_at: new Date()
        }});
        db.user_sessions.insertOne({{
          user_id: userId,
          session_token: sessionToken,
          expires_at: new Date(Date.now() - 1000),  // Expired 1 second ago
          created_at: new Date()
        }});
        """
        
        subprocess.run(['mongosh', '--eval', mongo_cmd], capture_output=True, timeout=30)
        
        expired_response = requests.get(
            f"{API_BASE}/auth/me",
            headers={"Authorization": f"Bearer {expired_session_token}"},
            timeout=10
        )
        
        if expired_response.status_code == 401:
            print("   ✅ Correctly handles expired session")
            cleanup_test_data()  # This will clean up the expired session too
            return True
        else:
            print(f"   ❌ Expected 401 for expired session, got {expired_response.status_code}")
            cleanup_test_data()
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing error scenarios: {e}")
        cleanup_test_data()
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
        ("Data Persistence", test_data_persistence),
        ("OAuth - Session Exchange", test_oauth_session_exchange),
        ("OAuth - Auth Me Endpoint", test_oauth_auth_me),
        ("OAuth - Logout Endpoint", test_oauth_logout),
        ("OAuth - Error Scenarios", test_oauth_error_scenarios)
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
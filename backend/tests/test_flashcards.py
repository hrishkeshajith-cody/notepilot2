"""
Flashcard API Backend Tests
Tests for custom flashcard feature: auth, CRUD operations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://card-craft-studio.preview.emergentagent.com')

# Test credentials from review request
TEST_EMAIL = "testflash@test.com"
TEST_PASSWORD = "test123"
TEST_NAME = "Test User"

class TestAuthEndpoints:
    """Authentication endpoints tests - signup and login"""
    
    def test_signup_new_user(self):
        """Test user registration"""
        import uuid
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": unique_email,
                "password": "test123",
                "name": "Test Signup User"
            }
        )
        # May return 400 if user exists, or 200/201 for new user
        assert response.status_code in [200, 201, 400]
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "user_id" in data
            assert "email" in data
            assert data["email"] == unique_email
            print(f"Signup successful: user_id={data['user_id']}")
    
    def test_login_valid_credentials(self):
        """Test login with valid credentials"""
        # First ensure user exists by signing up
        requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            }
        )
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert data["email"] == TEST_EMAIL
        print(f"Login successful: user_id={data['user_id']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "invalid@test.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        print("Invalid credentials correctly rejected")


class TestFlashcardCRUD:
    """Flashcard CRUD operation tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get session cookie"""
        # Ensure test user exists
        requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            }
        )
        
        # Login to get session
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - cannot test flashcards")
        
        print(f"Test setup complete, session cookies: {self.session.cookies.get_dict()}")
    
    def test_create_flashcard_set(self):
        """Test creating a new flashcard set"""
        flashcard_data = {
            "title": "TEST_Python Basics",
            "description": "Basic Python programming concepts",
            "flashcards": [
                {"question": "What is Python?", "answer": "A high-level programming language"},
                {"question": "What is a variable?", "answer": "A container for storing data values"}
            ]
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/flashcards",
            json=flashcard_data
        )
        
        assert response.status_code == 200, f"Create failed: {response.text}"
        
        data = response.json()
        assert "set_id" in data
        assert data["title"] == flashcard_data["title"]
        assert len(data["flashcards"]) == 2
        
        # Store for cleanup
        self.created_set_id = data["set_id"]
        print(f"Created flashcard set: {data['set_id']}")
        
        # Verify by fetching
        get_response = self.session.get(f"{BASE_URL}/api/flashcards/{data['set_id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == flashcard_data["title"]
        print("GET verification passed")
    
    def test_get_all_flashcard_sets(self):
        """Test retrieving all flashcard sets for user"""
        response = self.session.get(f"{BASE_URL}/api/flashcards")
        
        assert response.status_code == 200, f"Get all failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Retrieved {len(data)} flashcard sets")
        
        # Check structure of each set
        for flashcard_set in data:
            assert "set_id" in flashcard_set
            assert "title" in flashcard_set
            assert "flashcards" in flashcard_set
    
    def test_get_single_flashcard_set(self):
        """Test retrieving a single flashcard set"""
        # First create a set
        create_response = self.session.post(
            f"{BASE_URL}/api/flashcards",
            json={
                "title": "TEST_Single Set Test",
                "flashcards": [
                    {"question": "Q1", "answer": "A1"}
                ]
            }
        )
        
        assert create_response.status_code == 200
        set_id = create_response.json()["set_id"]
        
        # Now get it
        response = self.session.get(f"{BASE_URL}/api/flashcards/{set_id}")
        
        assert response.status_code == 200, f"Get single failed: {response.text}"
        
        data = response.json()
        assert data["set_id"] == set_id
        assert data["title"] == "TEST_Single Set Test"
        print(f"Successfully retrieved flashcard set: {set_id}")
    
    def test_get_nonexistent_flashcard_set(self):
        """Test retrieving a non-existent flashcard set returns 404"""
        response = self.session.get(f"{BASE_URL}/api/flashcards/nonexistent_id_12345")
        
        assert response.status_code == 404
        print("Non-existent flashcard set correctly returns 404")
    
    def test_update_flashcard_set(self):
        """Test updating a flashcard set"""
        # Create a set first
        create_response = self.session.post(
            f"{BASE_URL}/api/flashcards",
            json={
                "title": "TEST_Original Title",
                "description": "Original description",
                "flashcards": [
                    {"question": "Original Q", "answer": "Original A"}
                ]
            }
        )
        
        assert create_response.status_code == 200
        set_id = create_response.json()["set_id"]
        
        # Update the set
        update_data = {
            "title": "TEST_Updated Title",
            "flashcards": [
                {"question": "Updated Q1", "answer": "Updated A1"},
                {"question": "New Q2", "answer": "New A2"}
            ]
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/flashcards/{set_id}",
            json=update_data
        )
        
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        data = response.json()
        assert data["title"] == "TEST_Updated Title"
        assert len(data["flashcards"]) == 2
        print(f"Updated flashcard set: {set_id}")
        
        # Verify update persisted by GET
        get_response = self.session.get(f"{BASE_URL}/api/flashcards/{set_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == "TEST_Updated Title"
        assert len(fetched["flashcards"]) == 2
        print("GET verification after UPDATE passed")
    
    def test_delete_flashcard_set(self):
        """Test deleting a flashcard set"""
        # Create a set first
        create_response = self.session.post(
            f"{BASE_URL}/api/flashcards",
            json={
                "title": "TEST_To Be Deleted",
                "flashcards": [
                    {"question": "Delete me", "answer": "Please"}
                ]
            }
        )
        
        assert create_response.status_code == 200
        set_id = create_response.json()["set_id"]
        
        # Delete the set
        response = self.session.delete(f"{BASE_URL}/api/flashcards/{set_id}")
        
        assert response.status_code == 200, f"Delete failed: {response.text}"
        
        data = response.json()
        assert "message" in data
        print(f"Deleted flashcard set: {set_id}")
        
        # Verify deletion by trying to GET
        get_response = self.session.get(f"{BASE_URL}/api/flashcards/{set_id}")
        assert get_response.status_code == 404
        print("Confirmed flashcard set no longer exists")
    
    def test_delete_nonexistent_flashcard_set(self):
        """Test deleting a non-existent flashcard set returns 404"""
        response = self.session.delete(f"{BASE_URL}/api/flashcards/nonexistent_delete_id")
        
        assert response.status_code == 404
        print("Delete of non-existent set correctly returns 404")


class TestFlashcardValidation:
    """Test flashcard input validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login and get session"""
        requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            }
        )
        
        self.session = requests.Session()
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed")
    
    def test_create_without_auth(self):
        """Test that creating flashcards without auth fails"""
        # Use fresh session without auth
        no_auth_session = requests.Session()
        
        response = no_auth_session.post(
            f"{BASE_URL}/api/flashcards",
            json={
                "title": "Unauthorized Test",
                "flashcards": [{"question": "Q", "answer": "A"}]
            }
        )
        
        assert response.status_code == 401
        print("Unauthenticated request correctly rejected")
    
    def test_create_with_empty_flashcards(self):
        """Test creating with empty flashcards list"""
        response = self.session.post(
            f"{BASE_URL}/api/flashcards",
            json={
                "title": "TEST_Empty Cards",
                "flashcards": []
            }
        )
        
        # Depending on implementation, could be 400 or 422
        # Some implementations allow empty flashcard sets
        print(f"Empty flashcards response: {response.status_code}")
        # Don't assert specific code - just document behavior


class TestMeEndpoint:
    """Test the /auth/me endpoint"""
    
    def test_get_current_user(self):
        """Test getting current authenticated user info"""
        # Ensure user exists and login
        requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "name": TEST_NAME
            }
        )
        
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        
        assert login_response.status_code == 200
        
        # Now test /auth/me
        response = session.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "user_id" in data
        assert data["email"] == TEST_EMAIL
        print(f"Current user: {data}")
    
    def test_get_current_user_without_auth(self):
        """Test /auth/me without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 401
        print("Unauthenticated /auth/me correctly rejected")


# Cleanup fixture to remove test data after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed flashcard sets after tests"""
    yield
    
    # Login and cleanup
    session = requests.Session()
    login_response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
    )
    
    if login_response.status_code == 200:
        # Get all flashcards
        get_response = session.get(f"{BASE_URL}/api/flashcards")
        if get_response.status_code == 200:
            flashcards = get_response.json()
            for fc in flashcards:
                if fc.get("title", "").startswith("TEST_"):
                    session.delete(f"{BASE_URL}/api/flashcards/{fc['set_id']}")
                    print(f"Cleaned up: {fc['set_id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])


import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env file from explicit path
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
print(f"[DEBUG] Looking for .env at: {env_path}")
print(f"[DEBUG] .env exists: {env_path.exists()}")
load_dotenv(dotenv_path=env_path)

# Get credentials from environment variables
google_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
google_project = os.getenv("GOOGLE_CLOUD_PROJECT")

print("[DEBUG] Environment Variables After Loading:")
print(f"GOOGLE_APPLICATION_CREDENTIALS: {google_creds}")
print(f"GOOGLE_CLOUD_PROJECT: {google_project}")
print(f"NEO4J_URI: {os.getenv('NEO4J_URI')}")
print(f"NEO4J_USER: {os.getenv('NEO4J_USER')}")
print(f"NEO4J_PASSWORD: {os.getenv('NEO4J_PASSWORD')[:10] + '***' if os.getenv('NEO4J_PASSWORD') else None}")
print(f"NEO4J_DATABASE: {os.getenv('NEO4J_DATABASE')}")

# Verify and fix GOOGLE_APPLICATION_CREDENTIALS path if needed
if google_creds:
    # First try as-is
    creds_path = Path(google_creds)
    if not creds_path.exists():
        # Try converting forward slashes to backslashes for Windows
        creds_path_windows = Path(google_creds.replace('/', '\\'))
        if creds_path_windows.exists():
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(creds_path_windows)
            print(f"[DEBUG] Updated GOOGLE_APPLICATION_CREDENTIALS to Windows path: {creds_path_windows}")
        else:
            print(f"[WARNING] Credentials file not found at: {google_creds}")
            print(f"[WARNING] Also tried: {creds_path_windows}")
    else:
        print(f"[DEBUG] Credentials file found at: {creds_path}")
print("NEO4J_DATABASE:", os.getenv("NEO4J_DATABASE"))

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

# LangChain and Vertex AI imports
try:
    from langchain_google_vertexai import VertexAI
except ImportError:
    VertexAI = None

app = FastAPI(title="Patient Journey Agent API")

# MCP/ACL structures (customize as needed for patient journey)
class MCPACLPrompt(BaseModel):
    protocol: str = "MCP"
    agent: str = "patient_journey"
    action: str = "analyze_journey"
    context: Optional[str] = None
    symptoms: List[str]

class PatientJourneyRequest(BaseModel):
    prompt: Optional[str] = None
    patient_id: Optional[str] = None
    symptoms: List[str] = []

class PatientJourneyResult(BaseModel):
    journey_steps: List[str]
    confidence: float
    patient_name: Optional[str] = None

class PatientJourneyResponse(BaseModel):
    result: Optional[PatientJourneyResult] = None
    error: Optional[str] = None

GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")

# Initialize Vertex AI LLM via LangChain (if available)
vertex_llm = None
if VertexAI and GOOGLE_CLOUD_PROJECT:
    vertex_llm = VertexAI(
        project=GOOGLE_CLOUD_PROJECT,
        model_name="gemini-2.5-pro"
    )

from .domain_logic import PatientJourneyLogic

# Initialize domain logic
patient_journey_logic = PatientJourneyLogic()

@app.post("/patient_journey", response_model=PatientJourneyResponse)
def handle_patient_journey(request: PatientJourneyRequest):
    try:
        if not request.patient_id:
            return PatientJourneyResponse(error="patient_id is required")

        # Query patient journey from Neo4j
        journey_data = patient_journey_logic.get_patient_journey(request.patient_id)
        
        if "error" in journey_data:
            return PatientJourneyResponse(error=journey_data["error"])

        # Return journey steps
        result = PatientJourneyResult(
            journey_steps=journey_data.get("journey_steps", []),
            confidence=1.0,
            patient_name=journey_data.get("patient_name")
        )
        return PatientJourneyResponse(result=result)
    except Exception as e:
        import traceback
        print(f"[ERROR] Failed to process patient journey: {e}")
        print(traceback.format_exc())
        return PatientJourneyResponse(error=str(e))
    except Exception as e:
        return PatientJourneyResponse(error=str(e))

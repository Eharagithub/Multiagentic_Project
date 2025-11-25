import os
import requests
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any
import traceback
import logging

from orchestration.input_handler import InputHandler
from orchestration.task_planner import TaskPlanner
from orchestration.agent_dispatcher import AgentDispatcher
from services.enrichment_service import EnrichmentService
from services.llm_service import LLMService

# Initialize logger
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Orchestration Agent API")

@app.get("/health")
async def health_check():
    """Health check endpoint with CORS headers"""
    response = JSONResponse(
        content={"status": "healthy", "service": "orchestration_agent"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )
    return response

# Enable CORS with specific headers
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Expose all headers
)

# Add request logging middleware to track all incoming requests
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        logger.info(f"🔷 [Orchestrator] Incoming {request.method} request to {request.url.path}")
        try:
            response = await call_next(request)
            logger.info(f"🔷 [Orchestrator] {request.method} {request.url.path} → {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"🔷 [Orchestrator] Error processing {request.method} {request.url.path}: {str(e)}")
            raise

app.add_middleware(LoggingMiddleware)

# Add specific headers to health endpoint
from fastapi.responses import JSONResponse
@app.options("/health")
async def health_options():
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",  # 24 hours
    }
    return JSONResponse(
        content={},
        headers=headers
    )

# Initialize services and handlers
enrichment_service = EnrichmentService()
llm_service = LLMService()
input_handler = InputHandler()
task_planner = TaskPlanner()
agent_dispatcher = AgentDispatcher()

class MCPACLInput(BaseModel):
    mcp_acl: Dict[str, Any]

class ChatRequest(BaseModel):
    prompt: str
    user_id: str
    session_id: str
    workflow: str
    get_status: bool = False
    is_retry: bool = False

# Store results in memory (replace with proper storage in production)
session_results = {}

@app.post("/orchestrate")
async def orchestrate(request: ChatRequest):
    """
    Handles both initial requests and status checks for ongoing processes.
    """
    try:
        logger.info(f"🎯 [Orchestrate] Received request for session {request.session_id}")
        logger.info(f"🎯 [Orchestrate] Prompt: {request.prompt[:100]}...")
        logger.info(f"🎯 [Orchestrate] Workflow: {request.workflow}")
        
        # Check if this is a status request
        if request.get_status or request.is_retry:
            logger.info(f"🎯 [Orchestrate] Status check for session {request.session_id}")
            if request.session_id in session_results:
                results = session_results[request.session_id]
                logger.info(f"🎯 [Orchestrate] Found results for session {request.session_id}: {results}")
                return {
                    "status": "success",
                    "results": results
                }
            else:
                logger.info(f"No results yet for session {request.session_id}")
                return {
                    "status": "processing",
                    "mcp_acl": {
                        "agents": ["symptom_analyzer", "disease_prediction"],
                        "actions": [
                            {"agent": "symptom_analyzer", "action": "analyze_symptoms"},
                            {"agent": "disease_prediction", "action": "predict_disease"}
                        ]
                    }
                }

        # Call prompt processor to get MCP/ACL structure
        logger.info(f"🎯 [Orchestrate] Calling Prompt Processor (8000) to enrich...")
        prompt_payload = {
            "prompt": request.prompt,
            "user_id": request.user_id,
            "session_id": request.session_id,
            "workflow": request.workflow
        }
        
        try:
            prompt_response = requests.post(
                "http://127.0.0.1:8000/process_prompt",
                json=prompt_payload
            )
            if prompt_response.status_code != 200:
                logger.error(f"🎯 [Orchestrate] Prompt Processor returned {prompt_response.status_code}")
                raise HTTPException(
                    status_code=prompt_response.status_code,
                    detail=f"Prompt Processor Error: {prompt_response.text}"
                )
            
            logger.info(f"🎯 [Orchestrate] ✅ Prompt Processor returned MCP/ACL successfully")
            mcp_acl = prompt_response.json().get("mcp_acl")
            if not mcp_acl:
                logger.error(f"🎯 [Orchestrate] Prompt Processor response missing MCP/ACL")
                raise HTTPException(
                    status_code=400,
                    detail="No MCP/ACL structure returned from prompt processor"
                )
        except requests.RequestException as e:
            logger.error(f"🎯 [Orchestrate] Error calling Prompt Processor: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail=f"Error communicating with prompt processor: {str(e)}"
            )

        if not input_handler.validate(mcp_acl):
            logger.error(f"🎯 [Orchestrate] Invalid MCP/ACL structure")
            raise HTTPException(status_code=400, detail="Invalid MCP/ACL structure")

        logger.info(f"🎯 [Orchestrate] Extracting plan from MCP/ACL...")
        plan = input_handler.extract_plan(mcp_acl)
        logger.info(f"🎯 [Orchestrate] Sequencing tasks...")
        sequenced_tasks = task_planner.sequence_tasks(plan)
        logger.info(f"🎯 [Orchestrate] Dispatching tasks to agents...")
        results = agent_dispatcher.dispatch(sequenced_tasks)
        logger.info(f"🎯 [Orchestrate] ✅ Agent dispatch complete! Got {len(results) if results else 0} results")
        
        # Store results for this session
        session_results[request.session_id] = results
        logger.info(f"🎯 [Orchestrate] ✅ Returning results to client")
        
        return {
            "status": "success",
            "results": results
        }
    except ValueError as ve:
        logger.error(f"🎯 [Orchestrate] ValueError: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Orchestration error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Orchestration error: {str(e)}")

class DiseasePredictionRequest(BaseModel):
    symptoms: list[str]

@app.post("/predict_disease")
def predict_disease(request: DiseasePredictionRequest):
    """Predict diseases based on symptoms."""
    try:
        # Create MCP/ACL payload for disease prediction
        mcp_acl_json = {
            "user_input": f"Predict diseases for symptoms: {', '.join(request.symptoms)}",
            "workflow": "disease_prediction",
            "mcp": {
                "task": "disease_prediction",
                "input": {"symptoms": request.symptoms},
                "context": {"workflow": "medical_diagnosis"}
            }
        }

        # Send to disease prediction sub-agent via dispatcher
        dispatch_results = agent_dispatcher.dispatch([{
            "agent": "disease_prediction",
            "task": mcp_acl_json
        }])

        # Format the response
        if dispatch_results and len(dispatch_results) > 0:
            result = dispatch_results[0].get("result", {})
            return {
                "result": {
                    "predicted_diseases": result.get("diseases", []),
                    "confidence": result.get("confidence", 0.0)
                }
            }
        return {"error": "No prediction results"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/orchestrate_with_prompt")
async def orchestrate_with_prompt(request: Request):
    """
    New endpoint to integrate the prompt_processor service for MCP/ACL generation.
    """
    try:
        # Step 1: Receive raw prompt from the request
        input_data = await request.json()
        prompt_payload = {
            "prompt": input_data.get("prompt"),
            "user_id": input_data.get("user_id"),
            "session_id": input_data.get("session_id"),
            "workflow": input_data.get("workflow")
        }

        # Step 2: Call the prompt_processor service
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post("http://127.0.0.1:8000/process_prompt", json=prompt_payload)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"Prompt Processor Error: {response.text}")

            mcp_acl = response.json().get("mcp_acl")

        # Step 3: Validate MCP/ACL structure
        if not input_handler.validate(mcp_acl):
            raise HTTPException(status_code=400, detail="Invalid MCP/ACL structure from Prompt Processor")

        # Step 4: Extract execution plan
        plan = input_handler.extract_plan(mcp_acl)

        # Step 5: Sequence tasks
        sequenced_tasks = task_planner.sequence_tasks(plan)

        # Step 6: Dispatch tasks to sub-agents
        dispatch_results = agent_dispatcher.dispatch(sequenced_tasks)

        # Step 7: Return results
        return {
            "status": "success",
            "dispatch_results": dispatch_results
        }

    except HTTPException as http_exc:
        logger.error(f"HTTP Exception: {http_exc.detail}")
        raise
    except Exception as e:
        logger.error(f"Unhandled Exception: {str(e)}")
        logger.debug(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Orchestration error: {str(e)}")

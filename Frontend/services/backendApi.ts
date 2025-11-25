import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { BACKEND_BASE_URL } from '../config/backendConfig';

// Extend axios config type
interface RetryConfig extends InternalAxiosRequestConfig {
  retry?: number;
  retryDelay?: number;
}

// Create axios retry interceptor
const axiosRetry = async (error: AxiosError) => {
  const config = error.config as RetryConfig;
  if (!config || config.retry === undefined || config.retry <= 0) {
    return Promise.reject(error);
  }
  config.retry -= 1;
  const delayRetry = new Promise(resolve => setTimeout(resolve, config.retryDelay || 1000));
  await delayRetry;
  return axios(config);
};

// Create API instance for prompt processor (8000)
// Increased timeout to 120s for Vertex AI LLM processing
const api: AxiosInstance = axios.create({
  baseURL: BACKEND_BASE_URL, // Points to Prompt Processor (8000)
  timeout: 120000,  // 120 seconds - Vertex AI can take time for enrichment
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

// Create a second instance for orchestration agent calls (8001)
const orchestrationApi: AxiosInstance = axios.create({
  baseURL: BACKEND_BASE_URL.replace(':8000', ':8001'), // Points to Orchestration Agent (8001)
  timeout: 120000,  // 120 seconds - agents may also take time for processing
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

// Log API configuration
console.log('[API Config] api baseURL (Prompt Processor):', api.defaults.baseURL);
console.log('[API Config] orchestrationApi baseURL (Orchestrator):', orchestrationApi.defaults.baseURL);
console.log('[API Config] BACKEND_BASE_URL source:', BACKEND_BASE_URL);

// Add request interceptor to configure retry
api.interceptors.request.use((config) => {
  const retryConfig = config as RetryConfig;
  retryConfig.retry = 3;  // Number of retries
  retryConfig.retryDelay = 1000;  // Delay between retries in ms
  return config;
});

// Add response interceptor for retries
api.interceptors.response.use(undefined, (error) => {
  // Log detailed error information
  console.error('Network Error Details:', {
    url: error.config?.url,
    baseURL: error.config?.baseURL,
    fullUrl: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
    method: error.config?.method,
    status: error.response?.status,
    statusText: error.response?.statusText,
    message: error.message,
    isNetworkError: error.isAxiosError && !error.response,
    data: error.response?.data,
    headers: error.config?.headers,
    code: error.code,
    name: error.name
  });
  
  // Test the backend URL directly
  fetch(`${error.config?.baseURL}/health`)
    .then(response => response.text())
    .then(text => console.log('Health check response:', text))
    .catch(err => console.log('Health check failed:', err));
  
  return axiosRetry(error);
});

// Log all requests
api.interceptors.request.use((config) => {
  console.log('Making request to:', `${config.baseURL || ''}${config.url || ''}`);
  return config;
});

// Types for requests/responses
export interface PatientJourneyRequest {
  symptoms: string[];
}

export interface PatientJourneyResponse {
  result?: {
    journey_steps: string[];
    confidence: number;
  };
  error?: string;
}

export interface DiseasePredictionRequest {
  symptoms: string[];
}

export interface DiseasePredictionResponse {
  result?: {
    predicted_diseases: string[];
    confidence: number;
  };
  error?: string;
}

export interface ChatRequest {
  prompt: string;
  user_id?: string;
  session_id?: string;
  workflow?: string;
  get_status?: boolean;
  is_retry?: boolean;
}

export interface AgentResult {
  agent: string;
  result: {
    identified_symptoms?: string[];
    severity_level?: string;
    predicted_diseases?: string[];
    confidence?: number;
    [key: string]: any;
  };
}

export interface ChatResponse {
  status: string;
  results?: AgentResult[];
  error?: string;
  out_of_scope?: boolean;
  scope?: string;
  mcp_acl?: {
    scope?: string;
    agents: string[];
    workflow: string;
    actions: Array<{
      agent: string;
      action: string;
      params: Record<string, any>;
    }>;
    data_flow: Array<{
      from: string;
      to: string;
      data: string;
    }>;
  };
}

/**
 * Handles the complete chat flow:
 * 1. Sends request to prompt processor (8000) for enrichment (may take time for Vertex AI processing)
 * 2. Gets results from orchestration agent (8001)
 */
export async function callChatOrchestrate(payload: ChatRequest): Promise<ChatResponse> {
  try {
    const defaultedPayload = {
      prompt: payload.prompt,
      user_id: payload.user_id || 'current_user',
      session_id: payload.session_id || `session_${Date.now()}`,
      workflow: payload.workflow || 'medical_diagnosis',
      get_status: payload.get_status || false,
      is_retry: payload.is_retry || false
    };

    if (payload.get_status || payload.is_retry) {
      // For status checks and retries, go directly to orchestration agent
      console.log('[Orchestrate] Status check/retry - sending directly to orchestrationApi');
      const resp = await orchestrationApi.post<ChatResponse>('/orchestrate', defaultedPayload);
      return resp.data;
    }

    // For new requests:
    // 1. Send to prompt processor for enrichment
    console.log('[Orchestrate] Step 1: Sending to prompt processor (8000) for enrichment...');
    console.log('[Orchestrate] URL:', api.defaults.baseURL + '/process_prompt');
    console.log('[Orchestrate] Note: Vertex AI token processing may take 10-30 seconds. Do not close the app.');
    
    try {
      const enrichedResp = await api.post<{ mcp_acl: any }>('/process_prompt', defaultedPayload);
      console.log('[Orchestrate] ✅ Step 1 complete! Enriched response received');
      console.log('[Orchestrate] MCP/ACL structure:', enrichedResp.data);

      if (!enrichedResp.data.mcp_acl) {
        throw new Error('Prompt processor did not return MCP/ACL structure');
      }

      // 2. Send enriched MCP/ACL to orchestration agent
      console.log('[Orchestrate] Step 2: Sending enriched MCP/ACL to orchestration agent (8001)...');
      console.log('[Orchestrate] URL:', orchestrationApi.defaults.baseURL + '/orchestrate');
      
      const orchestrationResp = await orchestrationApi.post<ChatResponse>('/orchestrate', {
        ...defaultedPayload,
        mcp_acl: enrichedResp.data.mcp_acl
      });

      console.log('[Orchestrate] ✅ Step 2 complete! Final response received');
      console.log('[Orchestrate] Results:', orchestrationResp.data);
      return orchestrationResp.data;
    } catch (stepError: any) {
      console.error('[Orchestrate] ❌ Error during processing:', {
        message: stepError.message,
        code: stepError.code,
        status: stepError.response?.status,
        statusText: stepError.response?.statusText,
        isTimeout: stepError.code === 'ECONNABORTED' || stepError.message?.includes('timeout'),
        fullError: stepError
      });
      throw stepError;
    }
  } catch (error: any) {
    console.error('Error in chat orchestration:', error);
    if (axios.isAxiosError(error)) {
      const errorMsg = error.response?.data?.detail || error.message;
      console.error('[Orchestrate] Axios error details:', {
        message: errorMsg,
        status: error.response?.status,
        code: error.code,
        isNetworkError: !error.response,
        isTimeout: error.code === 'ECONNABORTED'
      });
      throw new Error(errorMsg);
    }
    throw error;
  }
}

export async function callPatientJourney(payload: PatientJourneyRequest): Promise<PatientJourneyResponse> {
  const resp = await api.post<PatientJourneyResponse>('/patient_journey', payload);
  return resp.data;
}

export async function callPredictDisease(payload: DiseasePredictionRequest): Promise<DiseasePredictionResponse> {
  const resp = await api.post<DiseasePredictionResponse>('/predict_disease', payload);
  return resp.data;
}

export default api;
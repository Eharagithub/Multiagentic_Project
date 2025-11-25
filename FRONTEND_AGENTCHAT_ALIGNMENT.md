# Frontend vs ExpoFE: Agent Chat Flow Alignment

## ✅ COMPLETED: Frontend Now Follows Correct Architecture

Both **Frontend** and **ExpoFE** now follow the **same well-tested flow** as documented in `end-end-flow.md` section 9.

---

## Correct Flow Architecture

```
User Input (AgentChat.tsx)
        ↓
callChatOrchestrate() in backendApi.ts
        ↓
    ┌───────────────────────────────┐
    │  Prompt Processor (Port 8000) │
    │  /process_prompt endpoint     │
    │  - Semantic understanding     │
    │  - MCP/ACL enrichment        │
    │  - Context injection         │
    └────────────┬──────────────────┘
                 ↓ (enriched MCP/ACL)
    ┌───────────────────────────────┐
    │ Orchestration Agent (Port 8001)│
    │ /orchestrate endpoint          │
    │ - Task planning               │
    │ - Agent dispatching           │
    │ - Result aggregation          │
    └────────────┬──────────────────┘
                 ↓
        Display Results in Chat
```

---

## Key Components

### 1. Frontend/app/common/AgentChat.tsx (NEW - Copied from ExpoFE)
**Status:** ✅ Copied from well-tested ExpoFE version
**Features:**
- Uses `callChatOrchestrate()` from backendApi
- Handles immediate results and polling with retries
- Progressive delays: 3s → 4s → 5s → 8s (max 10 retries)
- Formats results with emoji formatting
- Health check button in header
- Patient journey, symptom analysis, and disease prediction support

### 2. Frontend/services/backendApi.ts (VERIFIED)
**Status:** ✅ Already has correct implementation
**Implementation:**
```typescript
export async function callChatOrchestrate(payload: ChatRequest): Promise<ChatResponse> {
  // NEW REQUESTS: Prompt Processor → Orchestrator flow
  if (!payload.get_status && !payload.is_retry) {
    const enrichedResp = await api.post('/process_prompt', defaultedPayload);
    const orchestrationResp = await orchestrationApi.post('/orchestrate', {
      ...defaultedPayload,
      mcp_acl: enrichedResp.data.mcp_acl
    });
    return orchestrationResp.data;
  }
  
  // STATUS CHECKS: Direct to Orchestrator
  const resp = await orchestrationApi.post('/orchestrate', defaultedPayload);
  return resp.data;
}
```

### 3. Frontend/services/chatService.ts (REVERTED)
**Status:** ✅ Reverted to original implementation
**Note:** This file is NOT used in the correct flow - use `callChatOrchestrate()` from backendApi instead

### 4. Frontend/config/backendConfig.ts & constants.ts (UPDATED)
**Status:** ✅ IP addresses updated to 192.168.1.25
- backendConfig.ts: `http://192.168.1.25:8001`
- constants.ts: `http://192.168.1.25:8000`
- predictionService.ts: `http://192.168.1.25:8000`

---

## ExpoFE Reference Implementation

Both Frontend and ExpoFE now use identical architecture:
- **ExpoFE/app/common/AgentChat.tsx** - Reference implementation (well-tested, documented)
- **ExpoFE/services/backendApi.ts** - Proper flow routing through Prompt Processor

Frontend has been updated to mirror ExpoFE's implementation exactly.

---

## Verification Checklist

- ✅ Frontend has correct AgentChat.tsx (copied from ExpoFE)
- ✅ Frontend's backendApi.ts routes through Prompt Processor
- ✅ IP addresses updated to 192.168.1.25
- ✅ Both Frontend and ExpoFE follow same flow
- ✅ Proper error handling and retry logic
- ✅ Status polling with progressive delays

---

## How It Works (Step-by-Step)

1. **User types in AgentChat** → "I have a headache and fever"
2. **sendMessage()** calls `callChatOrchestrate()`
3. **backendApi.ts** handles the flow:
   - Sends to Prompt Processor (8000) → Gets enriched MCP/ACL
   - Sends enriched MCP/ACL to Orchestrator (8001)
4. **Response handling:**
   - If immediate results: display them
   - If MCP/ACL actions: show "Processing..." and start polling
5. **waitForResults()** polls with progressive delays:
   - Checks for complete results (symptoms + disease predictions)
   - Retries up to 10 times with increasing delays
   - Returns formatted response when ready

---

## Testing Notes

- Health check button in header tests backend connectivity
- Console logs show flow progress (Prompt Processor → Orchestrator)
- Retry mechanism handles async agent processing
- Result formatting includes emojis for better UX
- Patient ID propagation throughout flow


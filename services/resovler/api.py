from fastapi import FastAPI
from pydantic import BaseModel
from resolver import EntityResolver
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
resolver = EntityResolver("db.json")


class QueryRequest(BaseModel):
    query: str
    session_id: str

@app.post("/resolve-entity")
def resolve_entity(req: QueryRequest):
    # The resolver currently does not use session context, but we keep
    # `session_id` in the request model for frontend compatibility.
    result = resolver.resolve(req.query)

    status = result.get("status")
    intents = result.get("intents") or []
    # Resolver attaches `intents` (list) + `intent_status`, not legacy singular `intent`.
    intent = intents[0] if len(intents) == 1 else None
    intent_payload = {
        "intent": intent,
        "intents": intents,
        "intent_status": result.get("intent_status"),
    }
    resolved_entities = result.get("entities", []) or result.get("resolved_entities", []) or []
    if status == "resolved":
        return {
            "status": "resolved",
            "entities": result.get("entities", []),
            "resolved_entities": resolved_entities,
            "action": "ok",
            **intent_payload,
            "description": result.get("description", "Resolved location(s) successfully."),
        }

    if status == "ambiguous":
        body = {
            "status": "ambiguous",
            "message": result.get("message", "Multiple matches found. Please clarify."),
            "options": result.get("options", []),
            "resolved_entities": resolved_entities,
            **intent_payload,
            "description": result.get("description", "Your query matches more than one possible location."),
        }
        if result.get("suggestions"):
            body["suggestions"] = result["suggestions"]
        return body

    if status == "suggest":
        body = {
            "status": "suggest",
            "message": result.get("message", "Did you mean one of these?"),
            "options": result.get("options", []),
            "resolved_entities": resolved_entities,
            **intent_payload,
            "description": result.get("description", "Showing close matches based on your query."),
        }
        if result.get("entities"):
            body["entities"] = result["entities"]
            body["action"] = "ok"
        return body

    if status == "not_found":
        body = {
            "status": "not_found",
            "message": result.get("message", "Could not find any matching location."),
            "resolved_entities": resolved_entities,
            **intent_payload,
            "description": result.get("description", "No matching location was found."),
        }
        if result.get("entities"):
            body["entities"] = result["entities"]
        return body

    return {"status": "error", "message": "Unknown resolver status", "raw": result}


@app.get("/")
def root():
    return {"message": "Entity Resolver API Running "}

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Happiness is when your code runs without errors!😘"}
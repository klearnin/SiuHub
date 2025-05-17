from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI()

class PlayerPosition(BaseModel):
    id: str
    x: float
    y: float

class PlayerRole(BaseModel):
    number: int
    isCaptain: bool
    isPenaltyTaker: bool
    position: dict

class TacticData(BaseModel):
    id: Optional[str] = None
    name: str
    formation: str
    players: List[PlayerRole]
    positions: List[PlayerPosition]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# In-memory storage for tactics (replace with database in production)
tactics_db = {}

@app.post("/api/tactics")
async def create_tactic(tactic: TacticData):
    tactic_id = str(uuid.uuid4())
    tactic.id = tactic_id
    tactic.created_at = datetime.now()
    tactic.updated_at = datetime.now()
    
    tactics_db[tactic_id] = tactic
    return tactic

@app.get("/api/tactics")
async def list_tactics():
    return list(tactics_db.values())

@app.get("/api/tactics/{tactic_id}")
async def get_tactic(tactic_id: str):
    if tactic_id not in tactics_db:
        raise HTTPException(status_code=404, detail="Tactic not found")
    return tactics_db[tactic_id]

@app.put("/api/tactics/{tactic_id}")
async def update_tactic(tactic_id: str, tactic: TacticData):
    if tactic_id not in tactics_db:
        raise HTTPException(status_code=404, detail="Tactic not found")
    
    tactic.id = tactic_id
    tactic.updated_at = datetime.now()
    tactics_db[tactic_id] = tactic
    return tactic

@app.delete("/api/tactics/{tactic_id}")
async def delete_tactic(tactic_id: str):
    if tactic_id not in tactics_db:
        raise HTTPException(status_code=404, detail="Tactic not found")
    
    del tactics_db[tactic_id]
    return {"message": "Tactic deleted successfully"} 
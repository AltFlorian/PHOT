from typing import Annotated, Union
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from sqlmodel import Field, Session, SQLModel, create_engine, select
from decimal import Decimal
from datetime import datetime
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    height: float = 200.0
    max_capacity: int = 4000

class TankLevelBase(SQLModel):
    fuel_level: Decimal = Field(default=0, max_digits=4, decimal_places=1)
    measured_on: str = Field(index=True)

class TankLevel(TankLevelBase, table=True):
    id: Union[int, None] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.now, nullable=False)

class TankLevelPublic(TankLevelBase):
    id: int

class TankLevelCreate(TankLevelBase):
    fuel_level: Union[Decimal, float, None] = None
    measured_on: Union[str, None] = None

class TankLevelUpdate(TankLevelBase):
    fuel_level: Union[Decimal, None] = None
    measured_on: Union[str, None] = None

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///storage///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]
settings = Settings()
app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.post("/api/v1/tanklevels/", response_model=TankLevelPublic)
def create_tanklevel(tanklevel: TankLevelCreate, session: SessionDep):
    db_tanklevel = TankLevel.model_validate(tanklevel)
    session.add(db_tanklevel)
    session.commit()
    session.refresh(db_tanklevel)
    return db_tanklevel

@app.get("/api/v1/tanklevels/", response_model=list[TankLevelPublic])
def read_tanklevels(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    tanklevels = session.exec(select(TankLevel).offset(offset).limit(limit)).all()
    return tanklevels

@app.get("/api/v1/tanklevels/{tanklevel_id}", response_model=TankLevelPublic)
def read_tanklevel(tanklevel_id: int, session: SessionDep):
    tanklevel = session.get(TankLevel, tanklevel_id)
    if not tanklevel:
        raise HTTPException(status_code=404, detail="Tank level not found")
    return tanklevel

@app.patch("/api/v1/tanklevels/{tanklevel_id}", response_model=TankLevelPublic)
def update_tanklevel(tanklevel_id: int, tanklevel: TankLevelUpdate, session: SessionDep):
    tanklevel_db = session.get(TankLevel, tanklevel_id)
    if not tanklevel_db:
        raise HTTPException(status_code=404, detail="Tank level not found")
    tanklevel_data = tanklevel.model_dump(exclude_unset=True)
    tanklevel_db.sqlmodel_update(tanklevel_data)
    session.add(tanklevel_db)
    session.commit()
    session.refresh(tanklevel_db)
    return tanklevel_db

@app.delete("/api/v1/tanklevels/{tanklevel_id}")
def delete_tanklevel(tanklevel_id: int, session: SessionDep):
    tanklevel = session.get(TankLevel, tanklevel_id)
    if not tanklevel:
        raise HTTPException(status_code=404, detail="Tank level not found")
    session.delete(tanklevel)
    session.commit()
    return {"ok": True}

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(
        request=request, name="index.html", context={"max_tank_height": settings.height, "max_tank_capacity": settings.max_capacity}
    )
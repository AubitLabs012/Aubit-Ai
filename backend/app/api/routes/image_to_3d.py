import asyncio
import json
from typing import Annotated, Literal
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field
from app.api.dependencies import require_current_user
from app.api.routes.text_to_3d import valid_task_id
from app.api.schemas import ApiResponse
from app.services.image_3d import InvalidImage, MAX_IMAGE_BYTES
from app.services import image3d_jobs
from app.services.text_to_3d_service import TextTo3DService

router = APIRouter(prefix="/image-to-3d", tags=["image-to-3d"])

def with_image_file_urls(result, request):
    return {**result, "model_urls": {ext: str(request.url_for(f"download_{ext}", task_id=result["id"])) for ext in ("glb", "stl")}}

@router.get("/config", response_model=ApiResponse)
def config(user=Depends(require_current_user)):
    return ApiResponse(message="Local engine readiness", data=image3d_jobs.config())

@router.post("", response_model=ApiResponse, status_code=202)
async def create_image_model(background_tasks: BackgroundTasks,
    images: Annotated[list[UploadFile], File()], views: Annotated[str, Form()] = '["front"]',
    engine: Annotated[str, Form()] = "hunyuan-mini", detail: Annotated[Literal["low", "standard", "high"], Form()] = "standard",
    remove_background: Annotated[bool, Form()] = True, align: Annotated[bool, Form()] = True,
    seed: Annotated[int, Form(ge=0, le=2147483647)] = 12345, user=Depends(require_current_user)):
    try:
        try:
            labels = json.loads(views)
        except ValueError:
            raise HTTPException(400, "Views must be a JSON list of angle labels.")
        if not isinstance(labels, list) or not all(isinstance(v, str) for v in labels) or len(labels) != len(images) or not 1 <= len(images) <= 4:
            raise HTTPException(400, "Upload 1–4 images with one matching label per image.")
        uploads = []
        for label, image in zip(labels, images):
            data = await image.read(MAX_IMAGE_BYTES + 1)
            if len(data) > MAX_IMAGE_BYTES:
                raise HTTPException(413, "Each reference image must be 10 MB or smaller.")
            uploads.append((label, data, image.filename or "reference.png"))
        task = await asyncio.to_thread(image3d_jobs.prepare_job, uploads, engine=engine, detail=detail, remove_background=remove_background, align=align, seed=seed)
    except InvalidImage as exc:
        raise HTTPException(400, str(exc)) from exc
    finally:
        for image in images:
            await image.close()
    background_tasks.add_task(image3d_jobs.run_job, task)
    return ApiResponse(message="Local reconstruction queued", data=task)

class EditRequest(BaseModel):
    operation: Literal["inspect", "repair", "parts", "optimize", "texture"]
    target_faces: int = Field(default=20000, ge=100, le=200000)
    part: int | None = Field(default=None, ge=0, le=10000)
    keep_largest: bool = False
    color: str = Field(default="#75aaff", pattern=r"^#[0-9a-fA-F]{6}$")
    bands: int = Field(default=4, ge=2, le=8)
    use_references: bool = True
    texture_size: Literal[512, 1024, 2048] = 1024

@router.post("/{task_id}/edit", response_model=ApiResponse, status_code=202)
def edit(task_id: str, payload: EditRequest, background_tasks: BackgroundTasks, user=Depends(require_current_user)):
    task = image3d_jobs.prepare_edit(valid_task_id(task_id), payload.operation, payload.model_dump(exclude={"operation"}))
    background_tasks.add_task(image3d_jobs.run_job, task)
    return ApiResponse(message="Mesh processing queued", data=task)

class ReviewRequest(BaseModel):
    decision: Literal["accepted", "rejected"]

@router.post("/{task_id}/review", response_model=ApiResponse)
def review(task_id: str, payload: ReviewRequest, request: Request, user=Depends(require_current_user)):
    task = TextTo3DService().get_model(valid_task_id(task_id))
    if task.get("status") != "SUCCEEDED" or task.get("quality_status") == "invalid":
        raise HTTPException(409, "Only a completed, structurally valid mesh can be reviewed.")
    task["quality_status"] = payload.decision
    image3d_jobs.write_task(task)
    return ApiResponse(message="Inspection decision saved", data=with_image_file_urls(task, request))

@router.get("/{task_id}", response_model=ApiResponse)
def get_job(task_id: str, request: Request, user=Depends(require_current_user)):
    task = image3d_jobs.get_job(valid_task_id(task_id))
    if task["status"] == "SUCCEEDED":
        task = with_image_file_urls(task, request)
    return ApiResponse(message="Local job status", data=task)

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
    task_id = result["id"]
    urls = {ext: str(request.url_for(f"download_{ext}", task_id=task_id)) for ext in ("glb", "stl")}
    try:
        TextTo3DService().get_file(task_id, "png")
        urls["thumbnail"] = str(request.url_for("download_thumb", task_id=task_id))
    except Exception:
        pass
    return {**result, "model_urls": urls}

@router.get("/config", response_model=ApiResponse)
def config(user=Depends(require_current_user)):
    return ApiResponse(message="Local engine readiness", data=image3d_jobs.config())

@router.post("", response_model=ApiResponse, status_code=202)
async def create_image_model(background_tasks: BackgroundTasks,
    images: Annotated[list[UploadFile], File()], views: Annotated[str, Form()] = '["front"]',
    engine: Annotated[str, Form()] = "hunyuan-mini", detail: Annotated[Literal["low", "standard", "high", "ultra"], Form()] = "standard",
    remove_background: Annotated[bool, Form()] = True, align: Annotated[bool, Form()] = True,
    seed: Annotated[int, Form(ge=0, le=2147483647)] = 12345,
    ultra_mesh_quality: Annotated[bool, Form()] = True,
    ai_complete: Annotated[bool, Form()] = False,
    texture: Annotated[bool, Form()] = True,
    texture_quality: Annotated[Literal["2K", "4K", "8K"], Form()] = "4K",
    remove_lighting: Annotated[bool, Form()] = False,
    pbr: Annotated[bool, Form()] = True,
    topology: Annotated[Literal["triangle", "quad"], Form()] = "triangle",
    polycount: Annotated[int, Form(ge=500, le=2000000)] = 50000,
    user=Depends(require_current_user)):
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
        task = await asyncio.to_thread(image3d_jobs.prepare_job, uploads, engine=engine, detail=detail,
                                      remove_background=remove_background, align=align, seed=seed,
                                      ultra_mesh_quality=ultra_mesh_quality, ai_complete=ai_complete,
                                      texture=texture, texture_quality=texture_quality,
                                      remove_lighting=remove_lighting, pbr=pbr,
                                      topology=topology, polycount=polycount)
    except InvalidImage as exc:
        raise HTTPException(400, str(exc)) from exc
    finally:
        for image in images:
            await image.close()
    background_tasks.add_task(image3d_jobs.run_job, task)
    return ApiResponse(message="Local reconstruction queued", data=task)

class EditRequest(BaseModel):
    operation: Literal["inspect", "repair", "parts", "optimize", "texture"]
    target_faces: int = Field(default=50000, ge=100, le=2000000)
    part: int | None = Field(default=None, ge=0, le=10000)
    keep_largest: bool = False
    color: str = Field(default="#75aaff", pattern=r"^#[0-9a-fA-F]{6}$")
    bands: int = Field(default=4, ge=2, le=8)
    use_references: bool = True
    texture_size: Literal[512, 1024, 2048, 4096, 8192] = 2048
    topology: Literal["triangle", "quad"] = "triangle"

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

@router.delete("/{task_id}", response_model=ApiResponse)
def delete_image_job(task_id: str, user=Depends(require_current_user)):
    tid = valid_task_id(task_id)
    success = TextTo3DService().delete_model(tid)
    if not success:
        raise HTTPException(status_code=404, detail="3D model not found or already deleted.")
    return ApiResponse(message="3D model deleted successfully", data={"id": tid, "deleted": True})

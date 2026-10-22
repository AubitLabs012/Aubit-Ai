import asyncio
import re

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse

from app.api.dependencies import require_current_user
from app.api.schemas import ApiResponse, TextTo3DRequest
from app.services.local_3d import SUPPORTED_OBJECTS
from app.services.text_to_3d_service import TextTo3DService


router = APIRouter(prefix="/text-to-3d", tags=["text-to-3d"])


def valid_task_id(task_id: str) -> str:
    if not re.fullmatch(r"[0-9a-f]{32}", task_id):
        raise HTTPException(status_code=400, detail="Invalid 3D model ID.")
    return task_id


def with_file_urls(result: dict, request: Request) -> dict:
    task_id = result["id"]
    urls = {
        "glb": str(request.url_for("download_glb", task_id=task_id)),
        "stl": str(request.url_for("download_stl", task_id=task_id)),
    }
    try:
        TextTo3DService().get_file(task_id, "png")
        urls["thumbnail"] = str(request.url_for("download_thumb", task_id=task_id))
    except Exception:
        pass
    return {
        **result,
        "model_urls": urls,
    }


@router.get("/config", response_model=ApiResponse)
def get_config(user: dict = Depends(require_current_user)) -> ApiResponse:
    return ApiResponse(message="Local 3D generator ready", data={"available": True, "engine": "Aubit Local 3D", "supported_objects": SUPPORTED_OBJECTS})


@router.get("", response_model=ApiResponse)
def list_models(request: Request, user: dict = Depends(require_current_user)) -> ApiResponse:
    models = TextTo3DService().list_models()
    return ApiResponse(message="Local model library", data={"models": [with_file_urls(model, request) for model in models]})


@router.post("", response_model=ApiResponse)
async def create_model(payload: TextTo3DRequest, request: Request, user: dict = Depends(require_current_user)) -> ApiResponse:
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Describe the 3D model you want to create.")
    result = await asyncio.to_thread(TextTo3DService().create_model, payload.prompt)
    return ApiResponse(message="3D model generated locally", data=with_file_urls(result, request))


@router.get("/{task_id}", response_model=ApiResponse)
def get_model(task_id: str, request: Request, user: dict = Depends(require_current_user)) -> ApiResponse:
    result = TextTo3DService().get_model(valid_task_id(task_id))
    return ApiResponse(message="3D model details", data=with_file_urls(result, request))


@router.delete("/{task_id}", response_model=ApiResponse)
def delete_model(task_id: str, user: dict = Depends(require_current_user)) -> ApiResponse:
    tid = valid_task_id(task_id)
    success = TextTo3DService().delete_model(tid)
    if not success:
        raise HTTPException(status_code=404, detail="3D model not found or already deleted.")
    return ApiResponse(message="3D model deleted successfully", data={"id": tid, "deleted": True})


@router.get("/{task_id}/model.glb", name="download_glb")
def download_glb(task_id: str) -> FileResponse:
    path = TextTo3DService().get_file(valid_task_id(task_id), "glb")
    return FileResponse(path, media_type="model/gltf-binary", filename=f"aubit-{task_id[:8]}.glb")


@router.get("/{task_id}/model.stl", name="download_stl")
def download_stl(task_id: str) -> FileResponse:
    path = TextTo3DService().get_file(valid_task_id(task_id), "stl")
    return FileResponse(path, media_type="model/stl", filename=f"aubit-{task_id[:8]}.stl")


@router.get("/{task_id}/thumbnail.png", name="download_thumb")
def download_thumb(task_id: str) -> FileResponse:
    path = TextTo3DService().get_file(valid_task_id(task_id), "png")
    return FileResponse(path, media_type="image/png", filename=f"aubit-{task_id[:8]}.png")

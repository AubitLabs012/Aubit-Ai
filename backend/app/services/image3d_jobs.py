"""Serialized local inference and non-destructive mesh editing jobs."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import threading
from uuid import uuid4
from fastapi import HTTPException
from app.services.image_3d import read_image
from app.services.image3d_engines import config, engine_status, runtime_paths, ENGINES
from app.services.text_to_3d_service import TextTo3DService, model_output_dir

_lock = threading.Lock()
_active = set()

def write_task(task):
    path = model_output_dir() / f"{task['id']}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(task), encoding="utf-8")
    temporary.replace(path)

def _new_task(**kwargs):
    if _lock.locked():
        stale = True
        for task_id in list(_active):
            task_path = model_output_dir() / f"{task_id}.json"
            if task_path.is_file():
                try:
                    data = json.loads(task_path.read_text(encoding="utf-8"))
                    if data.get("status") in {"PENDING", "IN_PROGRESS"}:
                        stale = False
                except Exception:
                    pass
        if stale:
            _active.clear()
            try:
                _lock.release()
            except RuntimeError:
                pass

    if not _lock.acquire(blocking=False):
        raise HTTPException(409, "A local 3D job is already running. Wait for it to finish.")
    task = dict(id=uuid4().hex, source="image", status="PENDING", stage="Queued", progress=0, **kwargs)
    try:
        job = model_output_dir() / "image-jobs" / task["id"]
        job.mkdir(parents=True, exist_ok=True)
        _active.add(task["id"])
        return task, job
    except Exception:
        if _lock.locked():
            try:
                _lock.release()
            except RuntimeError:
                pass
        raise

def prepare_job(images, *, engine="hunyuan-mini", detail="standard", remove_background=True, align=True, seed=12345):
    if engine not in ENGINES:
        raise HTTPException(400, "Unknown engine.")
    spec = engine_status(engine)
    views = [view for view, _, _ in images]
    if not 1 <= len(views) <= 4 or len(set(views)) != len(views) or "front" not in views:
        raise HTTPException(400, "Supply one front image and up to three unique side/back views.")
    if any(view not in spec["views"] for view in views):
        raise HTTPException(400, "This engine accepts a single front image. Select Hunyuan3D-2mv for multiple views.")
    if engine == "hunyuan-mv" and len(views) < 2:
        raise HTTPException(400, "Hunyuan3D-2mv needs at least two labeled views.")
    decoded = [(view, read_image(data), Path(name.replace('\\', '/')).name[:120]) for view, data, name in images]
    if not spec["available"]:
        raise HTTPException(503, f"{spec['name']}: {spec['message']}. {spec['setup_command']}")
    task, job = _new_task(engine=spec["name"], engine_id=engine, operation="generate", detail=detail,
                          remove_background=remove_background, align=align, seed=seed, views=views,
                          prompt=f"Image to 3D: {decoded[0][2]}", interpreted_as=Path(decoded[0][2]).stem)
    try:
        for view, image, _ in decoded:
            image.thumbnail((2048, 2048))
            image.save(job / f"input-{view}.png")
        (job / "request.json").write_text(json.dumps(task), encoding="utf-8")
        write_task(task)
        return task
    except Exception:
        _active.discard(task["id"])
        if _lock.locked():
            try:
                _lock.release()
            except RuntimeError:
                pass
        raise

def prepare_edit(source_id, operation, options):
    source = TextTo3DService().get_model(source_id)
    path = TextTo3DService().get_file(source_id, "glb")
    if source.get("quality_status") == "invalid":
        raise HTTPException(400, "This mesh has invalid geometry. Regenerate it before editing.")
    python, _ = runtime_paths()
    if not python.is_file():
        raise HTTPException(503, "Install the image studio runtime first.")
    task, job = _new_task(operation=operation, parent_id=source_id, options=options,
                          engine="Aubit mesh tools", prompt=f"{source.get('interpreted_as', 'Model')} · {operation}",
                          interpreted_as=f"{source.get('interpreted_as', 'Model')} · {operation}")
    try:
        shutil.copy2(path, job / "source.glb")
        refs = model_output_dir() / "image-jobs" / source_id
        for reference in refs.glob("reference-*.png"):
            shutil.copy2(reference, job / reference.name)
        (job / "request.json").write_text(json.dumps(task), encoding="utf-8")
        write_task(task)
        return task
    except Exception:
        _active.discard(task["id"])
        if _lock.locked():
            try:
                _lock.release()
            except RuntimeError:
                pass
        raise

def run_job(task):
    task = dict(task)
    job = model_output_dir() / "image-jobs" / task["id"]
    python, models = runtime_paths()
    try:
        task.update(status="IN_PROGRESS", stage="Starting local worker")
        write_task(task)
        with (job / "worker.log").open("w", encoding="utf-8") as log:
            result = subprocess.run([str(python), "-u", str(Path(__file__).with_name("image3d_worker.py")), "--job-dir", str(job), "--models", str(models)],
                                    stdout=log, stderr=subprocess.STDOUT, timeout=3600,
                                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
        if result.returncode:
            lines = (job / "worker.log").read_text(encoding="utf-8", errors="replace").splitlines()
            raise RuntimeError(next((line.removeprefix("AUBIT_ERROR: ") for line in reversed(lines) if line.startswith("AUBIT_ERROR: ")), "The worker stopped. See the local job log for details.")[:700])
        metadata = json.loads((job / "result.json").read_text(encoding="utf-8"))
        for ext in ("glb", "stl"):
            (job / f"model.{ext}").replace(model_output_dir() / f"{task['id']}.{ext}")
        task.update(metadata, status="SUCCEEDED", progress=100, stage="Ready for inspection",
                    quality_status="review", notice="Inspect all sides before accepting. Unseen surfaces are estimates.")
        write_task(task)
    except subprocess.TimeoutExpired:
        task.update(status="FAILED", error="The job exceeded one hour. Free memory or choose a lower detail level.")
        write_task(task)
    except Exception as exc:
        task.update(status="FAILED", error=str(exc))
        write_task(task)
    finally:
        for path in job.glob("input-*.png"):
            path.unlink(missing_ok=True)
        _active.discard(task["id"])
        if _lock.locked():
            try:
                _lock.release()
            except RuntimeError:
                pass

def get_job(task_id):
    task = TextTo3DService().get_model(task_id)
    if task["status"] in {"PENDING", "IN_PROGRESS"}:
        if task_id not in _active:
            task.update(status="FAILED", error="Backend restarted during this job. Please try again.")
            write_task(task)
        else:
            try:
                task.update(json.loads((model_output_dir() / "image-jobs" / task_id / "progress.json").read_text()))
            except (OSError, ValueError):
                pass
    return task

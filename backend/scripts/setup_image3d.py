"""Install pinned local engines. SF3D requires local HF authentication."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import venv
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
from app.services.image3d_engines import ENGINES, runtime_paths

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", choices=ENGINES, default="hunyuan-mini")
    parser.add_argument("--download-only", action="store_true")
    parser.add_argument("--token", default=os.environ.get("HF_TOKEN"), help="Hugging Face access token for gated models")
    args = parser.parse_args()
    python, models = runtime_paths()
    spec = ENGINES[args.engine]
    root = models / args.engine
    root.mkdir(parents=True, exist_ok=True)
    cache = models / "cache"
    cache.mkdir(exist_ok=True)
    env = dict(os.environ, HF_HOME=str(cache), HUGGINGFACE_HUB_CACHE=str(cache / "hub"), PIP_CACHE_DIR=str(cache / "pip"), TEMP=str(cache), TMP=str(cache), HF_HUB_DOWNLOAD_TIMEOUT="120")
    env.setdefault("HF_TOKEN_PATH", str(Path.home() / ".cache/huggingface/token"))
    def update(message):
        print(message, flush=True)
        (root / "install-status.json").write_text(json.dumps({"message": message}), encoding="utf-8")
    try:
        if not args.download_only:
            update("Installing engine dependencies")
            if not python.exists():
                venv.create(python.parent.parent, with_pip=True)
            subprocess.run([str(python), "-m", "pip", "install", "torch==2.6.0", "torchvision==0.21.0", "--index-url", "https://download.pytorch.org/whl/cu124"], env=env, check=True)
            subprocess.run([str(python), "-m", "pip", "install", "-r", str(BACKEND / "requirements-image3d.txt")], env=env, check=True)
        update("Downloading pinned weights (several GB; resumable)")
        prefix = spec["folder"] + "/" if spec["folder"] else ""
        token_repr = repr(args.token) if args.token else "None"
        script = "from huggingface_hub import snapshot_download; snapshot_download(repo_id=%r, revision=%r, local_dir=%r, allow_patterns=%r, max_workers=2, token=%s)" % (spec["repo"], spec["revision"], str(root), [prefix + "config.yaml", prefix + spec["weight"], "LICENSE*", "NOTICE*", "README.md"], token_repr)
        subprocess.run([str(python), "-c", script], env=env, check=True)
        vendor = BACKEND / "app" / "vendor" / {"hunyuan2": "hunyuan2", "hunyuan21": "hunyuan21", "sf3d": "sf3d"}[spec["family"]]
        if spec["family"] == "hunyuan21":
            vendor = vendor / "hy3dshape"
        if spec["family"] == "sf3d":
            update("Building SF3D extensions: CUDA toolkit and Visual Studio required")
            subprocess.run([str(python), "-m", "pip", "install", "jaxtyping==0.2.31", "open_clip_torch==2.24.0", "pynanoinstantmeshes==0.0.3", "gpytoolbox==0.2.0", str(vendor / "texture_baker"), str(vendor / "uv_unwrapper")], env=env, check=True)
        probe = {"hunyuan2": "from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline", "hunyuan21": "from hy3dshape.pipelines import Hunyuan3DDiTFlowMatchingPipeline", "sf3d": "from sf3d.system import SF3D"}[spec["family"]]
        update("Checking runtime imports")
        subprocess.run([str(python), "-c", "import sys; sys.path.insert(0, %r); %s" % (str(vendor), probe)], env=env, cwd=vendor, check=True)
        (root / "installed.json").write_text(json.dumps({"runtime_verified": True, "revision": spec["revision"]}), encoding="utf-8")
        update("Installed locally; generation depends on available memory")
    except Exception:
        update("Installation incomplete. See setup log. SF3D needs accepted HF access and Windows build tools.")
        raise

if __name__ == "__main__":
    main()

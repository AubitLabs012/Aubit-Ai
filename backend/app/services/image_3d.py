"""Validate local image-to-3D inputs before handing them to the AI worker."""
from __future__ import annotations

import io
import warnings

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 16_000_000


class InvalidImage(ValueError):
    pass


def read_image(data: bytes) -> Image.Image:
    if not data or len(data) > MAX_IMAGE_BYTES:
        raise InvalidImage("Choose an image between 1 byte and 10 MB.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as source:
                if source.format not in {"PNG", "JPEG", "WEBP"}:
                    raise InvalidImage("Use a PNG, JPG, or WebP image.")
                width, height = source.size
                if min(width, height) < 8 or width * height > MAX_IMAGE_PIXELS:
                    raise InvalidImage("Use an image at least 8 x 8 pixels and no larger than 16 megapixels.")
                if getattr(source, "n_frames", 1) > 1:
                    raise InvalidImage("Use a still image, not an animation.")
                source.load()
                image = ImageOps.exif_transpose(source).convert("RGBA")
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError,
            Image.DecompressionBombWarning) as exc:
        raise InvalidImage("This image could not be read. Choose a valid PNG, JPG, or WebP.") from exc
    if image.getchannel("A").getextrema()[1] < 128:
        raise InvalidImage("This image is transparent. Choose an image with a visible subject.")
    return image


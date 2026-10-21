"""Aubit's offline, procedural text-to-3D engine.

The geometry rules are intentionally local and deterministic. No prompt, model,
or credential is sent to an outside service.
"""

from __future__ import annotations

import hashlib
import math
import random
import re
from dataclasses import dataclass

import numpy as np
import trimesh


COLORS = {
    "red": (211, 66, 64, 255), "blue": (54, 120, 218, 255),
    "green": (66, 157, 100, 255), "yellow": (244, 199, 72, 255),
    "orange": (237, 137, 57, 255), "purple": (144, 95, 205, 255),
    "pink": (234, 132, 177, 255), "black": (40, 47, 57, 255),
    "white": (235, 238, 237, 255), "gray": (133, 143, 150, 255),
    "grey": (133, 143, 150, 255), "brown": (137, 90, 59, 255),
    "gold": (218, 174, 63, 255), "silver": (186, 195, 201, 255),
    "cyan": (64, 203, 215, 255), "teal": (48, 159, 158, 255),
}
INK = COLORS["black"]
LIGHT = COLORS["white"]
GLASS = (100, 203, 228, 255)
WOOD = COLORS["brown"]
METAL = COLORS["silver"]

OBJECT_WORDS = {
    "robot": ("robot", "android", "droid"),
    "car": ("car", "truck", "vehicle", "bus"),
    "chair": ("chair", "stool", "seat"),
    "table": ("table", "desk"),
    "house": ("house", "home", "cottage", "building"),
    "tree": ("tree", "pine", "oak", "palm"),
    "rocket": ("rocket", "spaceship", "spacecraft"),
    "mug": ("mug", "cup", "coffee"),
    "bottle": ("bottle", "flask"),
    "sword": ("sword", "blade", "dagger"),
    "animal": ("cat", "dog", "fox", "animal", "puppy", "kitten"),
    "shape": ("sphere", "ball", "cube", "box", "cylinder", "cone", "pyramid", "torus", "donut"),
}
SUPPORTED_OBJECTS = ["robot", "car", "chair", "table", "house", "tree", "rocket", "mug", "bottle", "sword", "cat or dog", "geometric shape"]


@dataclass(frozen=True)
class Design:
    prompt: str
    kind: str
    primary: tuple[int, int, int, int]
    accent: tuple[int, int, int, int]
    low_poly: bool
    width: float
    height: float
    depth: float
    seed: int
    interpretation: str


def parse_prompt(prompt: str) -> Design:
    clean = " ".join(prompt.strip().split())
    lower = clean.lower()
    kind = next((name for name, words in OBJECT_WORDS.items()
                 if any(re.search(rf"\b{re.escape(word)}s?\b", lower) for word in words)), "abstract")
    found_colors = [COLORS[word] for word in re.findall(r"\b(?:" + "|".join(COLORS) + r")\b", lower)]
    default = {
        "robot": COLORS["blue"], "car": COLORS["red"], "chair": WOOD,
        "table": WOOD, "house": (222, 181, 130, 255), "tree": COLORS["green"],
        "rocket": LIGHT, "mug": COLORS["teal"], "bottle": COLORS["blue"],
        "sword": METAL, "animal": (215, 154, 91, 255), "shape": COLORS["cyan"],
        "abstract": COLORS["purple"],
    }[kind]
    if not found_colors and any(word in lower for word in ("wooden", "wood")):
        default = WOOD
    if not found_colors and any(word in lower for word in ("metallic", "metal", "chrome")):
        default = METAL
    primary = found_colors[0] if found_colors else default
    accent = found_colors[1] if len(found_colors) > 1 else (LIGHT if primary != LIGHT else GLASS)
    size = 0.65 if re.search(r"\b(tiny|mini|small)\b", lower) else 1.5 if re.search(r"\b(giant|huge|large|big)\b", lower) else 1.0
    width = size * (1.35 if re.search(r"\b(wide|broad)\b", lower) else 0.75 if "narrow" in lower else 1.0)
    height = size * (1.4 if re.search(r"\b(tall|high)\b", lower) else 0.72 if "short" in lower else 1.0)
    depth = size * (1.3 if "long" in lower else 1.0)
    seed = int.from_bytes(hashlib.sha256(lower.encode("utf-8")).digest()[:8], "big")
    interpretation = kind if kind != "abstract" else "abstract geometric sculpture"
    return Design(clean, kind, primary, accent, "low poly" in lower or "low-poly" in lower,
                  width, height, depth, seed, interpretation)


class Builder:
    def __init__(self, design: Design) -> None:
        self.design = design
        self.scene = trimesh.Scene()
        self.parts = 0
        self.sections = 10 if design.low_poly else 24
        self.subdivisions = 1 if design.low_poly else 2

    def add(self, mesh: trimesh.Trimesh, color: tuple[int, int, int, int], name: str) -> None:
        mesh.apply_scale([self.design.width, self.design.height, self.design.depth])
        mesh.visual.vertex_colors = np.tile(np.asarray(color, dtype=np.uint8), (len(mesh.vertices), 1))
        self.parts += 1
        self.scene.add_geometry(mesh, node_name=f"{name}-{self.parts}", geom_name=f"{name}-{self.parts}")

    def box(self, center, size, color, name="box") -> None:
        mesh = trimesh.creation.box(extents=size)
        mesh.apply_translation(center)
        self.add(mesh, color, name)

    def sphere(self, center, radius, color, name="sphere", stretch=(1, 1, 1)) -> None:
        mesh = trimesh.creation.icosphere(subdivisions=self.subdivisions, radius=radius)
        mesh.apply_scale(stretch)
        mesh.apply_translation(center)
        self.add(mesh, color, name)

    def cylinder(self, center, radius, height, color, name="cylinder", axis="y") -> None:
        mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=self.sections)
        if axis == "y":
            mesh.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0]))
        elif axis == "x":
            mesh.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
        mesh.apply_translation(center)
        self.add(mesh, color, name)

    def cone(self, base, radius, height, color, name="cone") -> None:
        mesh = trimesh.creation.cone(radius=radius, height=height, sections=self.sections)
        mesh.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0]))
        mesh.apply_translation(base)
        self.add(mesh, color, name)

    def torus(self, center, major, minor, color, name="torus", normal="y") -> None:
        rings, sides = self.sections * 2, max(8, self.sections // 2)
        vertices, faces = [], []
        for i in range(rings):
            u = 2 * math.pi * i / rings
            for j in range(sides):
                v = 2 * math.pi * j / sides
                radial = major + minor * math.cos(v)
                vertices.append([radial * math.cos(u), minor * math.sin(v), radial * math.sin(u)])
        for i in range(rings):
            for j in range(sides):
                a = i * sides + j
                b = ((i + 1) % rings) * sides + j
                c = ((i + 1) % rings) * sides + (j + 1) % sides
                d = i * sides + (j + 1) % sides
                faces.extend(((a, b, d), (b, c, d)))
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
        if normal == "z":
            mesh.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
        elif normal == "x":
            mesh.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 0, 1]))
        mesh.apply_translation(center)
        self.add(mesh, color, name)


def build_robot(b: Builder) -> None:
    p, a = b.design.primary, b.design.accent
    b.box((0, 1.28, 0), (0.92, 0.9, 0.55), p, "torso")
    b.box((0, 2.03, 0), (0.82, 0.68, 0.66), p, "head")
    b.box((0, 1.85, 0.345), (0.63, 0.19, 0.06), INK, "visor")
    for x in (-0.19, 0.19):
        b.sphere((x, 1.86, 0.39), 0.075, GLASS, "eye")
        b.cylinder((x * 3.05, 1.24, 0), 0.13, 0.62, p, "arm")
        b.sphere((x * 3.05, 0.82, 0), 0.14, a, "hand")
        b.cylinder((x * 1.25, 0.49, 0), 0.17, 0.72, p, "leg")
        b.box((x * 1.25, 0.13, 0.13), (0.36, 0.2, 0.56), INK, "foot")
    b.sphere((0, 1.32, 0.295), 0.18, a, "chest-light")
    b.cylinder((0, 2.47, 0), 0.035, 0.25, METAL, "antenna")
    b.sphere((0, 2.61, 0), 0.08, a, "antenna-tip")


def build_car(b: Builder) -> None:
    p, a = b.design.primary, b.design.accent
    b.box((0, 0.64, 0), (2.7, 0.55, 1.27), p, "body")
    b.box((-0.2, 1.06, 0), (1.38, 0.53, 1.13), p, "cabin")
    b.box((-0.2, 1.10, 0.575), (1.05, 0.32, 0.025), GLASS, "side-window")
    b.box((-0.2, 1.10, -0.575), (1.05, 0.32, 0.025), GLASS, "side-window")
    for x in (-0.84, 0.84):
        for z in (-0.65, 0.65):
            b.cylinder((x, 0.39, z), 0.31, 0.17, INK, "wheel", axis="z")
            b.cylinder((x, 0.39, z + (0.09 if z > 0 else -0.09)), 0.13, 0.02, METAL, "hub", axis="z")
    for z in (-0.41, 0.41):
        b.box((1.37, 0.71, z), (0.055, 0.16, 0.2), a, "headlight")
    b.box((-1.37, 0.64, 0), (0.045, 0.2, 0.9), INK, "rear-bumper")


def build_chair(b: Builder) -> None:
    p = b.design.primary
    b.box((0, 0.93, 0), (1.15, 0.18, 1.04), p, "seat")
    b.box((0, 1.61, -0.43), (1.15, 1.35, 0.18), p, "back")
    for x in (-0.43, 0.43):
        for z in (-0.37, 0.37):
            b.box((x, 0.46, z), (0.16, 0.88, 0.16), p, "leg")
    if "arm" in b.design.prompt.lower():
        for x in (-0.56, 0.56):
            b.box((x, 1.24, 0), (0.1, 0.1, 0.9), b.design.accent, "armrest")


def build_table(b: Builder) -> None:
    p = b.design.primary
    b.box((0, 1.2, 0), (2.35, 0.19, 1.32), p, "top")
    for x in (-0.98, 0.98):
        for z in (-0.48, 0.48):
            b.box((x, 0.58, z), (0.16, 1.16, 0.16), p, "leg")
    if "desk" in b.design.prompt.lower():
        b.box((0, 0.93, 0.50), (0.92, 0.31, 0.16), b.design.accent, "drawer")


def build_house(b: Builder) -> None:
    p, a = b.design.primary, b.design.accent
    b.box((0, 0.95, 0), (2.2, 1.9, 1.65), p, "walls")
    # A pitched roof made from a watertight triangular prism.
    verts = [[-1.23, 1.9, -0.99], [1.23, 1.9, -0.99], [0, 2.7, -0.99],
             [-1.23, 1.9, 0.99], [1.23, 1.9, 0.99], [0, 2.7, 0.99]]
    faces = [[0, 2, 1], [3, 4, 5], [0, 1, 4], [0, 4, 3], [1, 2, 5],
             [1, 5, 4], [2, 0, 3], [2, 3, 5]]
    b.add(trimesh.Trimesh(vertices=verts, faces=faces), a, "roof")
    b.box((0, 0.65, 0.84), (0.47, 1.25, 0.045), WOOD, "door")
    b.sphere((0.15, 0.63, 0.89), 0.04, COLORS["gold"], "door-knob")
    for x in (-0.75, 0.75):
        b.box((x, 1.24, 0.85), (0.42, 0.47, 0.04), GLASS, "window")
        b.box((x, 1.24, 0.89), (0.04, 0.47, 0.03), LIGHT, "window-frame")
    if "chimney" in b.design.prompt.lower():
        b.box((0.75, 2.56, -0.32), (0.25, 0.67, 0.25), WOOD, "chimney")


def build_tree(b: Builder) -> None:
    lower = b.design.prompt.lower()
    b.cylinder((0, 0.94, 0), 0.21, 1.88, WOOD, "trunk")
    if "pine" in lower or "christmas" in lower:
        for y, radius, height in ((0.95, 0.97, 1.16), (1.48, 0.76, 1.09), (2.03, 0.52, 0.92)):
            b.cone((0, y, 0), radius, height, b.design.primary, "needles")
    else:
        for center, radius in (((0, 2.13, 0), 0.92), ((-0.54, 1.89, 0), 0.62),
                               ((0.51, 1.93, 0.08), 0.64), ((0, 2.37, -0.36), 0.61)):
            b.sphere(center, radius, b.design.primary, "foliage")
    if "apple" in lower or "fruit" in lower:
        for center in ((-0.52, 1.93, 0.42), (0.53, 2.15, 0.44), (0.13, 2.63, 0.33)):
            b.sphere(center, 0.12, COLORS["red"], "fruit")


def build_rocket(b: Builder) -> None:
    p, a = b.design.primary, b.design.accent
    b.cylinder((0, 1.27, 0), 0.48, 1.85, p, "body")
    b.cone((0, 2.2, 0), 0.48, 0.73, a, "nose")
    b.cylinder((0, 0.24, 0), 0.31, 0.37, INK, "engine")
    for z in (-0.48, 0.48):
        b.box((0, 0.52, z), (0.15, 0.72, 0.65), a, "fin")
    for x in (-0.48, 0.48):
        b.box((x, 0.52, 0), (0.65, 0.72, 0.15), a, "fin")
    b.sphere((0, 1.65, 0.48), 0.22, GLASS, "porthole")


def build_mug(b: Builder) -> None:
    p = b.design.primary
    b.cylinder((0, 0.61, 0), 0.49, 1.17, p, "cup")
    b.cylinder((0, 1.205, 0), 0.39, 0.015, INK if "coffee" in b.design.prompt.lower() else b.design.accent, "inside")
    b.torus((0.57, 0.75, 0), 0.36, 0.10, p, "handle", normal="z")
    b.cylinder((0, 0.035, 0), 0.5, 0.07, p, "base")


def build_bottle(b: Builder) -> None:
    p = b.design.primary
    b.cylinder((0, 0.74, 0), 0.39, 1.45, p, "body")
    b.cylinder((0, 1.64, 0), 0.19, 0.42, p, "neck")
    b.cylinder((0, 1.89, 0), 0.23, 0.16, b.design.accent, "cap")
    b.cylinder((0, 0.92, 0), 0.405, 0.45, b.design.accent, "label")


def build_sword(b: Builder) -> None:
    p, a = b.design.primary, b.design.accent
    b.cylinder((0, 0.42, 0), 0.11, 0.7, WOOD, "grip")
    b.sphere((0, 0.07, 0), 0.15, a, "pommel")
    b.box((0, 0.85, 0), (0.87, 0.15, 0.2), a, "guard")
    b.box((0, 1.66, 0), (0.29, 1.54, 0.09), p, "blade")
    b.cone((0, 2.42, 0), 0.15, 0.33, p, "tip")


def build_animal(b: Builder) -> None:
    p, a = b.design.primary, b.design.accent
    lower = b.design.prompt.lower()
    b.sphere((0, 0.97, 0), 0.62, p, "body", stretch=(1.5, 0.75, 0.8))
    b.sphere((0.83, 1.35, 0), 0.42, p, "head")
    for z in (-0.4, 0.4):
        for x in (-0.57, 0.57):
            b.cylinder((x, 0.38, z), 0.12, 0.71, p, "leg")
        b.cone((0.69, 1.65, z * 0.62), 0.18, 0.36, p, "ear")
        b.sphere((1.15, 1.41, z * 0.52), 0.055, INK, "eye")
    b.sphere((1.22, 1.2, 0), 0.095, INK, "nose")
    if "cat" in lower or "fox" in lower or "kitten" in lower:
        b.cylinder((-1.05, 1.35, 0), 0.085, 0.78, p, "tail", axis="x")
    else:
        b.sphere((-1.1, 1.05, 0), 0.18, a, "tail")


def build_shape(b: Builder) -> None:
    lower = b.design.prompt.lower()
    p = b.design.primary
    if "sphere" in lower or "ball" in lower:
        b.sphere((0, 1.0, 0), 1.0, p, "sphere")
    elif "cylinder" in lower:
        b.cylinder((0, 1.0, 0), 0.78, 2.0, p)
    elif "cone" in lower or "pyramid" in lower:
        if "pyramid" in lower:
            b.sections = 4
        b.cone((0, 0, 0), 1.0, 2.0, p)
    elif "torus" in lower or "donut" in lower:
        b.torus((0, 1.0, 0), 0.78, 0.25, p, normal="z")
    else:
        b.box((0, 1.0, 0), (1.8, 1.8, 1.8), p)


def build_abstract(b: Builder) -> None:
    rng = random.Random(b.design.seed)
    colors = (b.design.primary, b.design.accent, METAL)
    b.cylinder((0, 0.08, 0), 0.82, 0.16, INK, "plinth")
    for index in range(5):
        angle = index * 2.4
        x = 0.42 * math.cos(angle)
        z = 0.42 * math.sin(angle)
        y = 0.53 + index * 0.35
        color = colors[index % len(colors)]
        if index % 3 == 0:
            b.box((x, y, z), (rng.uniform(0.35, 0.65), 0.48, 0.5), color, "abstract-box")
        elif index % 3 == 1:
            b.sphere((x, y, z), rng.uniform(0.25, 0.42), color, "abstract-sphere")
        else:
            b.cone((x, y - 0.25, z), 0.35, 0.6, color, "abstract-cone")


BUILDERS = {
    "robot": build_robot, "car": build_car, "chair": build_chair,
    "table": build_table, "house": build_house, "tree": build_tree,
    "rocket": build_rocket, "mug": build_mug, "bottle": build_bottle,
    "sword": build_sword, "animal": build_animal, "shape": build_shape,
    "abstract": build_abstract,
}


def generate_model(prompt: str) -> tuple[Design, bytes, bytes, int]:
    design = parse_prompt(prompt)
    builder = Builder(design)
    BUILDERS[design.kind](builder)
    meshes = list(builder.scene.geometry.values())
    if not meshes:
        raise ValueError("No geometry was generated.")
    glb = builder.scene.export(file_type="glb")
    stl = trimesh.util.concatenate(meshes).export(file_type="stl")
    return design, glb, stl, sum(len(mesh.faces) for mesh in meshes)

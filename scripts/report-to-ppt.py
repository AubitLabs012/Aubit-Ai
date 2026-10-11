from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "AUBIT_OUTLINE_PROJECT_REPORT.pptx"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

BG = RGBColor(248, 244, 238)
INK = RGBColor(30, 37, 36)
MUTED = RGBColor(91, 98, 94)
GREEN = RGBColor(31, 130, 83)
GOLD = RGBColor(214, 162, 70)
PANEL = RGBColor(255, 255, 255)


def asset(*parts):
    path = ROOT.joinpath(*parts)
    return path if path.exists() else None


ASSETS = {
    "hero": asset("images", "HomeSectionFocus.jpeg"),
    "character": asset("images", "Aubit-Green.png"),
    "widget": asset("images", "Aubit-Desktop-Widget-Shell.png"),
    "game": asset("images", "GameHubSection.jpeg"),
    "customize": asset("images", "CustomizeSection.jpeg"),
    "icon": asset("build", "icon.png"),
    "study": asset("src", "assets", "study-icon.png"),
}


def set_bg(slide, color=BG):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_rect(slide, x, y, w, h, color=PANEL, transparency=0, radius=True):
    shape = slide.shapes.add_shape(
        MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE if radius else MSO_AUTO_SHAPE_TYPE.RECTANGLE,
        x,
        y,
        w,
        h,
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.fill.transparency = transparency
    shape.line.color.rgb = RGBColor(226, 220, 209)
    return shape


def add_title(slide, title, subtitle=None, dark=False):
    color = RGBColor(255, 255, 255) if dark else INK
    box = slide.shapes.add_textbox(Inches(0.65), Inches(0.45), Inches(8.6), Inches(0.6))
    frame = box.text_frame
    frame.clear()
    p = frame.paragraphs[0]
    p.text = title
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = color
    if subtitle:
        sub = slide.shapes.add_textbox(Inches(0.68), Inches(1.05), Inches(8.9), Inches(0.35))
        sf = sub.text_frame
        sf.clear()
        sp = sf.paragraphs[0]
        sp.text = subtitle
        sp.font.size = Pt(13)
        sp.font.color.rgb = RGBColor(235, 239, 232) if dark else MUTED


def add_bullets(slide, bullets, x=0.8, y=1.55, w=6.3, h=4.9, font_size=18, color=INK):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = box.text_frame
    frame.clear()
    frame.word_wrap = True
    for idx, item in enumerate(bullets):
        p = frame.paragraphs[0] if idx == 0 else frame.add_paragraph()
        p.text = item
        p.level = 0
        p.font.size = Pt(font_size)
        p.font.color.rgb = color
        p.space_after = Pt(8)
    return box


def add_image(slide, path, x, y, w=None, h=None):
    if not path:
        return None
    return slide.shapes.add_picture(str(path), Inches(x), Inches(y), width=Inches(w) if w else None, height=Inches(h) if h else None)


def add_footer(slide, index):
    line = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, Inches(0.65), Inches(7.02), Inches(12.05), Inches(0.02))
    line.fill.solid()
    line.fill.fore_color.rgb = RGBColor(218, 212, 201)
    line.line.fill.background()
    box = slide.shapes.add_textbox(Inches(0.65), Inches(7.08), Inches(11.8), Inches(0.25))
    p = box.text_frame.paragraphs[0]
    p.text = f"Aubit AI Desktop Assistant | {index}"
    p.font.size = Pt(9)
    p.font.color.rgb = MUTED
    p.alignment = PP_ALIGN.RIGHT


def cover(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, RGBColor(20, 36, 31))
    add_image(slide, ASSETS["hero"], 0, 0, 13.333, 7.5)
    overlay = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    overlay.fill.solid()
    overlay.fill.fore_color.rgb = RGBColor(9, 22, 19)
    overlay.fill.transparency = 18
    overlay.line.fill.background()
    add_title(slide, "Aubit AI Desktop Assistant", "Project Presentation", dark=True)
    box = slide.shapes.add_textbox(Inches(0.72), Inches(5.7), Inches(6.4), Inches(0.9))
    p = box.text_frame.paragraphs[0]
    p.text = "An interactive desktop companion for AI support, learning, games, customization, and widget access."
    p.font.size = Pt(21)
    p.font.color.rgb = RGBColor(255, 255, 255)
    p.font.bold = True
    add_image(slide, ASSETS["icon"], 11.3, 0.42, 0.72, 0.72)
    return slide


def simple_slide(prs, title, subtitle, bullets, visual=None, index=1):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide)
    add_title(slide, title, subtitle)
    add_rect(slide, Inches(0.62), Inches(1.45), Inches(6.65), Inches(5.2), PANEL)
    add_bullets(slide, bullets)
    if visual:
        add_rect(slide, Inches(7.65), Inches(1.45), Inches(4.9), Inches(5.2), RGBColor(238, 243, 236))
        add_image(slide, visual, 7.9, 1.72, 4.4, 4.65)
    else:
        add_rect(slide, Inches(7.65), Inches(1.45), Inches(4.9), Inches(5.2), RGBColor(236, 244, 239))
    add_footer(slide, index)


def table_slide(prs, title, subtitle, rows, index):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide)
    add_title(slide, title, subtitle)
    table = slide.shapes.add_table(len(rows) + 1, 2, Inches(0.72), Inches(1.55), Inches(11.9), Inches(4.95)).table
    table.columns[0].width = Inches(3.35)
    table.columns[1].width = Inches(8.55)
    headers = ["Item", "Purpose / Result"]
    for col, text in enumerate(headers):
        cell = table.cell(0, col)
        cell.text = text
        cell.fill.solid()
        cell.fill.fore_color.rgb = GREEN
        for p in cell.text_frame.paragraphs:
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = RGBColor(255, 255, 255)
    for r, row in enumerate(rows, start=1):
        for c, text in enumerate(row):
            cell = table.cell(r, c)
            cell.text = text
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(255, 255, 255) if r % 2 else RGBColor(242, 247, 243)
            for p in cell.text_frame.paragraphs:
                p.font.size = Pt(10.5)
                p.font.color.rgb = INK
    add_footer(slide, index)


def architecture_slide(prs, index):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide)
    add_title(slide, "6. Proposed Model", "Layered desktop assistant architecture")
    layers = [
        ("User Interface Layer", "HTML, CSS, JavaScript, images, games"),
        ("Voice Assistant Layer", "Electron windows, widget, tray, preload bridge, commands"),
        ("Backend API Layer", "FastAPI routes, auth, AI, games, health"),
        ("External Services", "Groq, OpenAI, Gemini, MongoDB, Redis, Firebase"),
    ]
    y = 1.55
    colors = [RGBColor(235, 248, 241), RGBColor(255, 246, 225), RGBColor(237, 243, 255), RGBColor(249, 238, 243)]
    for i, (name, desc) in enumerate(layers):
        add_rect(slide, Inches(1.0), Inches(y), Inches(11.25), Inches(0.85), colors[i])
        box = slide.shapes.add_textbox(Inches(1.32), Inches(y + 0.13), Inches(10.6), Inches(0.45))
        p = box.text_frame.paragraphs[0]
        p.text = f"{name}: {desc}"
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = INK
        y += 1.05
    add_bullets(
        slide,
        [
            "Frontend handles the user experience.",
            "Electron converts it into a desktop application.",
            "FastAPI provides structured backend operations.",
            "External integrations can be added without rewriting the core app.",
        ],
        x=1.1,
        y=5.85,
        w=10.7,
        h=0.8,
        font_size=14,
    )
    add_footer(slide, index)


def workflow_slide(prs, index):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide)
    add_title(slide, "8. System Workflow", "From desktop launch to assistant response")
    steps = [
        "Launch Aubit Desktop",
        "Electron loads app and checks backend",
        "User logs in, signs up, or enters guest mode",
        "Frontend opens immersive Aubit experience",
        "User selects study, games, customization, or widget",
        "Backend returns AI, game, auth, or health response",
    ]
    x_positions = [0.75, 4.75, 8.75, 0.75, 4.75, 8.75]
    y_positions = [1.55, 1.55, 1.55, 4.15, 4.15, 4.15]
    for idx, step in enumerate(steps):
        add_rect(slide, Inches(x_positions[idx]), Inches(y_positions[idx]), Inches(3.35), Inches(1.25), RGBColor(255, 255, 255))
        badge = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.OVAL, Inches(x_positions[idx] + 0.16), Inches(y_positions[idx] + 0.18), Inches(0.48), Inches(0.48))
        badge.fill.solid()
        badge.fill.fore_color.rgb = GREEN
        badge.line.fill.background()
        p = badge.text_frame.paragraphs[0]
        p.text = str(idx + 1)
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = RGBColor(255, 255, 255)
        p.alignment = PP_ALIGN.CENTER
        box = slide.shapes.add_textbox(Inches(x_positions[idx] + 0.78), Inches(y_positions[idx] + 0.22), Inches(2.25), Inches(0.78))
        bp = box.text_frame.paragraphs[0]
        bp.text = step
        bp.font.size = Pt(15)
        bp.font.bold = True
        bp.font.color.rgb = INK
    add_footer(slide, index)


def conclusion_slide(prs, index):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, RGBColor(21, 43, 36))
    add_title(slide, "10. Conclusion", "A useful, playful, and extensible AI desktop companion", dark=True)
    add_bullets(
        slide,
        [
            "Aubit combines AI support, study tools, games, customization, and widget access.",
            "Electron + FastAPI provides a flexible desktop and backend architecture.",
            "The project can run locally and can be packaged as a Windows installer.",
            "Future scope includes memory, cloud sync, richer voice features, and advanced automation.",
        ],
        x=0.9,
        y=1.65,
        w=7.1,
        h=4.1,
        font_size=20,
        color=RGBColor(255, 255, 255),
    )
    add_image(slide, ASSETS["character"], 8.25, 1.1, 3.7, 5.9)
    add_footer(slide, index)


def main():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    cover(prs)
    simple_slide(
        prs,
        "1. Title of the Project",
        "Aubit AI Desktop Assistant",
        [
            "Desktop companion application with local backend support.",
            "Domain: AI, desktop apps, educational technology, gamified productivity.",
            "Built using Electron, HTML, CSS, JavaScript, Python, FastAPI, and Uvicorn.",
            "Designed for students, learners, creators, and general computer users.",
        ],
        ASSETS["character"],
        2,
    )
    simple_slide(
        prs,
        "2. Introduction",
        "A unified assistant experience",
        [
            "Combines learning, entertainment, productivity, and assistant-style help.",
            "Electron gives the project a native Windows desktop experience.",
            "FastAPI provides structured backend routes for users, AI, games, assets, and health.",
            "The interface includes a companion, entry animations, study tools, games, and customization.",
        ],
        ASSETS["hero"],
        3,
    )
    table_slide(
        prs,
        "3. Technologies and Tools Used",
        "Main tools and their responsibilities",
        [
            ("Electron", "Desktop shell, windows, widget mode, tray, and packaging."),
            ("HTML / CSS / JavaScript", "Frontend structure, styling, animation, and interactivity."),
            ("Python / FastAPI / Uvicorn", "Backend service, routes, validation, and local API server."),
            ("AI Integrations", "Groq, OpenAI, and Gemini support for live assistant responses."),
            ("Electron Builder", "Creates the Windows installer and unpacked desktop build."),
        ],
        4,
    )
    simple_slide(
        prs,
        "4. Problem Statement",
        "Why Aubit is needed",
        [
            "Many assistants are plain chat windows or simple command utilities.",
            "Users need a more personal, visual, and motivating desktop companion.",
            "Learning, games, customization, and AI support are usually separated.",
            "Aubit brings these features into one accessible desktop application.",
        ],
        ASSETS["widget"],
        5,
    )
    simple_slide(
        prs,
        "5. Literature Survey",
        "Related systems and gaps",
        [
            "Voice assistants are useful but focus mostly on commands and ecosystem services.",
            "AI chat platforms are powerful but usually browser or chat-window based.",
            "Education platforms support learning but often lack a playful desktop identity.",
            "Virtual companions are engaging but often lack serious AI and backend features.",
        ],
        ASSETS["study"],
        6,
    )
    architecture_slide(prs, 7)
    simple_slide(
        prs,
        "7. Key Features",
        "Core product capabilities",
        [
            "Immersive home interface with Aubit/Aubira character identity.",
            "Login, sign up, guest entry, and backend health monitoring.",
            "Study board, AI response support, and speech integration points.",
            "Game hub with Sudoku, Chess, Monopoly, Maze, Red Bounce, and Snake and Ladder.",
            "Customization system and compact desktop widget mode.",
        ],
        ASSETS["customize"],
        8,
    )
    workflow_slide(prs, 9)
    table_slide(
        prs,
        "9. Results",
        "Verification summary",
        [
            ("Frontend syntax check", "Passed"),
            ("Backend Python compile", "Passed"),
            ("Backend startup script", "Passed"),
            ("Health endpoint", "Healthy"),
            ("AI / STT / TTS", "Configured and ready"),
            ("Windows installer build", "Successful"),
        ],
        10,
    )
    simple_slide(
        prs,
        "Future Scope",
        "Next improvements",
        [
            "Add stronger automated testing and production hardening.",
            "Introduce persistent memory and cloud synchronization.",
            "Improve voice conversations and assistant automation.",
            "Expand study tools, game progress, and user personalization.",
        ],
        ASSETS["game"],
        11,
    )
    conclusion_slide(prs, 12)

    prs.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()

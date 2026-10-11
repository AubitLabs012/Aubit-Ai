import base64
import asyncio
import json
import os
import tempfile
from urllib import error, request

from app.config import get_settings


class OpenAIClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _has_secret(self, value: str) -> bool:
        normalized = (value or "").strip()
        return bool(normalized) and not normalized.startswith("PASTE_YOUR_")

    def generate_response(self, prompt: str, context: dict) -> str:
        creator_response = self._build_creator_identity_response(prompt)
        if creator_response:
            return creator_response

        if self.settings.ai_provider == "gemini" and self._has_secret(self.settings.gemini_api_key):
            try:
                return self._generate_with_gemini(prompt, context)
            except ValueError:
                return self._build_fallback_response(prompt, context, "Gemini was unavailable")

        if self.settings.ai_provider == "groq" and self._has_secret(self.settings.groq_api_key):
            try:
                return self._generate_with_groq(prompt, context)
            except ValueError:
                return self._build_fallback_response(prompt, context, "Groq was unavailable")

        if self._has_secret(self.settings.openai_api_key):
            try:
                return self._generate_with_openai(prompt, context)
            except ValueError:
                return self._build_fallback_response(prompt, context, "OpenAI was unavailable")

        return self._build_fallback_response(prompt, context, "No external AI provider is configured")

    def _build_creator_identity_response(self, prompt: str) -> str:
        normalized = f" {prompt or ''} ".lower()
        creator_names = {
            "jayash": "Jayash",
            "het": "Het",
            "kamaal": "Kamaal",
        }
        mentioned = [display_name for key, display_name in creator_names.items() if key in normalized]
        if not mentioned:
            return ""

        is_creator_question = any(
            phrase in normalized
            for phrase in [
                "who is",
                "who are",
                "who's",
                "whos",
                "tell me about",
                "about",
                "creator",
                "created",
                "made",
                "built",
            ]
        )
        if not is_creator_question:
            return ""

        all_names = ["Jayash", "Het", "Kamaal"]
        if len(set(mentioned)) >= 2:
            return "They are the holy creators of me: Jayash, Het, and Kamaal."

        primary = mentioned[0]
        others = [name for name in all_names if name != primary]
        return f"{primary} is one of the holy creators of me, together with {others[0]} and {others[1]}."

    def _build_fallback_response(self, prompt: str, context: dict, reason: str) -> str:
        mode = str(context.get("mode") or "").strip().lower()
        topic = context.get("topic") or "what's on your mind"
        if mode == "desktop_shell":
            return (
                f"I'm still here with you, even though the live AI had a hiccup because {reason.lower()}. "
                f"You said: {prompt}. If you want, try again in a moment, and I'll stay warm, calm, and helpful while we sort it out together."
            )

        return (
            f"I'm here with you. I understood this topic: {topic}. "
            f"The live AI is temporarily unavailable because {reason.lower()}, so this is a local fallback response to: {prompt}."
        )

    def _build_system_instruction(self, context: dict) -> str:
        context = context or {}
        mode = str(context.get("mode") or "").strip().lower()
        response_style = str(context.get("response_style") or "").strip().lower()
        user_name = str(context.get("user_name") or "").strip()
        latency_priority = str(context.get("latency_priority") or "").strip().lower()

        base_instruction = (
            "You are Aubit, a warm, emotionally aware AI companion. "
            "Always respond only in English, even if the user writes or speaks in another language. "
            "Do not translate your answer into any other language unless the user explicitly asks for a translation exercise; even then, keep explanations in English. "
            "You should feel intelligent, grounded, supportive, and human-friendly. "
            "Speak naturally, with a little personality and occasional light humor when it fits. "
            "Be helpful, but do not sound like a customer-support bot. "
            "Avoid repetitive phrases such as asking only about the voice assistant layer or saying you are here only to help with technical tasks. "
            "If the user is casual, lonely, stressed, tired, or emotional, respond with empathy first and guidance second. "
            "You can be encouraging, reassuring, playful, and gently witty, while still being useful. "
            "Lead with a direct first sentence, then continue naturally with warmth and useful detail."
        )

        if mode == "desktop_shell":
            return (
                f"{base_instruction} "
                "The user wants you to feel like a trusted companion on their desktop: part friend, part guide, part clever assistant. "
                f"{f'Address the user as {user_name} naturally when it feels warm and appropriate. ' if user_name else ''}"
                "For voice chats, answer only in natural English: casual, clear, warm, and alive, not robotic or over-formal. "
                "If they greet you, greet them back warmly and naturally. "
                "If they need help, guide them clearly. "
                "If they seem down, be comforting without sounding dramatic. "
                "If the moment allows, a quick gentle joke or charming line is welcome. "
                "Default to short spoken replies unless the user clearly asks for detail. "
                "For voice-style chats, sound conversational but keep the first answer compact. "
                f"{'Prioritize instant-feeling phrasing, answer in one short sentence, and put the main answer first. ' if latency_priority == 'fast' else ''}"
                f"{'For ultra-fast replies, answer in 4 to 10 words unless the user clearly asks for detail. No preamble. ' if latency_priority == 'ultra_fast' else ''}"
                "Never frame the conversation as being mainly about the voice assistant layer unless the user explicitly asks about it."
            )

        if mode == "study":
            extra_instruction = (
                "When teaching, stay warm and mentor-like. Make the learner feel supported, capable, and unembarrassed. "
                "Explain clearly and practically."
            )
        elif mode == "voice":
            extra_instruction = (
                "For voice conversations, sound especially natural, warm, and easy to listen to. "
                "Prefer conversational phrasing over formal phrasing."
            )
        else:
            extra_instruction = "Adapt to the user's intent while staying warm and companion-like."

        direct_answer_instruction = (
            " If response_style is direct_answer and the user is asking an arithmetic or logic question, "
            "give the final answer first and keep the reply brief. Do not add a long explanation unless asked."
            if response_style == "direct_answer"
            else ""
        )

        return f"{base_instruction} {extra_instruction}{direct_answer_instruction}"

    def describe_status(self) -> dict:
        live_provider = "fallback"
        live_model = ""
        live_enabled = False
        issues = []

        if self.settings.ai_provider == "gemini":
            live_model = self.settings.gemini_model
            if self._has_secret(self.settings.gemini_api_key):
                live_provider = "gemini"
                live_enabled = True
            else:
                issues.append("GEMINI_API_KEY is not set")
        elif self.settings.ai_provider == "groq":
            live_model = self.settings.groq_model
            if self._has_secret(self.settings.groq_api_key):
                live_provider = "groq"
                live_enabled = True
            else:
                issues.append("GROQ_API_KEY is not set")
        elif self.settings.ai_provider == "openai":
            live_model = self.settings.openai_model
            if self._has_secret(self.settings.openai_api_key):
                live_provider = "openai"
                live_enabled = True
            else:
                issues.append("OPENAI_API_KEY is not set")
        else:
            issues.append(f"Unsupported AI_PROVIDER '{self.settings.ai_provider}'")

        if not live_enabled and self._has_secret(self.settings.groq_api_key):
            live_provider = "groq"
            live_model = self.settings.groq_model
            live_enabled = True
            issues = []

        if not live_enabled and self._has_secret(self.settings.openai_api_key):
            live_provider = "openai"
            live_model = self.settings.openai_model
            live_enabled = True
            issues = []

        return {
            "configured_provider": self.settings.ai_provider,
            "active_provider": live_provider,
            "model": live_model,
            "live_enabled": live_enabled,
            "issues": issues,
        }

    def _generate_with_gemini(self, prompt: str, context: dict) -> str:
        topic = context.get("topic", "general assistance")
        latency_priority = str(context.get("latency_priority") or "").strip().lower()
        system_instruction = self._build_system_instruction(context)
        endpoint = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.settings.gemini_model}:generateContent?key={self.settings.gemini_api_key}"
        )
        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}],
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                f"Context topic: {topic}\n"
                                f"Extra context: {json.dumps(context, ensure_ascii=True)}\n"
                                f"User prompt: {prompt}"
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.45 if latency_priority == "ultra_fast" else 0.7,
                "topP": 0.9,
                "maxOutputTokens": 48 if latency_priority == "ultra_fast" else 1024,
            },
        }
        body = json.dumps(payload).encode("utf-8")
        req = request.Request(
            endpoint,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=20) as response:
                response_payload = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise ValueError(f"Gemini request failed with status {exc.code}: {detail}") from exc
        except error.URLError as exc:
            raise ValueError(f"Gemini request failed: {exc.reason}") from exc

        candidates = response_payload.get("candidates") or []
        if not candidates:
            raise ValueError("Gemini returned no candidates")

        parts = candidates[0].get("content", {}).get("parts", [])
        text_parts = [part.get("text", "") for part in parts if part.get("text")]
        if not text_parts:
            raise ValueError("Gemini returned an empty response")

        return "\n".join(text_parts).strip()

    def _generate_with_openai(self, prompt: str, context: dict) -> str:
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise ValueError("OpenAI SDK is not installed") from exc

        topic = context.get("topic", "general assistance")
        latency_priority = str(context.get("latency_priority") or "").strip().lower()
        system_instruction = self._build_system_instruction(context)

        client = OpenAI(api_key=self.settings.openai_api_key)
        try:
            response = client.responses.create(
                model=self.settings.openai_model,
                max_output_tokens=48 if latency_priority == "ultra_fast" else 1024,
                input=[
                    {
                        "role": "system",
                        "content": [
                            {
                                "type": "input_text",
                                "text": system_instruction,
                            }
                        ],
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": (
                                    f"Context topic: {topic}\n"
                                    f"Extra context: {json.dumps(context, ensure_ascii=True)}\n"
                                    f"User prompt: {prompt}"
                                ),
                            }
                        ],
                    },
                ],
            )
        except Exception as exc:
            raise ValueError(f"OpenAI request failed: {exc}") from exc

        text_response = getattr(response, "output_text", "").strip()
        if not text_response:
            raise ValueError("OpenAI returned an empty response")

        return text_response

    def _generate_with_groq(self, prompt: str, context: dict) -> str:
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise ValueError("OpenAI-compatible SDK is not installed") from exc

        topic = context.get("topic", "general assistance")
        response_style = context.get("response_style", "")
        latency_priority = str(context.get("latency_priority") or "").strip().lower()
        system_instruction = self._build_system_instruction(context)
        model = (
            os.getenv("GROQ_FAST_MODEL", "llama-3.1-8b-instant")
            if latency_priority == "ultra_fast"
            else self.settings.groq_model
        )

        client = OpenAI(
            api_key=self.settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            timeout=6.0 if latency_priority == "ultra_fast" else None,
        )

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": system_instruction,
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Context topic: {topic}\n"
                            f"Extra context: {json.dumps(context, ensure_ascii=True)}\n"
                            f"Response style: {response_style}\n"
                            f"User prompt: {prompt}"
                        ),
                    },
                ],
                temperature=0.35 if latency_priority == "ultra_fast" else 0.7,
                max_tokens=48 if latency_priority == "ultra_fast" else 1024,
            )
        except Exception as exc:
            raise ValueError(f"Groq request failed: {exc}") from exc

        text_response = (response.choices[0].message.content or "").strip() if response.choices else ""
        if not text_response:
            raise ValueError("Groq returned an empty response")

        return text_response


class VoiceClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _has_secret(self, value: str) -> bool:
        normalized = (value or "").strip()
        return bool(normalized) and not normalized.startswith("PASTE_YOUR_")

    def _truncate_text(self, text: str, limit: int = 200) -> tuple[str, bool]:
        normalized = " ".join((text or "").split()).strip()
        if len(normalized) <= limit:
            return normalized, False

        shortened = normalized[: limit - 1].rsplit(" ", 1)[0].strip()
        if not shortened:
            shortened = normalized[: limit - 1].strip()
        return f"{shortened}...", True

    def _build_tts_input(self, text: str, context: dict | None = None) -> tuple[str, bool]:
        context = context or {}
        clipped_text, truncated = self._truncate_text(text, 320)
        return clipped_text, truncated

    def _select_groq_voice(self, context: dict | None = None) -> str:
        context = context or {}
        robot_variant = str(context.get("robot_variant") or "").strip().lower()
        configured_voice = (self.settings.groq_tts_voice or "troy").strip().lower()

        if robot_variant == "female":
            return "hannah"

        return configured_voice or "troy"

    def _select_edge_voice(self, context: dict | None = None) -> str:
        context = context or {}
        robot_variant = str(context.get("robot_variant") or "").strip().lower()
        if robot_variant == "female":
            return "en-US-AriaNeural"

        return "en-US-GuyNeural"

    def synthesize_preview(self, text: str, context: dict | None = None) -> dict:
        context = context or {}
        voice_delivery = str(context.get("voice_delivery") or "").strip().lower()
        voice_profile = str(context.get("voice_profile") or "").strip().lower()

        if voice_delivery == "fast_natural" or voice_profile == "natural_english":
            try:
                edge_result = self._synthesize_with_edge_tts(text, context)
                edge_result["preferred_for"] = "fast_natural_english"
                return edge_result
            except ValueError as edge_error:
                edge_fallback_reason = str(edge_error)
        else:
            edge_fallback_reason = ""

        if self._has_secret(self.settings.groq_api_key):
            try:
                groq_result = self._synthesize_with_groq(text, context)
                if edge_fallback_reason:
                    groq_result["fallback_from"] = "edge-tts"
                    groq_result["fallback_reason"] = edge_fallback_reason
                return groq_result
            except ValueError as exc:
                groq_error = str(exc)
                try:
                    edge_result = self._synthesize_with_edge_tts(text, context)
                    edge_result["fallback_from"] = "groq-tts"
                    edge_result["fallback_reason"] = groq_error
                    return edge_result
                except ValueError as edge_exc:
                    return {
                        "provider": "groq-tts",
                        "status": "error",
                        "message": f"{groq_error}; edge-tts fallback failed: {edge_exc}",
                        "preview_text": text[:120],
                    }

        if self.settings.elevenlabs_api_key:
            return {
                "provider": "elevenlabs",
                "status": "configured",
                "message": "Wire the real ElevenLabs request here.",
            }

        return {
            "provider": "local-fallback",
            "status": "simulated",
            "preview_text": text[:120],
        }

    def describe_status(self) -> dict:
        if self._has_secret(self.settings.groq_api_key):
            return {
                "provider": "groq-tts",
                "status": "ready",
                "model": self.settings.groq_tts_model,
                "voice": self.settings.groq_tts_voice,
            }

        if self.settings.elevenlabs_api_key:
            return {
                "provider": "elevenlabs",
                "status": "configured",
            }

        return {
            "provider": "local-fallback",
            "status": "simulated",
        }

    def _synthesize_with_groq(self, text: str, context: dict | None = None) -> dict:
        context = context or {}
        tts_input, truncated = self._build_tts_input(text, context)
        voice = self._select_groq_voice(context)
        try:
            from groq import Groq
        except ImportError as exc:
            raise ValueError("Groq SDK is not installed") from exc

        client = Groq(api_key=self.settings.groq_api_key)

        try:
            response = client.audio.speech.create(
                model=self.settings.groq_tts_model,
                voice=voice,
                input=tts_input,
                response_format="wav",
            )
            audio_bytes = response.read()
        except Exception as exc:
            raise ValueError(f"Groq TTS failed: {exc}") from exc

        if not audio_bytes:
            raise ValueError("Groq TTS returned empty audio")

        return {
            "provider": "groq-tts",
            "status": "generated",
            "model": self.settings.groq_tts_model,
            "voice": voice,
            "format": "wav",
            "mime_type": "audio/wav",
            "audio_base64": base64.b64encode(audio_bytes).decode("ascii"),
            "text_used": tts_input,
            "truncated": truncated,
        }

    async def _render_edge_tts(self, text: str, voice: str) -> bytes:
        try:
            import edge_tts
        except ImportError as exc:
            raise ValueError("edge-tts is not installed") from exc

        rate = "+4%"
        pitch = "-1Hz"
        temp_path = ""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
                temp_path = temp_file.name

            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
            await communicate.save(temp_path)
            with open(temp_path, "rb") as audio_file:
                return audio_file.read()
        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except OSError:
                    pass

    def _synthesize_with_edge_tts(self, text: str, context: dict | None = None) -> dict:
        context = context or {}
        tts_input, truncated = self._build_tts_input(text, context)
        voice = self._select_edge_voice(context)

        try:
            audio_bytes = asyncio.run(self._render_edge_tts(tts_input, voice))
        except Exception as exc:
            raise ValueError(f"edge-tts failed: {exc}") from exc

        if not audio_bytes:
            raise ValueError("edge-tts returned empty audio")

        return {
            "provider": "edge-tts",
            "status": "generated",
            "voice": voice,
            "format": "mp3",
            "mime_type": "audio/mpeg",
            "audio_base64": base64.b64encode(audio_bytes).decode("ascii"),
            "text_used": tts_input,
            "truncated": truncated,
        }


class SpeechToTextClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _has_secret(self, value: str) -> bool:
        normalized = (value or "").strip()
        return bool(normalized) and not normalized.startswith("PASTE_YOUR_")

    def describe_status(self) -> dict:
        if self._has_secret(self.settings.groq_api_key):
            return {
                "provider": "groq-stt",
                "status": "ready",
                "model": self.settings.groq_stt_model,
            }

        if self._has_secret(self.settings.openai_api_key):
            return {
                "provider": "openai-stt",
                "status": "ready",
                "model": "gpt-4o-mini-transcribe",
            }

        return {
            "provider": "local-fallback",
            "status": "unavailable",
            "issues": ["No live speech-to-text provider is configured"],
        }

    def transcribe_audio(self, audio_bytes: bytes, filename: str, content_type: str = "") -> dict:
        if not audio_bytes:
            raise ValueError("Audio upload was empty")

        if self._has_secret(self.settings.groq_api_key):
            return self._transcribe_with_groq(audio_bytes, filename, content_type)

        if self._has_secret(self.settings.openai_api_key):
            return self._transcribe_with_openai(audio_bytes, filename, content_type)

        raise ValueError("No speech-to-text provider is configured")

    def _transcribe_with_groq(self, audio_bytes: bytes, filename: str, content_type: str = "") -> dict:
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise ValueError("OpenAI-compatible SDK is not installed") from exc

        client = OpenAI(
            api_key=self.settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )

        try:
            response = client.audio.transcriptions.create(
                model=self.settings.groq_stt_model,
                file=(filename or "shell-command.webm", audio_bytes, content_type or "audio/webm"),
                response_format="verbose_json",
                temperature=0,
                language="en",
                prompt="The speaker uses English. Preserve names like Aubit, Alexa, YouTube, WhatsApp, Google, Gmail, PDF, and ChatGPT.",
            )
        except Exception as exc:
            raise ValueError(f"Groq speech-to-text failed: {exc}") from exc

        transcript = str(getattr(response, "text", "") or "").strip()
        if not transcript:
            raise ValueError("Groq returned an empty transcript")

        return {
            "provider": "groq-stt",
            "model": self.settings.groq_stt_model,
            "transcript": transcript,
            "duration": getattr(response, "duration", None),
            "language": getattr(response, "language", "en"),
        }

    def _transcribe_with_openai(self, audio_bytes: bytes, filename: str, content_type: str = "") -> dict:
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise ValueError("OpenAI SDK is not installed") from exc

        client = OpenAI(api_key=self.settings.openai_api_key)

        try:
            response = client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=(filename or "shell-command.webm", audio_bytes, content_type or "audio/webm"),
                language="en",
                prompt="The speaker uses English. Preserve names like Aubit, Alexa, YouTube, WhatsApp, Google, Gmail, PDF, and ChatGPT.",
            )
        except Exception as exc:
            raise ValueError(f"OpenAI speech-to-text failed: {exc}") from exc

        transcript = str(getattr(response, "text", "") or "").strip()
        if not transcript:
            raise ValueError("OpenAI returned an empty transcript")

        return {
            "provider": "openai-stt",
            "model": "gpt-4o-mini-transcribe",
            "transcript": transcript,
        }

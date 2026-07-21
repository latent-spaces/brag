# Voice configuration

Voiceover is an opt-in feature. The default configuration is:

```yaml
voice:
  enabled: false
  provider: kokoro
```

The skill accepts these invocation options:

```text
/brag --voice
/brag --voice --voice-provider kokoro
/brag --voice --voice-provider elevenlabs
```

`--voice` enables narration. `--voice-provider` is only meaningful when voice
is enabled and accepts `kokoro` or `elevenlabs`; it defaults to `kokoro`.
Provider selection must not implicitly enable voice.

These flags are invocation state, not suggestions. Once `--voice` is present,
the run must either generate narration with the resolved provider or stop with
an actionable error. It must never silently continue with a no-voice video.

## Provider contract

The composition workflow treats providers through this contract:

```text
generate(text, output_path, options) -> audio file
```

A provider must accept the narration text, write one audio file at the
requested path, and report a readable error if generation fails. The
composition pipeline only consumes that audio file and never depends on a
provider-specific client, API response, or merge operation.

The provider boundary is:

```text
voice.enabled
    false  -> no script audio, provider selection, or audio merge
    true   -> validate provider -> generate audio -> transcribe / time scenes
```

## Providers

### Kokoro (default)

Kokoro runs locally through Hyperframes and does not require an API key:

```bash
npx hyperframes tts <script> --voice af_heart \
  --output <output-dir>/composition/assets/voiceover.wav
```

Use `npx hyperframes tts --list` when a different Kokoro voice is requested.

### ElevenLabs (opt-in)

ElevenLabs is selected only with `--voice-provider elevenlabs`. Require
`ELEVENLABS_API_KEY` before invoking the provider; fail with an actionable
message if it is absent. Keep the key in the environment and never write it
to the plan, composition, logs, or share copy.

The ElevenLabs adapter must produce the same output artifact as Kokoro (a
local WAV or MP3 at the requested path). The rest of the workflow must not
branch on that format or on ElevenLabs response details. Use the installed
Hyperframes media adapter/workflow for the actual request rather than adding
an ElevenLabs client to `/brag`.

Unsupported providers must fail before project inspection or composition
creation and list the supported values: `kokoro`, `elevenlabs`.

## Failure behavior

- Voice disabled: skip narration, provider validation, TTS, transcription,
  ducking, and audio-track wiring.
- Voice enabled with an unknown provider: stop with a configuration error.
- ElevenLabs selected without `ELEVENLABS_API_KEY`: stop before generation and
  explain how to set it.
- Provider request failure: preserve the provider error in the run log and
  surface a concise message naming the selected provider.

When voice is enabled, transcribe the generated artifact and use its real
duration/word timings to pace scenes. Never use fixed scene timings just
because the selected provider changed.

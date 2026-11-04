#!/usr/bin/env python3
"""
Prepare one episode for the Higgsedit edit, inside the Higgsfield sandbox.

  python3 prepare.py <manifest.json> <workdir>

Idempotent: every output is cached in <workdir>; rerun after a sandbox reset.
Produces in <workdir>:
  voice.mp3, words.json            take + faster-whisper word times
  clip-<n>.mp4                     photoreal clips retimed to their scene, 1080x1920, 30 fps, silent
  sfx/*.wav, mix.wav               sox-synthesized whoosh/pop + ambient bed, mixed under the voice
  edit/timeline.js                 scenes, caption chunks and word cues for edit.jsx
"""
import difflib, json, os, re, subprocess, sys, urllib.request

man_path, work = sys.argv[1], os.path.abspath(sys.argv[2])
os.makedirs(os.path.join(work, "edit"), exist_ok=True)
os.makedirs(os.path.join(work, "sfx"), exist_ok=True)
m = json.load(open(man_path))
P = lambda *a: os.path.join(work, *a)
sh = lambda cmd: subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True).stdout


def fetch(url, out):
    if not os.path.exists(out):
        urllib.request.urlretrieve(url, out + ".part")
        os.rename(out + ".part", out)
    return out


def duration(f):
    return float(sh(f"ffprobe -v error -show_entries format=duration -of csv=p=0 '{f}'"))


# 1. Voice + word times
fetch(m["assets"]["voice"]["url"], P("voice.mp3"))
if not os.path.exists(P("words.json")):
    from faster_whisper import WhisperModel
    segs, _ = WhisperModel("small", compute_type="int8").transcribe(P("voice.mp3"), word_timestamps=True, language="en")
    words = [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for s in segs for w in s.words]
    json.dump(words, open(P("words.json"), "w"))
heard = json.load(open(P("words.json")))
vdur = duration(P("voice.mp3"))

# 2. Align script words (the truth for captions) to heard times
norm = lambda w: re.sub(r"[^a-z0-9']", "", w.lower())
script = []  # (scene index, display word)
for si, sc in enumerate(m["storyboard"]):
    for w in re.sub(r"\.\.\.", "… ", sc["narration"]).split():
        if norm(w):
            script.append((si, w))
a = [norm(w) for _, w in script]
b = [norm(x["w"]) for x in heard]
times = [None] * len(script)
for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
    for k in range(blk.size):
        times[blk.a + k] = (heard[blk.b + k]["s"], heard[blk.b + k]["e"])
# fill gaps (e.g. "Predicted" heard as "Predict a") by interpolation
for i in range(len(times)):
    if times[i] is None:
        prev = next((times[j] for j in range(i - 1, -1, -1) if times[j]), (0, 0))
        nxt = next((times[j] for j in range(i + 1, len(times)) if times[j]), (vdur, vdur))
        times[i] = (prev[1], max(prev[1] + 0.05, min(nxt[0], prev[1] + 0.35)))

# 3. Scene boundaries = first word of each scene
n_sc = len(m["storyboard"])
starts = []
for si in range(n_sc):
    idx = next(i for i, (s, _) in enumerate(script) if s == si)
    starts.append(0.0 if si == 0 else round(times[idx][0] - 0.12, 2))
END_CARD = 1.5
voice_end = round(vdur + 0.35, 2)
ends = starts[1:] + [voice_end]

# 4. Caption chunks: <= 3 words, break after punctuation
keys = {norm(k) for k in m.get("captionKeywords", [])}
captions = []
for si in range(n_sc):
    items = [(i, w) for i, (s, w) in enumerate(script) if s == si]
    chunk = []
    for j, (i, w) in enumerate(items):
        chunk.append((i, w))
        last = j == len(items) - 1
        if len(chunk) == 3 or re.search(r"[.,?!…]$", w) or last:
            c0 = times[chunk[0][0]][0]
            nxt = times[items[j + 1][0]][0] if not last else ends[si]
            captions.append({
                "at": round(c0, 2), "dur": round(max(0.3, nxt - c0), 2),
                "words": [{"text": re.sub(r"…", "", ww).upper().strip() or ww, "t": round(times[ii][0] - c0, 2),
                           "key": norm(ww) in keys or (ww.isupper() and len(ww) > 2)} for ii, ww in chunk],
            })
            chunk = []

# 5. Photoreal clips retimed to scene length (slow down at most 1.4x, else hold last frame)
scenes = []
for si, sc in enumerate(m["storyboard"]):
    d = round(ends[si] - starts[si], 2)
    entry = {"n": sc["n"], "style": sc.get("style", "graphic"), "label": sc["label"], "start": starts[si], "dur": d,
             "words": [{"text": w, "at": times[i][0]} for i, (s, w) in enumerate(script) if s == si]}
    clip = m["assets"]["scenes"].get(str(sc["n"]), {}).get("clip", {}).get("url")
    if entry["style"] == "photoreal" and clip:
        raw = fetch(clip, P(f"raw-{sc['n']}.mp4"))
        out = P(f"clip-{sc['n']}.mp4")
        if not os.path.exists(out):
            L = duration(raw)
            f = min(1.4, max(1.0, (d + 0.1) / L))
            sh(f"ffmpeg -v error -y -i '{raw}' -an -vf \"setpts={f:.4f}*PTS,fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,tpad=stop_mode=clone:stop_duration=3\" "
               f"-t {d + 0.1:.2f} -c:v libx264 -crf 18 -pix_fmt yuv420p '{out}'")
        entry["clip"] = out
    elif entry["style"] == "photoreal":
        # Economy mode: a still with a camera move drawn in the edit. Upscale
        # (lanczos) and lightly sharpen to 1.2x the frame so the move stays crisp.
        img = m["assets"]["scenes"].get(str(sc["n"]), {}).get("image", {}).get("url")
        if not img:
            raise SystemExit(f"scene {sc['n']}: photoreal scene has neither a clip nor a still")
        raw = fetch(img, P(f"raw-{sc['n']}.png"))
        out = P(f"still-{sc['n']}.png")
        if not os.path.exists(out):
            sh(f"ffmpeg -v error -y -i '{raw}' -vf \"scale=1296:2304:force_original_aspect_ratio=increase:flags=lanczos,crop=1296:2304,unsharp=5:5:0.6\" '{out}'")
        entry["still"] = out
    scenes.append(entry)

# 6. SFX + ambient bed (sox; free), then the mix under the voice
if not os.path.exists(P("sfx", "whoosh.wav")):
    sh(f"sox -n -r 48000 -c 2 '{P('sfx','whoosh.wav')}' synth 0.45 pinknoise sinc 300-3000 fade q 0.12 0.45 0.3 gain -16")
    sh(f"sox -n -r 48000 -c 2 '{P('sfx','pop.wav')}' synth 0.12 sine 900-300 fade q 0.005 0.12 0.08 gain -14")
    sh(f"sox -n -r 48000 -c 2 '{P('sfx','bed.wav')}' synth 60 brownnoise synth 60 sine mix 55 lowpass 400 gain -36 fade q 1 60 2")
total = round(voice_end + END_CARD, 2)
inputs = [f"-i '{P('voice.mp3')}'", f"-i '{P('sfx','bed.wav')}'"]
filters = ["[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0[v]", f"[1:a]atrim=0:{total}[bed]"]
mixes = ["[v]", "[bed]"]
k = 2
for sc in scenes[1:]:
    snd = "pop.wav" if sc["style"] == "cartoon" else "whoosh.wav"
    inputs.append(f"-i '{P('sfx', snd)}'")
    ms = int(max(0, sc["start"] - (0.05 if snd == "pop.wav" else 0.2)) * 1000)
    filters.append(f"[{k}:a]adelay={ms}|{ms}[s{k}]")
    mixes.append(f"[s{k}]")
    k += 1
filters.append(f"{''.join(mixes)}amix=inputs={len(mixes)}:normalize=0,atrim=0:{total}[out]")
sh(f"ffmpeg -v error -y {' '.join(inputs)} -filter_complex \"{';'.join(filters)}\" -map [out] -ar 48000 '{P('mix.wav')}'")

json.dump({"total": total, "voiceEnd": voice_end, "endCard": END_CARD, "scenes": scenes, "captions": captions},
          open(P("edit", "timeline.json"), "w"), indent=1)
open(P("edit", "timeline.js"), "w").write("export default " + open(P("edit", "timeline.json")).read() + ";\n")
print(json.dumps({"total": total, "scenes": [(s["n"], s["style"], s["start"], s["dur"]) for s in scenes], "captions": len(captions)}))

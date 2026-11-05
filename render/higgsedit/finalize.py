#!/usr/bin/env python3
"""
Master and QC one rendered episode inside the Higgsfield sandbox.

  python3 finalize.py <manifest.json> <workdir>

Reads <workdir>/edit/renders/final.mp4, writes <workdir>/out.mp4 (mastered),
<workdir>/qc/sheet.jpg (10 frames) and <workdir>/qc.json:
  format     1080x1920, 30 fps, H.264 + AAC
  duration   25-45 s
  loudness   -14 LUFS +/- 1 (plain gain + safety limiter at -1.5 dBFS)
  true_peak  <= -1.0 dBFS
  transcript faster-whisper medium on the master vs the script: similarity >= 0.90
Exit code 0 only if every check passes.
"""
import difflib, json, os, re, subprocess, sys

man_path, work = sys.argv[1], os.path.abspath(sys.argv[2])
m = json.load(open(man_path))
src = os.path.join(work, "edit", "renders", "final.mp4")
out = os.path.join(work, "out.mp4")
os.makedirs(os.path.join(work, "qc"), exist_ok=True)
run = lambda c: subprocess.run(c, shell=True, capture_output=True, text=True)


def loud(f):
    t = run(f"ffmpeg -nostats -i '{f}' -af ebur128=peak=true -f null - 2>&1").stdout
    s = t[t.rfind("Summary:"):]
    i = float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1))
    p = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))
    return i, p


i0, _ = loud(src)
gain = round(-14.0 - i0, 2)
run(f"ffmpeg -v error -y -i '{src}' -c:v copy -af \"aresample=192000,volume={gain}dB,alimiter=limit=0.84:attack=3:release=60:level=disabled,aresample=48000\" -c:a aac -b:a 192k -movflags +faststart '{out}'")
i1, p1 = loud(out)

probe = json.loads(run(f"ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate:format=duration -of json '{out}'").stdout)
v = next(s for s in probe["streams"] if s["codec_type"] == "video")
a = [s for s in probe["streams"] if s["codec_type"] == "audio"]
dur = float(probe["format"]["duration"])

from faster_whisper import WhisperModel  # noqa: E402
segs, _ = WhisperModel("medium", compute_type="int8").transcribe(out, language="en", beam_size=5)
heard = " ".join(s.text.strip() for s in segs)
norm = lambda t: re.sub(r"[^a-z0-9 ]", "", re.sub(r"\[[^\]]*\]", "", t.lower()).replace("-", " ")).split()
said = " ".join(sc["narration"] for sc in m["storyboard"])
sim = difflib.SequenceMatcher(None, norm(said), norm(heard)).ratio()

run(f"ffmpeg -v error -y -i '{out}' -vf \"fps=10/{dur:.2f},scale=216:384,tile=5x2\" -frames:v 1 -q:v 4 '{work}/qc/sheet.jpg'")

checks = [
    {"name": "format", "pass": v["width"] == 1080 and v["height"] == 1920 and v["r_frame_rate"] == "30/1" and v["codec_name"] == "h264" and len(a) == 1,
     "note": f"{v['width']}x{v['height']} {v['r_frame_rate']} {v['codec_name']}, audio streams {len(a)}"},
    {"name": "duration", "pass": 25 <= dur <= 45.05, "note": f"{dur:.2f} s"},
    {"name": "loudness", "pass": abs(i1 + 14) <= 1.0, "note": f"{i1} LUFS (render {i0}, gain {gain} dB)"},
    {"name": "true_peak", "pass": p1 <= -1.0, "note": f"{p1} dBFS"},
    {"name": "transcript", "pass": sim >= 0.90, "note": f"similarity {sim:.3f} (whisper medium vs script)"},
]
res = {"verdict": "pass" if all(c["pass"] for c in checks) else "fail", "checks": checks, "seconds": round(dur, 2), "heard": heard}
json.dump(res, open(os.path.join(work, "qc.json"), "w"), indent=1)
print(json.dumps({k: res[k] for k in ("verdict", "seconds")}), *[f"{'ok ' if c['pass'] else 'FAIL'} {c['name']}: {c['note']}" for c in checks], sep="\n")
sys.exit(0 if res["verdict"] == "pass" else 1)

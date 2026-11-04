# Storyboard template

5–8 scenes, 2.5–7 s each, one scene per narration beat. Scene 1 must show the hook subject in its first frame (no fades, no logo first).

Per scene (`storyboard[]` in the manifest):
- `narration`: the exact words spoken over it.
- `visual`: generation prompt: "Photorealistic cinematic <shot type>, vertical 9:16: <one subject, action, setting>. Deep navy background, cool rim light, subtle cyan accents, documentary realism, no text." Never ask the model to draw text, numbers or logos: those are drawn in code.
- `label`: top label in caps; add `· ILLUSTRATIVE` / `· CONCEPTUAL` / `· NOT TO SCALE` when not literal.
- `animate`: true for at most 3 scenes in hybrid mode (hook, the key mechanism, the payoff/evidence). Others get code-driven push/pull.
- `motion`: one slow, physically plausible movement, no cuts.
- `overlay`: data callouts, arrows, meters, counters (drawn in code, free).

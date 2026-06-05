# The Codex

The full reference of War Room operational material that shapes the Morning Brief system.

**The AI does NOT load these files at runtime in v1.** They are too big and would dilute attention. They live here as source material — the system prompt at `lib/system-prompt.ts` is the operational distillation.

---

## How to use these docs

**1. For system prompt refinement (primary use case).**
When you want to sharpen the brief — adjust the Villain voice, add a new principle, recalibrate the honest callout — open the relevant Codex file, find the language that captures what you mean, distill it into one or two sentences, add it to `lib/system-prompt.ts`. The Codex is the source. The system prompt is the operational distillation. The system prompt should never get bigger than ~800 words.

**2. For your own recalibration.**
When you feel drift, when standards slip, when you've stopped pushing — re-read the relevant file. The point isn't to memorize. The point is to remember the standard you committed to and find your way back to it.

**3. For future AI retrieval (v2+).**
Once the brief is stable, you can add semantic search over these docs so the AI can pull relevant passages on demand. Not v1.

---

## Index

### Core Identity
- [01-foundations.md](01-foundations.md) — Start Here, what The War Room is, why the Codex exists, intro to the Sigils, Iron Mind, the White Path
- [02-the-sigils.md](02-the-sigils.md) — The 10 Sigils in detail. What each demands. How they reinforce each other.
- [03-the-41-tenets.md](03-the-41-tenets.md) — The 41 Tenets. Core commitments. **Referenced directly in the system prompt.**

### Mindset & Discipline
- [10-iron-mind.md](10-iron-mind.md) — Iron Mind 2.0. Full course: building your Villain, ego as weapon, rewards, scarcity, mindset hacks, living with Iron Mind, plus bonuses: Ghost Protocol, Silent War, Pain Compass, Tate Standard. **Referenced directly in the system prompt.**
- [11-ego-informed.md](11-ego-informed.md) — Keeping your ego informed. Informed vs uninformed, validation trap, calibrated ego. **The most important calibration for this whole system. Referenced directly in the system prompt.**
- [12-emotional-mastery.md](12-emotional-mastery.md) — Anatomy of emotions, regulation, relationships, turning pain into power.
- [13-stoicism.md](13-stoicism.md) — Stoic principles for daily application. Discipline, courage, endurance, wisdom.
- [14-energy-transfer.md](14-energy-transfer.md) — How energy flows between people, sources, vampires, feedback loops.

### Execution & Performance
- [20-high-performance-habits.md](20-high-performance-habits.md) — Foundational habits, breaking destructive ones, optimizing routine, sustaining progress.
- [21-rapid-learning.md](21-rapid-learning.md) — Meta-learning, deliberate practice, memory techniques, learning from experts.
- [22-decision-making.md](22-decision-making.md) — Deciding vs reacting, cognitive biases, frameworks, risk and uncertainty.
- [23-crisis-handbook.md](23-crisis-handbook.md) — Anatomy of crisis, first response, decision-making under fire, long game, aftermath.

### War Room Operations
- [30-structure-culture-conduct.md](30-structure-culture-conduct.md) — How The War Room runs. Structure, orientation, culture, conduct, legacy.

### Strategy & Influence
- [40-strategic-thinking.md](40-strategic-thinking.md) — Strategic thinking, social dynamics, conflict resolution, leadership, wealth & business, ethics, brotherhood, psychological warfare.
- [41-reputation-leverage.md](41-reputation-leverage.md) — Reputation as leverage. Foundations, physical presence, building, defending, sustaining.
- [42-positioning.md](42-positioning.md) — Strategic positioning. Perception gap, visibility, distinction, signals, holding position.
- [43-networking-power-players.md](43-networking-power-players.md) — Networking with Power Players. Mindset, access, language, value, alliances.

### Freedom & Wealth
- [50-geographic-freedom.md](50-geographic-freedom.md) — Passports, residency, tax mitigation, banking, real estate, geographic redundancy.

---

## The rule

If a Codex element is something I want the AI to enforce **every single morning**, it goes in `lib/system-prompt.ts`. Distill it to 2-3 sentences and link the source file here.

If it's reference material for **my own development**, it stays here. The AI does not need to re-read it daily.

The system prompt should never exceed ~800 words. When I'm tempted to dump a Codex section in — stop. Distill. Link.

---

## What's populated

- `README.md` (this file) — done
- `03-the-41-tenets.md` — done
- Everything else — stubs to fill in from the original Codex source material

The other files are listed in the index but not yet populated. When ready, extract the relevant section from the original Codex documents and paste into the corresponding file with minimal cleanup. Verbatim is fine — these are reference, not Claude-summarized retellings.

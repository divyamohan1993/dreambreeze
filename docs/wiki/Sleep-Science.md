# Sleep Science

Every decision DreamBreeze makes is grounded in peer-reviewed sleep research. This page documents the scientific foundations.

## The Two-Process Model of Sleep

Alexander Borbely's Two-Process Model (1982) is the foundational framework for how DreamBreeze predicts and responds to sleep behavior.

### Process S (Homeostatic Sleep Pressure)

- **What it is**: A drive to sleep that builds during waking hours
- **Biological basis**: Adenosine accumulation in the basal forebrain
- **Behavior**: Rises exponentially during wakefulness, decays exponentially during sleep
- **DreamBreeze use**: The Energy Agent tracks Process S to estimate current sleep pressure and predict optimal wake time

### Process C (Circadian Rhythm)

- **What it is**: The 24-hour biological clock
- **Biological basis**: Suprachiasmatic nucleus (SCN) signaling
- **Behavior**: Independent sinusoidal oscillation regardless of sleep/wake state
- **DreamBreeze use**: The Energy Agent uses Process C to align wake suggestions with your circadian peak alertness window

### How They Interact

Sleep onset occurs when Process S (pressure) rises above Process C (alertness threshold). Waking occurs when Process S decays below Process C.

```
Alertness
  ^
  |     Process C (Circadian)
  |    /~~~~~~~~~~\              /~~~~~~~~~~\
  |   /            \            /            \
  |--/----+---------\----------/----+---------\----> Time
  |      / \  Process S         / \
  |     /   \ (Sleep Pressure) /   \
  |    /     \________________/     \
  |
  +-- Sleep onset          Wake
```

The Energy Agent implements both curves and generates an **energy forecast** -- a projected alertness curve for the next 24 hours.

## Posture and Thermoregulation

### Why Posture Matters for Fan Speed

Different sleep postures expose different amounts of skin surface area to airflow. This directly affects heat dissipation rate and comfort.

| Posture | Skin Exposure | Airflow Need | Notes |
|---------|--------------|-------------|-------|
| **Supine** (back) | Maximum | Highest (55%) | Full torso and face exposed. Core temperature drops fastest. |
| **Lateral** (side) | Moderate | Medium (40%) | Pillow-side face creates heat-trapping microclimate. Asymmetric compensation needed. |
| **Fetal** | Low-moderate | Lower (35%) | Curled posture often signals thermal discomfort or light sleep. Transitional state. |
| **Prone** (stomach) | Minimal | Lowest (25%) | Mattress insulates torso. Over-cooling in this position causes awakenings. |

**Key reference**: Okamoto-Mizuno & Mizuno (2012) -- "Effects of thermal environment on sleep and circadian rhythm"

### REM Sleep Thermoregulation Failure

During REM sleep, the brain actively **shuts down thermoregulation** (thermoregulatory atonia). This means:

- Your body cannot shiver to warm up
- Your body cannot sweat to cool down
- You are entirely dependent on your environment

DreamBreeze's Posture Agent adds **+10% fan speed during detected REM periods** to compensate for this biological limitation. This is one of the most impactful features -- addressing a vulnerability that happens every 90 minutes throughout the night.

### Body Temperature Circadian Curve

Core body temperature follows a predictable circadian pattern:

```
Temp (C)
37.5 |
37.0 |----\                          /----
36.5 |     \                        /
36.0 |      \                      /
35.5 |       \____________________/
     |
     +--+----+----+----+----+----+----+--> Time
       6PM  9PM  12AM  3AM  6AM  9AM  12PM

                    ^ Nadir (4-5 AM)
```

The Thermal Agent uses this curve to **proactively adjust fan speed** before you feel uncomfortable -- lowering fan speed as body temperature naturally drops, then subtly increasing it as temperature rises toward morning.

## Sleep Stages and Sound

### Pink Noise and Slow-Wave Activity

**Finding**: Pink noise (1/f spectral distribution) delivered during NREM sleep increases slow-wave activity by ~25% and improves memory consolidation.

**Reference**: Ngo et al. (2013) -- "Auditory closed-loop stimulation of the sleep slow oscillation enhances memory"

**DreamBreeze implementation**: The Sound Agent delivers pink noise during detected NREM (light and deep sleep) stages, synchronized with estimated slow-wave timing.

### Brown Noise for Deep Sleep

**Finding**: Brown noise (1/f^2 spectral distribution) provides consistent low-frequency masking without cortical arousal. Its deeper frequency profile is less likely to cause micro-arousals than white noise.

**DreamBreeze implementation**: During deep sleep stages, the Sound Agent transitions from pink to brown noise for maximum masking with minimum disruption.

### Sound Morphing

Sudden acoustic changes -- even between beneficial noise types -- can cause micro-arousals. DreamBreeze uses **gradual crossfading** (30-60 second transitions) between noise profiles to prevent this.

## Sleep Debt

### The Science

Sleep debt is the cumulative deficit between actual sleep duration and your biological sleep need. Research by Van Dongen et al. (2003) demonstrated that chronic sleep restriction produces **cumulative cognitive impairment** that does not plateau -- even when subjects report feeling "adapted."

### DreamBreeze Implementation

The Sleep Debt Calculator (`src/lib/ai/sleep-debt.ts`) uses:

- **14-day rolling window** -- matches the research timeframe for meaningful debt measurement
- **Quality-adjusted scoring** -- not just hours in bed, but estimated sleep efficiency
- **Van Dongen impairment mapping** -- maps debt hours to expected cognitive impact levels

| Debt Level | Hours | Impairment |
|-----------|-------|-----------|
| None | 0-2h | Minimal |
| Mild | 2-5h | Subtle attention lapses |
| Moderate | 5-10h | Measurable reaction time increase |
| Severe | 10-20h | Equivalent to 0.05% BAC |
| Critical | 20h+ | Equivalent to 0.10% BAC |

## Cognitive Readiness Score

The Cognitive Readiness Score is a 0-100 composite metric calculated from four pillars:

| Pillar | Weight | What It Measures |
|--------|--------|-----------------|
| **Duration** | 30% | Actual sleep vs. target (7-9 hours) |
| **Architecture** | 25% | Proportion of deep sleep and REM vs. light sleep |
| **Continuity** | 25% | Number and duration of awakenings |
| **Context** | 20% | Pre-sleep factors (caffeine, stress, exercise, screen time) |

### Grade Scale

| Score | Grade | Interpretation |
|-------|-------|---------------|
| 90-100 | A+ | Peak cognitive performance expected |
| 80-89 | A | Strong cognitive function |
| 70-79 | B | Good, minor attention effects |
| 60-69 | C | Fair, noticeable cognitive impact |
| 50-59 | D | Poor, significant impairment likely |
| 0-49 | F | Critical, consider recovery sleep |

## Weather Integration

### Why Weather Matters

Indoor temperature is heavily influenced by outdoor conditions, especially in:
- Homes without central HVAC
- Rooms with poor insulation
- Tropical and subtropical climates
- Seasonal transitions

The Thermal Agent fetches weather data from the Open-Meteo API (free, no key required) and factors in:
- Current outdoor temperature
- Humidity (affects perceived temperature)
- Overnight forecast (proactive adjustment)

### Temperature Cycling Profiles

Based on sleep research, DreamBreeze offers 5 preset temperature profiles:

| Profile | Best For | Approach |
|---------|---------|---------|
| **Cool Sleeper** | People who run hot | Starts cool, stays cool, slight warming at 4 AM |
| **Warm Sleeper** | People who run cold | Gentle cooling, never drops below comfort floor |
| **Tropical Night** | Hot/humid climates | Aggressive initial cooling, maintains through REM |
| **Season Transition** | Spring/autumn variability | Wide dynamic range, responsive to weather changes |
| **Minimal** | Light sensitivity | Smallest possible adjustments, prioritizes stability |

Each profile defines 8 sleep phases with specific temperature targets and fan speed ranges.

## References

1. Borbely, A.A. (1982). "A two-process model of sleep regulation." *Human Neurobiology*, 1(3), 195-204.
2. Okamoto-Mizuno, K., & Mizuno, K. (2012). "Effects of thermal environment on sleep and circadian rhythm." *Journal of Physiological Anthropology*, 31(1), 14.
3. Ngo, H.V., et al. (2013). "Auditory closed-loop stimulation of the sleep slow oscillation enhances memory." *Neuron*, 78(3), 545-553.
4. Van Dongen, H.P., et al. (2003). "The cumulative cost of additional wakefulness." *Sleep*, 26(2), 117-126.
5. Krauchi, K. (2007). "The thermophysiological cascade leading to sleep initiation in relation to phase of entrainment." *Sleep Medicine Reviews*, 11(6), 439-451.

# Comprehensive Research Report: Sleep Posture-Based Fan Speed Control Systems

**Date:** February 25, 2026
**Scope:** Existing products/research, detection methods, sleep science, fan control systems, similar projects, and practical considerations.

---

## Table of Contents

1. [Existing Products and Research](#1-existing-products-and-research)
2. [Sleep Posture Detection Methods](#2-sleep-posture-detection-methods)
3. [Sleep Science and Thermal Comfort](#3-sleep-science-and-thermal-comfort)
4. [Fan Control Systems and IoT Protocols](#4-fan-control-systems-and-iot-protocols)
5. [Similar Products and Projects](#5-similar-products-and-projects)
6. [Practical Considerations](#6-practical-considerations)
7. [Recommended Architecture for a Home System](#7-recommended-architecture-for-a-home-system)
8. [Sources](#8-sources)

---

## 1. Existing Products and Research

### 1.1 The Bengaluru "AI Roommate" Project (2024-2025)

The most directly relevant implementation is by **Pankaj**, a Bengaluru-based software engineer, who built an AI-powered system that adjusts his ceiling fan based on sleep posture. Key details:

- **Motivation:** "Tired of waking up at 3 AM either sweaty or freezing."
- **Detection Method:** Runs a **MediaPipe Pose vision model** on a **Raspberry Pi** home server.
- **Logic:** If arms or legs are sticking out from under the blanket (indicating the person is hot), the fan switches on. If the person curls up (suggesting coldness), the fan turns off.
- **Actuation:** Commands are sent to a **remote button-pusher device** that physically presses the fan switch.
- **Limitation:** Binary on/off control (not variable speed), camera-based (privacy concerns).

This project was widely covered in media including StoryPick, NewsBytes, Tribune India, and Mugglehead.

### 1.2 Academic Research

| Paper/System | Year | Method | Key Finding |
|---|---|---|---|
| "Sleep Posture Detection via Embedded ML on Reduced Set of Pressure Sensors" (MDPI Sensors) | 2025 | Pressure sensor array + ML | Achieved 88-96% accuracy with as few as 6-15 sensors |
| "Raspberry Pi-Based Sleep Posture Recognition System Using AIoT Technique" (MDPI Healthcare) | 2022 | RFID tags in bed sheets + Random Forest classification on RPi | Demonstrated feasibility of edge-AI posture recognition |
| "A New Hybrid Algorithm for Vision-Based Sleep Posture Analysis Integrating CNN, LSTM and MediaPipe" (IJACSA) | 2025 | MediaPipe + CNN + LSTM pipeline | >90% classification accuracy for supine, lateral, prone, fetal |
| "Smart Sleep Monitoring: Sparse Sensor-Based Spatiotemporal CNN" (PubMed) | 2024 | Sparse pressure sensor + Spatiotemporal CNN | High accuracy with reduced sensor count |
| "A dual fusion recognition model for sleep posture based on air mattress pressure detection" (Nature Scientific Reports) | 2024 | Air mattress pressure + dual fusion model | 99.9% accuracy with advanced fusion approach |
| "An Innovative Fan Control Strategy for Comfort Sleeping" (ScienceDirect) | 2022 | Fan speed model based on human physiological characteristics | Developed fan speed curves responsive to sleep physiology |
| "A model for predicting thermal comfort during sleep in response to air velocity" (Building & Environment) | 2022 | Mathematical thermal model for sleeping persons | Optimal: 29 deg C + 0.4 m/s airflow; reduces HVAC energy 25.3% vs 26 deg C no airflow |

### 1.3 Gap Analysis

There is **no widely available commercial product** that specifically combines sleep posture detection with automatic fan speed control. This represents a genuine gap in the market. Existing solutions are either:
- Temperature-only based (smart fans with thermostats)
- Posture detection without environmental control (sleep trackers)
- Manual/research prototypes (Bengaluru project)

---

## 2. Sleep Posture Detection Methods

### 2.1 Camera/Computer Vision Based

#### MediaPipe Pose
- **Landmarks:** 33 3D body landmarks from RGB video
- **Architecture:** Two-step detector-tracker ML pipeline (BlazePose)
- **Speed:** Real-time on mobile and embedded devices (Raspberry Pi)
- **Accuracy for sleep posture:** >90% classification accuracy (CNN+LSTM+MediaPipe hybrid)
- **Infrared compatibility:** Works with IR cameras for nighttime use, but performance degrades compared to daylight RGB
- **Cost:** Camera ($15-50) + Raspberry Pi ($35-75) = **$50-125 total**
- **Pros:** High detail, real-time, well-documented, free/open-source
- **Cons:** Privacy concerns, requires line-of-sight, affected by blankets/occlusion

#### OpenPose
- **Landmarks:** 18 body keypoints
- **Architecture:** Bottom-up multi-person pose estimation
- **Accuracy:** Higher deviation from ground truth than MediaPipe for most keypoints
- **Speed:** Slower than MediaPipe; requires more computational resources (typically GPU)
- **Cost:** Requires more powerful hardware; typically a GPU-equipped system ($200+)
- **Pros:** Multi-person tracking, established research tool
- **Cons:** Heavier compute requirements, less suitable for embedded/edge deployment

#### Comparison: MediaPipe vs OpenPose for Sleep Applications
| Feature | MediaPipe | OpenPose |
|---|---|---|
| Keypoints | 33 | 18 |
| Edge deployment | Excellent (RPi compatible) | Poor (needs GPU) |
| Accuracy | Lower deviation from manual annotation | Higher deviation |
| Multi-person | Limited | Strong |
| Real-time on RPi | Yes | No |
| **Recommendation for sleep** | **Preferred** | Not recommended |

### 2.2 Pressure Mat/Sensor Based

#### Force Sensing Resistor (FSR) Arrays
- **Mechanism:** Grid of pressure-sensitive sensors under mattress or on mattress surface
- **Typical configurations:**
  - Full array: 27x64 sensors (~$8,850 research grade)
  - Reduced array: 160 FSR sensors + 1 IR array sensor (~$950)
  - Minimal: 6-15 sensors (cost-effective, 88-96% accuracy)
- **Accuracy:** 88% (6 sensors) to 99.9% (advanced air mattress fusion)
- **Pros:** No privacy concerns, unobtrusive, works under blankets, no line-of-sight needed
- **Cons:** Cost scales with sensor density, sensor drift over time, affected by mattress type

#### Smart Pressure e-Mat
- Research systems using flexible pressure sensor arrays
- Can detect not only posture but also breathing and heartbeat through micro-pressure changes
- Suitable for long-term monitoring

#### Commercial Products
- **Withings Sleep Mat:** ~$100, tracks sleep stages and movement (not posture-specific)
- **Custom FSR mats:** Can be built for $50-200 using individual FSR sensors + Arduino/ESP32

### 2.3 Wearable Sensor Based (Accelerometer/Gyroscope/IMU)

#### How It Works
- 3-axis accelerometer detects gravitational orientation (which way is "down")
- Gyroscope provides short-term rotational data
- Magnetometer adds absolute orientation reference
- Kalman filter fuses all three for drift-free orientation

#### Performance
- **Accelerometer-only:** >99.8% accuracy in controlled conditions (lab)
- **Wrist-based:** 79.8% sleep/wake accuracy
- **Chest-based:** 85.8% sleep/wake accuracy (6% better than wrist)
- **Finger-worn (with photosensor):** 79% sleep stage detection

#### Products
- **Oura Ring:** $299-399, accelerometer-based, tracks sleep stages and movement
- **Apple Watch:** Accelerometer + gyroscope, sleep tracking with position inference
- **Custom IMU:** MPU6050/BNO055 sensor ($5-15) + microcontroller

#### Pros and Cons
- **Pros:** Low cost per unit, well-established technology, integrates with smart home
- **Cons:** Must be worn (discomfort), sensitive to external vibrations, drift in real-world conditions

### 2.4 Radar/mmWave Based

#### MIT BodyCompass (RF-Based)
- **Frequency:** FMCW radio, 5.4-7.2 GHz
- **Power:** Sub-milliwatt (FCC compliant)
- **Key insight:** Breathing modulates chest/belly reflections, allowing body-specific signal isolation from multipath
- **Accuracy:** 84% (16 min data), 87% (1 night), 94% (1 week labeled data)
- **Privacy:** No camera, no wearable -- completely contactless
- **Status:** Research prototype (MIT CSAIL)

#### 60GHz mmWave Commercial Modules
- **Texas Instruments IWR6843:** Industrial-grade 60-64 GHz radar sensor, used in research
- **Seeed Studio MR60BHA1/MR60BHA2:** 60GHz mmWave module
  - Detects: presence, breathing rate, heart rate, sleep posture, body movement
  - **Price:** ~$23 per module
  - **Integration:** UART serial output, Arduino/ESP32 compatible, ESPHome firmware available
  - **Mounting:** 1 meter above bed, 45 deg downward tilt, max 1.5m range
  - Home Assistant integration available via ESPHome

#### Pros and Cons
- **Pros:** Privacy-preserving, contactless, penetrates clothing/thin blankets, detects vitals
- **Cons:** Lower spatial resolution than camera, affected by multiple people in bed, limited commercial availability for sleep-specific posture classification

### 2.5 Comparison Matrix: Detection Methods for Home Use

| Criterion | Camera (MediaPipe) | Pressure Mat | Wearable (IMU) | mmWave Radar |
|---|---|---|---|---|
| **Accuracy** | 90-93% | 88-99% | 80-99% (controlled) | 84-94% |
| **Privacy** | Poor | Excellent | Good | Excellent |
| **Comfort** | Non-contact | Non-contact | Must wear | Non-contact |
| **Works under blankets** | No | Yes | Yes | Partially |
| **Multi-person** | Possible | Per-side of bed | Per-person | Difficult |
| **Cost (DIY)** | $50-125 | $50-950 | $5-400 | $23-200 |
| **Setup complexity** | Medium | Medium-High | Low | Low-Medium |
| **Home Assistant integration** | Custom | Custom | Via Oura/Watch | ESPHome ready |
| **Recommended for home** | If privacy OK | For high accuracy | If already owned | **Best balance** |

**Overall recommendation for home use: mmWave radar** (best balance of privacy, accuracy, cost, and ease of integration), with **pressure mat** as the highest-accuracy option if privacy and budget allow.

---

## 3. Sleep Science and Thermal Comfort

### 3.1 Sleep Posture Classifications

The main sleep postures recognized in research and clinical practice:

| Posture | Description | Population % (sleep time) | Heat Characteristics |
|---|---|---|---|
| **Supine (back)** | Lying face-up, arms at sides or on chest | 34-38% | Largest conductive heat transfer area (0.100 ratio); radiative area ratio 0.811 |
| **Lateral Left** | Lying on left side | ~30% | Higher radiative area (0.879 ratio); lower conductive area (0.039 ratio) |
| **Lateral Right** | Lying on right side | ~32% | Similar to lateral left |
| **Prone (stomach)** | Lying face-down | 4-7% | Reduced ability to lose heat; only 70% of surface for insensible heat loss vs 84% supine |
| **Fetal** | Side-lying with knees drawn up | Subset of lateral (~20-25%) | Reduced exposed surface area; indicates feeling cold |

**Key statistics:** Adults change sleep position 11-45 times per night during a typical 8-hour sleep period.

### 3.2 Body Heat Distribution by Posture

Research findings on how posture affects thermoregulation:

**Supine Position:**
- Larger body surface in contact with mattress (conductive heat transfer area ratio: 0.100)
- Core temperature decreases when moving from standing to supine (vasodilation effect)
- Mean skin temperature increases due to arterial baroreceptor reflexes producing vasodilation
- 84% of total body surface available for insensible heat loss

**Lateral Position:**
- Higher radiative heat transfer area ratio (0.879 vs 0.811 supine)
- Slightly higher convective heat transfer area ratio (0.712 vs 0.708)
- Much less conductive heat transfer (0.039 vs 0.100) -- less heat to mattress
- More body surface exposed to air circulation from a fan

**Prone Position:**
- Reduced effective surface area for heat loss (70% vs 84% supine)
- Higher surface temperatures due to heat trapping between body and mattress
- Lower metabolic rate but reduced ability to dissipate heat
- People in prone position may feel warmer

**Fetal/Curled Position:**
- Minimal exposed surface area
- Self-insulating posture -- typically indicates the person feels cold
- Reduced convective and radiative heat loss

### 3.3 Thermoregulation During Sleep

**Core Body Temperature Cycle:**
- Core temperature drops 1-2 deg F during sleep onset
- Lowest point occurs during deep NREM sleep (typically 2-3 AM)
- Temperature begins rising before wake time
- Skin temperature increases as core temperature drops (heat redistribution to periphery)

**Sleep Stages and Temperature:**

| Sleep Stage | Thermoregulation Status | Temperature Sensitivity |
|---|---|---|
| NREM Stage 1-2 (Light) | Active thermoregulation | Moderate -- body can adjust |
| NREM Stage 3 (Deep/SWS) | Active; brain and core cooling | Low -- body actively cooling |
| REM Sleep | **Thermoregulation nearly suspended** | **High -- vulnerable to ambient temperature** |

**Critical finding:** During REM sleep, the body nearly stops regulating temperature. The brain reduces thermoregulation to power REM-related functions. This means:
- Room temperature matters most during REM sleep
- Too hot or too cold environments reduce REM duration
- Fan speed adjustments are most impactful during REM periods

### 3.4 Optimal Temperature Ranges

| Source | Recommended Range |
|---|---|
| Sleep Foundation | 60-67 deg F (15.6-19.4 deg C) |
| Cleveland Clinic | 60-67 deg F (15.6-19.4 deg C) |
| Most doctors | 65-68 deg F (18.3-20 deg C) |
| Research consensus | 16-24 deg C (60-75 deg F) with optimal around 18-20 deg C |

**With fan airflow:** Research shows that 29 deg C (84 deg F) with 0.4 m/s airflow achieves the same comfort as 26 deg C (79 deg F) without airflow, reducing HVAC energy by 25.3%.

**Air velocity guidelines for sleep:**
- Steady air velocities below **0.9 m/s** are preferred for sleeping comfort
- **0.4 m/s** is the optimal velocity in warm environments (29 deg C)
- **0.8 m/s** allows older adults to remain comfortable at 3 deg C above neutral temperature
- Above 0.9 m/s, cooling benefit diminishes and discomfort from direct airflow increases

### 3.5 Posture-to-Fan-Speed Mapping (Proposed Logic)

Based on the research, a mapping from detected posture to fan behavior:

| Detected Posture | Thermal Implication | Suggested Fan Action |
|---|---|---|
| Supine, limbs spread | Likely warm; maximizing heat dissipation | Medium-high speed |
| Supine, arms at sides | Neutral | Medium speed |
| Lateral, blanket on | Comfortable/slightly cool | Low-medium speed |
| Lateral, limbs exposed | Warm | Medium speed |
| Prone | Heat trapped; may feel warm | Medium-high speed |
| Fetal/curled | Likely cold; self-insulating | Low speed or off |
| Limbs outside blanket | Hot | Increase speed |
| Fully under blanket, curled | Cold | Decrease speed or off |
| Frequent position changes | Discomfort/restlessness | Adjust toward neutral |

---

## 4. Fan Control Systems and IoT Protocols

### 4.1 Communication Protocols

| Protocol | Range | Power | Speed | Best For |
|---|---|---|---|---|
| **WiFi (802.11)** | 30-50m | High | Fast | Direct cloud/HA connection |
| **MQTT (over WiFi)** | Network-wide | Medium | Fast | Lightweight pub/sub messaging; ideal for sensor-to-actuator |
| **Zigbee** | 10-20m (mesh) | Very Low | Medium | Battery devices, mesh networks |
| **Z-Wave** | 30m (mesh) | Low | Medium | Smart home automation |
| **Bluetooth/BLE** | 10m | Very Low | Medium | Wearable-to-hub |
| **ESPHome** | WiFi range | Medium | Fast | Home Assistant native integration |
| **Matter** | Varies | Varies | Fast | Emerging universal smart home standard |

**Recommended for this application:** MQTT over WiFi (via ESP32) or ESPHome for Home Assistant integration.

### 4.2 Smart Fan Control Hardware

#### SONOFF iFan03/iFan04
- **Type:** WiFi ceiling fan and light controller
- **Price:** ~$15-25
- **Control:** 3 fan speeds + light dimming
- **Integration:** eWeLink app, Alexa, Google Home, Home Assistant (via Sonoff LAN or custom firmware)
- **Voltage:** iFan04 supports both 110V and 220V
- **Custom firmware:** Can be flashed with Tasmota or ESPHome for local control

#### Inovelli Blue Series (Zigbee)
- **Type:** Zigbee 3.0 smart fan switch
- **Control:** 4-speed fan control
- **Integration:** Native Zigbee, Home Assistant via ZHA or Zigbee2MQTT

#### Tuya-Based WiFi Fan Controllers
- **Type:** Generic WiFi fan controller modules
- **Integration:** Tuya cloud, Local Tuya (Home Assistant), can be flashed with custom firmware
- **Limitation:** Some models have limited speed steps (low/medium/high only)

#### ESP32 + MOSFET (DIY PWM Control)
- **Type:** Custom DC fan speed controller
- **PWM Frequency:** 25 kHz (above audible range)
- **Resolution:** 0-255 duty cycle (256 speed levels)
- **Hardware:** ESP32 ($5-10) + MOSFET/transistor + flyback diode
- **RPi PWM pins:** GPIO 12, 13, 18, 19 support hardware PWM (2 channels)
- **Integration:** MQTT, ESPHome, HTTP API
- **Cost:** ~$10-20 for complete circuit
- **Note:** For AC ceiling fans, requires a TRIAC dimmer circuit or relay-based speed control

### 4.3 Smart Fan Products with APIs

| Product | API/Control | Price Range | Smart Features |
|---|---|---|---|
| **Dreo Tower Fans** | WiFi, Google Home, Alexa | $80-200 | Auto mode (temp-based), sleep mode (25dB), 12 speeds |
| **Dyson Pure Cool** | WiFi, Dyson Link app | $300-600 | Auto mode, air quality sensor, sleep timer |
| **Big Ass Fans Haiku** | WiFi, SenseME, Alexa | $400-800 | Built-in motion/temp sensors, adaptive speed |
| **Hunter Signal** | WiFi, Hunter app | $200-400 | SIMPLEconnect WiFi, reversible |
| **Bond Bridge** | WiFi, RF-to-WiFi bridge | $80-100 | Controls existing RF ceiling fans via API |

### 4.4 Home Assistant Integration Architecture

```
[Posture Sensor] --> [Processing Unit (RPi/ESP32)] --> [MQTT Broker]
                                                            |
                                                    [Home Assistant]
                                                            |
                                              [Fan Controller (ESPHome/MQTT)]
                                                            |
                                                     [Physical Fan]
```

Home Assistant provides:
- **Blueprints** for adaptive fan speed control based on temperature
- **Automation YAML** for complex multi-sensor logic
- **MQTT integration** for custom sensors
- **ESPHome** for native ESP32 device management
- Integration with **Eight Sleep**, **Oura Ring**, **Withings** for sleep stage data

---

## 5. Similar Products and Projects

### 5.1 Commercial Products in Adjacent Space

#### Eight Sleep Pod ($2,295-$3,595)
- Active mattress heating/cooling system
- Built-in sleep tracking (stages, HR, HRV, breathing)
- Adjusts temperature per sleep stage
- Home Assistant integration available (custom component on GitHub)
- Does NOT control fans -- controls mattress temperature directly

#### Dreo Smart Fans
- Auto Mode adjusts fan speed based on room temperature sensor
- Sleep Mode reduces to 25dB operation
- 12 speed levels, WiFi connected
- Does NOT detect posture -- purely temperature-based

#### Amazon Halo Rise ($139, discontinued)
- Bedside 60GHz radar sleep tracker
- Tracked sleep stages, movement, breathing
- Could trigger Alexa routines (including fan control)
- Demonstrated the concept but discontinued in 2024

#### Big Ass Fans Haiku
- Built-in occupancy and temperature sensors
- SenseME technology auto-adjusts speed
- Does NOT detect sleep posture

### 5.2 Open Source Projects

#### Fan Control (Raspberry Pi)
- **fanpico** (GitHub: tjko/fanpico): Open source programmable PWM fan controller
- **raspberry-pi-pwm-fan-control** (GitHub: tedsluis): RPi PWM fan control with temperature
- **esp32-fan-controller** (GitHub: KlausMu): ESP32 fan controller with temp sensor and MQTT
- **pi_fan_ctrl** (GitHub: artivis): Simple RPi fan control

#### Sleep Posture Detection
- **MediaPipe Pose** (GitHub: google-ai-edge/mediapipe): Google's pose estimation framework
- **Raspberry Pi posture detection setup** (GitHub Gist: sanskaromar): Guide for RPi 3B/4 posture detection setup

#### Sleep Tracking + Home Assistant
- **eight-sleep HA integration** (GitHub: grantnedwards/eight-sleep): Custom Home Assistant integration for Eight Sleep
- **Oura Ring v2 HA integration** (Home Assistant Community): OAuth2-based integration with 30+ sensors
- **Seeed 60GHz mmWave ESPHome** (HA Community): ESPHome integration for Seeed mmWave modules

#### Notable Gap
There is **no existing open-source project** that combines sleep posture detection with automatic fan speed control as an integrated system. This represents an opportunity for a novel open-source contribution.

### 5.3 Research Prototypes

- **Opensource.com RPi temperature regulator:** A Raspberry Pi project to regulate room temperature for better children's sleep using temperature sensors and fan/heater control
- **Raspberry Pi-Based Sleep Posture Recognition (AIoT):** Uses RFID tags in bed sheets with random forest ML on RPi, uploads via WiFi

---

## 6. Practical Considerations

### 6.1 Privacy Concerns

#### Camera-Based Systems
- **Major concern:** A privacy law professor described bedroom surveillance technology as "as creepy as Silicon Valley gets"
- **GDPR implications:** Sleep data is personal data; requires explicit consent, data minimization, security measures
- **Mitigation strategies:**
  - Process all video locally on-device (edge AI); never transmit raw video
  - Use skeleton/landmark extraction only (discard raw frames immediately)
  - IR camera (less identifiable than RGB)
  - Physical indicator light when camera is active
  - Hardware kill switch for camera
- **Multi-person concern:** Other people in bedroom may not consent

#### Privacy-Preserving Alternatives (Ranked)
1. **mmWave radar** -- No visual data captured; only RF reflections
2. **Pressure mat** -- Only pressure distribution; no identifying information
3. **Wearable IMU** -- Personal device; data stays with user
4. **Camera with on-device processing** -- Least private but most detailed

### 6.2 Cost Analysis

| Approach | Components | DIY Cost | Notes |
|---|---|---|---|
| **Camera + RPi** | IR camera + RPi 4 + fan relay | $75-150 | Cheapest full solution; privacy concerns |
| **mmWave + ESP32** | Seeed MR60BHA2 + ESP32 + fan controller | $50-100 | Best privacy/cost balance |
| **Pressure Mat (DIY)** | 6-15 FSR sensors + Arduino + fan controller | $80-200 | Good accuracy; complex wiring |
| **Pressure Mat (Commercial)** | Withings Sleep + Home Assistant + smart fan | $200-400 | Easiest setup; limited posture data |
| **Wearable + Smart Fan** | Oura Ring + Home Assistant + Dreo fan | $400-600 | Most data; requires wearing device |
| **Full Commercial** | Eight Sleep Pod + smart fan automation | $2,500+ | Premium; most features |

### 6.3 Reliability and Accuracy Trade-offs

| Method | Controlled Accuracy | Real-World Accuracy | Failure Modes |
|---|---|---|---|
| **Camera** | 90-93% | 70-85% | Occlusion by blankets, lighting changes, multiple people |
| **Pressure Mat** | 88-99% | 85-95% | Sensor drift, mattress type dependency, partner movement |
| **Wearable** | 80-99% | 75-90% | Must remember to wear, battery life, vibration noise |
| **mmWave Radar** | 84-94% | 80-90% | Multiple people, wall reflections, limited posture detail |

**Key reliability factors:**
- **Blanket occlusion** is the biggest challenge for camera systems in real bedrooms
- **Sensor drift** affects pressure mats over months of continuous use
- **Battery life** limits wearables (Oura Ring: ~7 days)
- **Multi-person** scenarios degrade radar and camera accuracy significantly

### 6.4 Latency and Response Time

For sleep comfort, **latency is not critical** (unlike gaming or safety systems):
- Posture changes take 3-10 seconds to complete
- Thermal comfort response is gradual (minutes)
- A **30-60 second response window** is perfectly acceptable
- This relaxed timing requirement makes all detection methods viable

### 6.5 Power Consumption

| Component | Typical Power | Notes |
|---|---|---|
| Raspberry Pi 4 | 3-6W | Always-on processing unit |
| ESP32 | 0.1-0.5W | WiFi active |
| IR Camera | 0.5-2W | Always-on during sleep |
| mmWave module | 0.3-1W | Always-on during sleep |
| Smart fan controller | 0.5-2W | Standby + relay switching |
| **Total system** | **4-12W** | Negligible energy cost (~$5-15/year) |

---

## 7. Recommended Architecture for a Home System

### 7.1 Tier 1: Minimum Viable System ($50-100)

```
Seeed MR60BHA2 mmWave Module ($23)
    |
    | (UART Serial)
    v
ESP32-C6 / XIAO ESP32 ($8-15)
    |
    | (WiFi/MQTT or ESPHome)
    v
Home Assistant (existing server or RPi)
    |
    | (WiFi/MQTT)
    v
SONOFF iFan04 ($20) or ESP32+MOSFET relay ($15)
    |
    v
Existing Ceiling Fan
```

**Features:** Sleep posture (basic: supine/lateral/prone), breathing rate, presence detection, 3-speed fan control.

### 7.2 Tier 2: Enhanced System ($150-300)

Add to Tier 1:
- **DHT22/BME280 temperature/humidity sensor** ($5-10) -- ambient conditions
- **Dreo Smart Tower Fan** ($100-150) -- 12-speed WiFi fan with quiet operation
- **Additional mmWave module** for multi-zone or partner-side detection
- Custom Home Assistant automation combining:
  - Posture data (mmWave)
  - Room temperature
  - Time of night (sleep stage estimation)
  - Historical comfort preferences (ML-based)

### 7.3 Tier 3: Premium Research System ($400-800)

Add to Tier 2:
- **Oura Ring** or **Eight Sleep** for ground-truth sleep stage data
- **Pressure mat** (6-sensor DIY or Withings) for posture validation
- **Dual mmWave sensors** for partner differentiation
- Custom ML model trained on individual sleep patterns
- Dashboard with sleep quality metrics and fan optimization analytics

### 7.4 Software Stack Recommendation

| Layer | Technology | Purpose |
|---|---|---|
| Sensor firmware | ESPHome / Arduino | mmWave data acquisition |
| Communication | MQTT (Mosquitto broker) | Lightweight message passing |
| Automation | Home Assistant | Rule engine, scheduling, UI |
| ML/Logic | Python (on RPi or HA addon) | Posture classification, comfort model |
| Visualization | Home Assistant Lovelace / Grafana | Dashboards, history |
| Fan control | ESPHome / Tasmota | PWM or relay control |

---

## 8. Sources

### News Coverage
- [Bengaluru Engineer Creates AI Fan System - StoryPick](https://storypick.com/bengaluru-techie-build-ai-fan-system/)
- [AI Fan Turns On/Off Based on Sleeping Position - NewsBytes](https://www.newsbytesapp.com/news/science/this-ai-fan-turns-onoff-based-on-your-sleeping-position/tldr)
- [Man Creates AI Roommate for Fan Control - Tribune India](https://www.tribuneindia.com/news/trending/tired-of-waking-up-at-3-am-man-creates-ai-roommate-to-control-ceiling-fan-while-sleeping/)
- [Indian Tech Geek Builds AI Smart Fan - Mugglehead](https://mugglehead.com/indian-tech-geek-builds-ai-powered-smart-fan-that-adjusts-with-his-body-position/)

### Academic Papers
- [Sleep Posture Detection via Embedded ML on Reduced Pressure Sensors - MDPI Sensors 2025](https://www.mdpi.com/1424-8220/25/2/458)
- [Raspberry Pi-Based Sleep Posture Recognition (AIoT) - MDPI Healthcare 2022](https://www.mdpi.com/2227-9032/10/3/513)
- [CNN+LSTM+MediaPipe Sleep Posture Analysis - IJACSA 2025](https://thesai.org/Publications/ViewPaper?Volume=16&Issue=10&Code=IJACSA&SerialNo=13)
- [Smart Pressure e-Mat for Sleep Posture Detection - ArXiv 2023](https://arxiv.org/html/2305.11367)
- [Dual Fusion Sleep Posture Recognition via Air Mattress - Nature Scientific Reports 2024](https://www.nature.com/articles/s41598-024-61267-0)
- [Innovative Fan Control Strategy for Comfort Sleeping - ScienceDirect 2022](https://www.sciencedirect.com/science/article/abs/pii/S2451904922002761)
- [Predicting Thermal Comfort During Sleep with Air Velocity - Building & Environment 2022](https://www.sciencedirect.com/science/article/abs/pii/S0360132322007090)
- [Optimizing Bedroom Thermal Environment Review - ScienceDirect 2023](https://www.sciencedirect.com/science/article/pii/S2666123323000570)
- [Effect of Posture on Heat Transfer Areas - ScienceDirect 2007](https://www.sciencedirect.com/science/article/abs/pii/S0360132307001783)
- [Effect of Postural Changes on Body Temperatures - Springer 1996](https://link.springer.com/article/10.1007/BF00242275)
- [Sleep and Thermoregulation - PMC 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7323637/)
- [Temperature Dependence of Sleep - PMC 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6491889/)
- [Sleep Positions and Nocturnal Body Movements - PMC 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5677378/)
- [Benchmarking Accelerometer vs CNN Vision for Sleep Posture - MDPI Sensors 2025](https://www.mdpi.com/1424-8220/25/12/3816)
- [Wearable IMUs for Sleep Biomechanics - PMC 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC9844380/)
- [Accuracy of 11 Consumer Sleep Trackers - PMC 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10654909/)
- [Millimeter-wave Radar Sleep Posture Transition Dataset - ScienceDirect 2025](https://www.sciencedirect.com/science/article/pii/S2352340925002033)
- [Vital Sign and Sleep Monitoring Using mmWave - ACM TOSN 2017](https://dl.acm.org/doi/10.1145/3051124)
- [Smart Detection Method for Sleep Posture via Flexible Monitoring Belt - Cell/Heliyon 2024](https://www.cell.com/heliyon/fulltext/S2405-8440(24)07870-8)

### MIT BodyCompass
- [BodyCompass Project Page - MIT CSAIL](https://people.csail.mit.edu/scyue/projects/bodycompass/)
- [Monitoring Sleep Positions for a Healthy Rest - MIT News](https://news.mit.edu/2020/monitoring-sleep-sensors-0911)

### Sleep Science
- [Best Temperature for Sleep - Sleep Foundation](https://www.sleepfoundation.org/bedroom-environment/best-temperature-for-sleep)
- [What Is the Ideal Sleeping Temperature - Cleveland Clinic](https://health.clevelandclinic.org/what-is-the-ideal-sleeping-temperature-for-my-bedroom)
- [Thermoregulation and Sleep - Ultrahuman Blog](https://blog.ultrahuman.com/blog/role-of-thermoregulation-in-sleep/)

### Technology and Products
- [MediaPipe Pose Documentation - GitHub](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.md)
- [OpenPose vs MediaPipe Comparison - Saiwa](https://saiwa.ai/blog/openpose-vs-mediapipe/)
- [Seeed Studio 60GHz mmWave Module](https://www.seeedstudio.com/60GHz-mmWave-Radar-Sensor-Breathing-and-Heartbeat-Module-p-5305.html)
- [TI 60GHz Radar Sensors for Healthcare - TI Application Brief](https://www.ti.com/lit/an/swra810/swra810.pdf)
- [ESP32 PWM Fan Speed Control with Home Assistant - esp32.co.uk](https://esp32.co.uk/esp32-pwm-fan-speed-control-5-12v-dc-with-home-assistant-complete-2025-guide/)
- [ESP32 Fan Controller with MQTT - GitHub: KlausMu](https://github.com/KlausMu/esp32-fan-controller)
- [SONOFF iFan04 Product Page](https://sonoff.tech/en-us/products/sonoff-ifan04-wi-fi-ceiling-fan-and-light-controller)
- [Dreo Smart Tower Fan 519S Review - TechRadar](https://www.techradar.com/home/air-quality/dreo-smart-tower-fan-519s-review)
- [Eight Sleep Pod](https://www.eightsleep.com/)
- [Inovelli Blue Series Zigbee Fan Switch](https://inovelli.com/products/blue-series-fan-switch-zigbee-3-0)
- [FSR Sensors for Smart Mattresses - SOUSHINE](https://www.fsrexpert.com/force-sensing-for-smart-mattresses/)

### Home Assistant and Integration
- [Adaptive Fan Speed Control Blueprint - HA Community](https://community.home-assistant.io/t/adaptive-fan-speed-control-based-on-temperature-and-speed-range/678152)
- [HA Blueprint for Fan Speed by Temperature - GitHub Gist](https://gist.github.com/danijelst/4c105df89263037960e83cebfdbeb326)
- [Eight Sleep HA Integration - GitHub](https://github.com/grantnedwards/eight-sleep)
- [Oura Ring v2 HA Integration - HA Community](https://community.home-assistant.io/t/oura-ring-v2-custom-integration-track-your-sleep-readiness-activity-in-home-assistant/944424)
- [Seeed 60GHz mmWave ESPHome Integration - HA Community](https://community.home-assistant.io/t/seeed-60ghz-mmwave-integration-using-esphome/533442)
- [PWM Fan Control with ESP32 - HA Community](https://community.home-assistant.io/t/pwm-fan-control-with-esp32/222869)

### Privacy
- [Privacy Concerns with Smart Sleep Tracking - Smart Life Simplified](https://smartlifesimplified.com/exploring-privacy-concerns-with-smart-sleep-tracking-devices/)
- [Privacy Risks of Sleep-Tracking Devices - Infosec Resources](https://resources.infosecinstitute.com/topic/privacy-risks-sleep-tracking-devices/)
- [Radar Sleep Trackers: Privacy Nightmare? - Lexology](https://www.lexology.com/library/detail.aspx?g=c5094cfb-b451-467b-a9a6-f7662e717001)

### Open Source Projects
- [Fanpico: Open Source PWM Fan Controller - GitHub](https://github.com/tjko/fanpico)
- [RPi PWM Fan Control - GitHub](https://github.com/tedsluis/raspberry-pi-pwm-fan-control)
- [RPi Fan Controller - GitHub: Howchoo](https://github.com/Howchoo/pi-fan-controller)
- [RPi Temperature Regulator for Sleep - Opensource.com](https://opensource.com/life/16/3/how-i-use-raspberry-pis-help-my-kids-sleep-better)

---

*This report was compiled from web searches conducted on February 25, 2026. Product availability, pricing, and specifications may change.*

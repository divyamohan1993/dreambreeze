# Getting Started

## Prerequisites

- **Node.js** 18 or higher (20 recommended)
- **npm**, yarn, or pnpm
- A modern browser (Chrome, Edge, Firefox, Safari)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/divyamohan1993/dreambreeze.git
cd dreambreeze

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) -- you're in.

## Demo Mode

**No hardware? No problem.** DreamBreeze runs in full demo mode out of the box.

Demo mode simulates:
- Accelerometer data (posture changes every few minutes)
- Sleep stage transitions (realistic 90-minute cycles)
- Fan speed responses (visual feedback without a real fan)
- Weather data (sample conditions)
- Sound generation (actual audio via Web Audio API)

No environment variables, no accounts, no configuration needed for demo mode.

## Environment Variables

For full functionality with cloud features, create a `.env.local` file:

```bash
# Supabase (optional -- app works without these in demo mode)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup (Optional)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the project URL and anon key from Settings > API
4. Add them to `.env.local`
5. Run the database migrations (see `supabase/` directory if present)

Supabase enables:
- User authentication (email/password, OAuth)
- Cloud backup of sleep session summaries
- Cross-device sync
- Sleep history persistence

## Production Build

```bash
# Create optimized build
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
|-- app/                    # Next.js App Router
|   |-- page.tsx            # Landing page
|   |-- app/
|       |-- page.tsx        # Main dashboard
|       |-- sleep/page.tsx  # Active sleep session
|       |-- history/page.tsx # Sleep analytics
|       |-- settings/page.tsx # Configuration
|       |-- privacy/page.tsx # Privacy vault
|-- components/
|   |-- fan/                # Fan visualization
|   |-- ui/                 # Cards, banners, selectors
|   |-- charts/             # Data visualizations
|   |-- layout/             # App shell, navigation
|-- hooks/                  # React hooks
|-- lib/
|   |-- ai/                 # Blackboard + 4 agents
|   |-- audio/              # Sound engine
|   |-- fan/                # MQTT/webhook controllers
|   |-- privacy/            # Consent + compliance
|   |-- sensors/            # DeviceMotion adapter
|   |-- weather/            # Weather service
|   |-- supabase/           # Database client
|-- stores/                 # Zustand state
```

## Routes

| Route | Description |
|-------|------------|
| `/` | Landing page with product story |
| `/app` | Main dashboard -- fan controller, AI cards, weather |
| `/app/sleep` | Active sleep session -- bedside display |
| `/app/history` | Sleep analytics and trend charts |
| `/app/settings` | Fan integration, sound preferences, profiles |
| `/app/privacy` | Privacy vault -- data control center |
| `/demo` | 60-second night simulation |
| `/pitch` | Investor pitch deck |

## Smart Fan Integration

DreamBreeze supports three fan control modes:

### 1. Demo Mode (Default)
No setup needed. Fan visualization responds to AI decisions visually.

### 2. MQTT
For smart fans that support MQTT protocol:
1. Go to Settings > Fan Integration
2. Enter your MQTT broker URL (e.g., `mqtt://192.168.1.100:1883`)
3. Enter the topic your fan listens on
4. DreamBreeze publishes speed values (0-100) to that topic

### 3. Webhook
For fans controlled via HTTP API:
1. Go to Settings > Fan Integration
2. Enter the webhook URL
3. DreamBreeze sends POST requests with `{ "speed": 0-100 }` payload

## Using on a Phone

For the best experience:
1. Open the app in your phone's browser
2. Install it as a PWA (Add to Home Screen)
3. Place your phone face-down on the mattress
4. The accelerometer detects your posture through mattress movement

### iOS Notes
- Safari requires a one-time DeviceMotion permission grant
- The app will prompt for this permission before starting a sleep session

### Android Notes
- Chrome grants DeviceMotion access automatically on HTTPS
- The PWA install prompt appears after your second visit

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Fan visualization not moving | Check that you're not in a static demo state -- start a sleep session |
| No sound playing | Tap the screen once -- browsers require user interaction before audio playback |
| Weather card shows "unavailable" | Enable location access or check internet connection |
| PWA not installable | Ensure you're accessing via HTTPS (not localhost) |
| MQTT not connecting | Verify broker URL and port, check firewall settings |

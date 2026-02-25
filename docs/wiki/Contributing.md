# Contributing

DreamBreeze is open source and contributions are welcome. This guide helps you get started.

## How to Contribute

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/your-feature`
4. **Make** your changes
5. **Test**: Ensure `npm run lint` and `npm run build` pass
6. **Commit** with a descriptive message: `git commit -m "feat: add your feature"`
7. **Push** to your fork: `git push origin feature/your-feature`
8. **Open** a Pull Request against `main`

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/dreambreeze.git
cd dreambreeze
npm install
npm run dev
```

## Code Style

### TypeScript
- Strict mode enabled
- Prefer `const` over `let`
- Use type annotations for function parameters and return types
- Prefer interfaces over type aliases for object shapes
- No `any` -- use `unknown` if the type is genuinely unknown

### React
- Functional components only
- Hooks for all state and effects
- Prefer composition over inheritance
- Keep components focused -- one responsibility per component

### Naming Conventions
- **Files**: kebab-case (`sleep-debt.ts`, `posture-agent.ts`)
- **Components**: PascalCase (`WeatherCard.tsx`, `SleepDebtCard.tsx`)
- **Functions**: camelCase (`calculateSleepDebt`, `getWeatherData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FAN_SPEED`, `DEFAULT_PROFILE`)
- **Types/Interfaces**: PascalCase (`SleepContext`, `AgentHypothesis`)

### CSS
- Tailwind CSS v4 utility classes
- No custom CSS unless absolutely necessary
- Glassmorphism and skeuomorphic design language
- Dark theme by default (sleep app -- designed for nighttime use)

## Commit Messages

Follow conventional commits:

```
feat: add temperature cycling profile selector
fix: correct REM detection threshold in posture agent
docs: update wiki architecture page
refactor: simplify blackboard conflict resolution
test: add unit tests for sleep debt calculator
chore: update dependencies
```

## Pull Request Guidelines

- **One feature or fix per PR** -- keep them focused
- **Descriptive title** -- summarize the change in one line
- **Body** -- explain what changed, why, and how to test it
- **Link issues** -- reference any related GitHub issues
- **Screenshots** -- include before/after for UI changes
- Ensure `npm run lint` passes with no errors
- Ensure `npm run build` completes successfully

## Areas Where Help Is Needed

### Hardware Testing
- MQTT integration with real smart fans (various brands)
- Tuya, Tasmota, ESPHome device testing
- Bluetooth fan control exploration
- Real accelerometer posture detection accuracy on different phone models and mattress types

### Sleep Science
- Improving posture classification accuracy with ML
- Better sleep stage estimation from movement data
- Validating Two-Process Model parameter tuning
- Research on additional ambient factors (light, noise levels)

### User Experience
- Accessibility improvements (screen reader support, high contrast)
- Localization (translations to other languages)
- Onboarding flow optimization
- Sleep report design and data visualization

### Platform
- iOS Safari DeviceMotion permission flow improvements
- Android PWA install prompt optimization
- Offline-first data sync strategy
- Battery optimization for overnight use

### Documentation
- Additional wiki pages for specific topics
- Video tutorials and walkthroughs
- API documentation for custom agent development
- Sleep science reference expansion

## Architecture Guidelines

When adding new features, follow these patterns:

### New AI Agent
1. Create agent file in `src/lib/ai/agents/`
2. Implement the agent interface (read context, post hypothesis)
3. Register with the blackboard controller
4. Add priority and conflict resolution rules
5. Update the `useBlackboard` hook if UI feedback is needed

### New UI Component
1. Create component in `src/components/ui/`
2. Follow the existing glassmorphism design system
3. Use Motion for animations
4. Keep components self-contained (props in, rendered output out)
5. Dark theme by default

### New Integration
1. Create service in `src/lib/`
2. Implement with a clean interface (easy to mock for testing)
3. Add fallback/demo mode behavior
4. Document in the API-and-Integration wiki page

## Code of Conduct

- Be respectful and constructive
- Focus on the idea, not the person
- Welcome newcomers warmly
- Assume good intent

## Questions?

Open a GitHub issue with the `question` label or start a discussion in the Discussions tab.

# ADR-005: Mobile App Technology Choice

**Status:** ACCEPTED  
**Date:** April 14, 2026  
**Deciders:** Frontend Agent, Lead Architect  
**Consulted:** Backend Agent, DevOps Agent, QA Agent  
**Informed:** All agents

## Context

Week 5 requires shipping iOS and Android mobile apps rapidly to meet pilot school demand (#1 feature request: 9/10 importance). We need to evaluate cross-platform frameworks to minimize development time while maintaining sufficient native performance.

**Key Requirements:**
- Shared codebase for iOS & Android
- Fast development velocity (complete in 5 days)
- Native performance acceptable for typical use cases
- Existing team expertise leverage
- Offline data caching support
- Push notifications

**Options Evaluated:**
1. **React Native** - JavaScript/TypeScript, existing team knowledge, large ecosystem
2. **Flutter** - Dart, smaller ecosystem, excellent performance
3. **Native Split** - Separate iOS (Swift) and Android (Kotlin) teams
4. **Hybrid** - Web wrapper (Cordova/Ionic), fastest but poorest performance

## Decision

**We adopt React Native** for mobile app development.

### Rationale

1. **Shared JavaScript Knowledge Base**
   - Team already proficient in React/TypeScript for web
   - Redux/RTK Query patterns reusable from web app
   - Single testing framework (Jest, React Testing Library)
   - Onboarding faster for new frontend engineers

2. **Development Velocity**
   - ~80% code reuse between iOS and Android
   - Existing component patterns (buttons, cards, modals) transferable
   - Hot reload development cycle (similar to web)
   - 5-day timeline achievable with focused scope

3. **Ecosystem Maturity**
   - React Navigation production-ready (5+ years)
   - AsyncStorage widely used for caching
   - React Native Paper (Material Design) mature
   - Community libraries extensive

4. **Team Context**
   - Frontend team already familiar with React patterns
   - No need to hire Dart/Flutter specialists
   - Can add native modules (Swift/Kotlin) if needed later
   - Reduced training overhead

5. **Business Viability**
   - Tools & infrastructure cheaper than maintaining two native teams
   - Faster time-to-market for future features
   - Smaller technical debt compared to native alternatives

## Architecture

```
apps/mobile/
├── src/
│   ├── screens/
│   │   ├── AuthStack/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── OTPScreen.tsx
│   │   ├── AppStack/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── AttendanceScreen.tsx
│   │   │   ├── GradesScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   └── Navigation.tsx
│   ├── redux/
│   │   ├── authSlice.ts
│   │   ├── attendanceSlice.ts
│   │   ├── gradesSlice.ts
│   │   └── store.ts (reused from web)
│   ├── components/
│   │   ├── buttons/
│   │   ├── cards/
│   │   └── charts/
│   ├── services/
│   │   ├── apiClient.ts (shared with web)
│   │   ├── firestore.ts
│   │   └── offline.ts (AsyncStorage)
│   ├── utils/
│   │   └── formatters.ts (shared)
│   └── App.tsx
├── Gemfile (Fastlane)
├── app.json (Expo config)
└── package.json
```

## Implementation Details

### Technology Stack

```json
{
  "dependencies": {
    "react-native": "0.73.x",
    "react": "18.x",
    "@react-native-community/async-storage": "1.1.x",
    "react-native-paper": "5.x",
    "react-navigation": "6.x",
    "@react-navigation/native": "6.x",
    "@react-navigation/bottom-tabs": "6.x",
    "@redux-devtools-extension": "2.x",
    "redux": "4.x",
    "@reduxjs/toolkit": "1.x",
    "@reduxjs/toolkit/query": "1.x",
    "zod": "3.x"
  },
  "devDependencies": {
    "expo": "49.x",
    "expo-cli": "6.x",
    "fastlane": "2.x",
    "@testing-library/react-native": "12.x",
    "@types/react-native": "0.72.x",
    "typescript": "5.x"
  }
}
```

### Build & Deployment

```bash
# Local development (Expo CLI)
npm run dev:ios  # iOS simulator
npm run dev:android  # Android emulator

# Build production binaries (Fastlane)
fastlane ios build  # Generates .ipa for TestFlight
fastlane android build  # Generates .aab for Play Store

# CI/CD automation (GitHub Actions)
# Triggers on tag: v1.0.0
# Builds, tests, and releases to both stores
```

## Consequences

### Positive
- ✅ Faster MVP delivery (5 days vs. 15+ for native)
- ✅ Leverages web team expertise
- ✅ Code sharing reduces maintenance burden
- ✅ Easier onboarding for new frontend developers
- ✅ Proven production track record (Shopify, Discord, Tesla)

### Negative
- ⚠️ Performance slightly slower than native (~5-15% in typical usage)
- ⚠️ Each OS update requires React Native updates
- ⚠️ Complex animations or AR features may require native code
- ⚠️ Debugging sometimes harder (JS<->Native bridge)
- ⚠️ Store approval processes may be unpredictable

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Performance issues | Profile early, optimize hot paths, use native modules if needed |
| OS compatibility | Keep React Native updated, test on multiple OS versions |
| Bridge bottlenecks | Design for batched API calls, implement offline-first |
| Store rejections | Follow guidelines carefully, have backup release plan |

## Alternatives Considered

### 1. Flutter (Rejected)
- **Pros:** Superior performance, single language, hot reload
- **Cons:** Team has zero Dart experience, larger learning curve, smaller ecosystem compared to React Native
- **Decision:** Technology better fit than team capabilities

### 2. Native Split (Rejected)
- **Pros:** Maximum performance, native UX patterns, optimal for complex features
- **Cons:** 2x development cost, 2x device testing, onboarding slower, recruitment harder
- **Decision:** Business timeline (5 days) incompatible with separate teams

### 3. Hybrid (Cordova/Ionic) (Rejected)
- **Pros:** Fastest initial development, web code reuse
- **Cons:** Poor performance, limited native API access, poor offline support
- **Decision:** Pilot school feedback requires native-quality UX

## Success Metrics

- Both iOS and Android running in simulators by Day 2
- 15+ unit tests passing by Day 3
- 80%+ code coverage by Day 5
- <2 second cold startup time
- Offline mode functional (24-hour cache)
- App Store review passed by Day 7

## References

- **PR #6:** Mobile App Foundation (React Native) - WEEK5_PR_DETAILED_PLANS.md
- **Related:** Mobile App Specification - 15_MOBILE_APP_SPECIFICATION.md
- **Pilot Schools:** Week 5 feedback analysis in WEEK5_MASTER_PLAN.md
- **Team Knowledge:** React architecture - 9_REACT_REDUX_ARCHITECTURE.md

## Future Revisions

- **Post-Week 5:** Evaluate native bridging for advanced features (AR camera, native payment)
- **Performance:** Profile against native equivalents, document gaps
- **Community:** Monitor React Native ecosystem for deprecations/upgrades


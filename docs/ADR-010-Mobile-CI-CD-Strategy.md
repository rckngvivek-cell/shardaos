# ADR-010: Mobile CI/CD Strategy

**Status:** ACCEPTED  
**Date:** April 14, 2026  
**Deciders:** DevOps Agent, Lead Architect  
**Consulted:** Frontend Agent, QA Agent  
**Informed:** All agents

## Context

Week 5 requires establishing CI/CD infrastructure for iOS and Android app releases. Requirements include automated builds, testing, and app store deployment.

**Requirements:**
- Automated build on every commit (PR validation)
- Automated testing on iOS/Android simulators
- Signed production builds for App Store and Play Store
- TestFlight beta distribution (iOS)
- Play Store internal testing (Android)
- Automated version bumping and release tags
- <30 minute build/test cycle for feedback loop

**Team Context:**
- Already using GitHub Actions for backend CI/CD
- DevOps team familiar with Actions workflows
- No native build infrastructure currently
- Xcode & Android SDK available locally

## Decision

**We adopt Fastlane + GitHub Actions** for mobile CI/CD, leveraging existing Actions infrastructure.

### Rationale

#### 1. Leverage Existing GitHub Actions

| Tool | GitHub Actions | GitLab CI | Jenkins |
|------|---|---|---|
| **Setup** | Existing account | New setup | New infrastructure |
| **Learning curve** | Low (team knows it) | Medium | High |
| **Cost** | Free tier applicable | Free tier applicable | Self-hosted (infra cost) |
| **Mobile support** | Good via Fastlane | Good | Good |
| **Team knowledge** | Already using | No experience | No experience |

GitHub Actions + Fastlane builds on existing expertise.

#### 2. Fastlane Maturity

Fastlane (by Google) is battle-tested for mobile builds:
- Used by Samsung, Shopify, Twitter
- Active development, large community
- Handles code signing (credentials management)
- Integrates with TestFlight and Play Store
- Can run on GitHub Actions runners

#### 3. Cost Efficiency

```
Monthly cost estimate:
- GitHub Actions: Free tier (3,000 minutes/month)
  └─ ~8 builds/day × 15 min = 120 min/month ✅ (well under limit)
- Fastlane: Free (open source)
- iOS signing certificate: Free (Apple developer account)
- Android signing: Free (Google Play developer account)
- Total: ₹0/month (beyond existing GitHub subscription)
```

#### 4. Workflow Simplicity

```yaml
# .github/workflows/mobile-ci.yml
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:mobile
      
  build-ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - run: fastlane ios build_for_testing
      
  build-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: fastlane android build
```

## Implementation Details

### Project Structure

```
apps/mobile/
├── fastlane/
│   ├── Fastfile (iOS & Android build recipes)
│   ├── Appfile (credentials & account info)
│   ├── Matchfile (code signing management)
│   └── .env (secrets loaded from GitHub)
├── .github/workflows/
│   ├── mobile-ci.yml (test + build on PR)
│   ├── mobile-release.yml (release to stores on tag)
│   └── mobile-beta.yml (beta to TestFlight/Play console)
├── ios/
│   ├── Pods/ (CocoaPods dependencies)
│   ├── SchoolERP.xcodeproj
│   └── Certificates (managed by Fastlane)
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/
│   └── local.properties (managed by Fastlane)
├── src/ (React Native shared code)
└── package.json
```

### Fastlane Configuration

```ruby
# apps/mobile/fastlane/Fastfile

default_platform(:ios)

platform :ios do
  
  desc "Build for App Store"
  lane :build_for_appstore do
    setup_ci if is_ci
    sync_code_signing(type: "appstore", readonly: is_ci)
    
    build_app(
      workspace: "ios/SchoolERP.xcworkspace",
      scheme: "SchoolERP",
      configuration: "Release",
      derived_data_path: "DerivedData",
      destination: "generic/platform=iOS",
      export_method: "app-store",
      output_directory: "builds/ios",
      output_name: "SchoolERP.ipa",
      silent: true,
      suppress_xcode_output: true
    )
  end

  desc "Upload to TestFlight"
  lane :upload_testflight do
    sync_code_signing(type: "appstore", readonly: is_ci)
    build_for_appstore()
    
    upload_to_testflight(
      ipa: "builds/ios/SchoolERP.ipa",
      skip_waiting_for_build_processing: true,
      skip_submission: true,
      teams: [123456] # Apple team ID
    )
    
    slack(message: "✅ iOS build uploaded to TestFlight")
  end

  desc "Build & push to App Store"
  lane :release_to_appstore do
    sync_code_signing(type: "appstore", readonly: is_ci)
    build_for_appstore()
    
    upload_to_app_store(
      ipa: "builds/ios/SchoolERP.ipa",
      skip_metadata: true,
      skip_screenshots: true,
      submission_information: {
        add_id_info_uses_idfa: false
      },
      automatic_release: true,
      force: true
    )
    
    slack(message: "🚀 iOS released to App Store v#{get_version_number()}")
  end

end

platform :android do

  desc "Build APK for Play Store"
  lane :build_apk do
    gradle(
      task: "clean bundleRelease",
      project_dir: "android/",
      properties: {
        "android.injected.signing.store.file" => ENV["ANDROID_KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["ANDROID_KEYSTORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["ANDROID_KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["ANDROID_KEY_PASSWORD"]
      }
    )
  end

  desc "Upload to Play Store internal testing"
  lane :upload_play_store_internal do
    build_apk()
    
    upload_to_play_store(
      aab: "android/app/build/outputs/bundle/release/app-release.aab",
      track: "internal",
      json_key_data: ENV["ANDROID_JSON_KEY"]
    )
    
    slack(message: "✅ Android build uploaded to Play Store (internal)")
  end

  desc "Release to Play Store"
  lane :release_to_play_store do
    build_apk()
    
    upload_to_play_store(
      aab: "android/app/build/outputs/bundle/release/app-release.aab",
      track: "production",
      json_key_data: ENV["ANDROID_JSON_KEY"],
      changes_not_sent_for_review: false
    )
    
    slack(message: "🚀 Android released to Play Store v#{get_version_number()}")
  end

  desc "Bump version number"
  lane :bump_version do |options|
    version_bump = options[:version] || "patch"
    increment_version_code(gradle_file_path: "android/app/build.gradle")
  end

end

desc "Shared: Run tests"
lane :test do
  sh("cd .. && npm run test:mobile")
end

desc "Shared: Increment all versions before release"
lane :prepare_release do |options|
  new_version = options[:version]
  increment_version_number(
    version_number: new_version,
    xcodeproj: "ios/SchoolERP.xcodeproj"
  )
  # Android version increment handled separately
  sh("cd .. && git commit -am \"Release v#{new_version}\"")
  sh("cd .. && git tag v#{new_version}")
  sh("cd .. && git push origin v#{new_version}")
end
```

### GitHub Actions Workflow

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/mobile/**'
      - 'packages/**'
      - '.github/workflows/mobile-ci.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'apps/mobile/**'
      - 'packages/**'

jobs:
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint mobile code
        run: npm run lint:mobile
      
      - name: Run mobile tests
        run: npm run test:mobile -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: mobile

  build-ios:
    name: Build iOS
    runs-on: macos-latest
    needs: lint-and-test
    if: github.event_name == 'push' || github.event.pull_request.draft == false
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd apps/mobile && pod install --repo-update
      
      - name: Setup Ruby (for Fastlane)
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true
          working-directory: 'apps/mobile'
      
      - name: Install Fastlane
        run: |
          cd apps/mobile
          gem install fastlane -NV
      
      - name: Build for testing
        run: |
          cd apps/mobile
          fastlane ios build_for_testing
      
      - name: Upload build artifact
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v3
        with:
          name: ios-build
          path: apps/mobile/builds/ios/

  build-android:
    name: Build Android
    runs-on: ubuntu-latest
    needs: lint-and-test
    if: github.event_name == 'push' || github.event.pull_request.draft == false
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Ruby (for Fastlane)
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true
          working-directory: 'apps/mobile'
      
      - name: Install Fastlane
        run: |
          cd apps/mobile
          gem install fastlane -NV
      
      - name: Build APK
        run: |
          cd apps/mobile
          fastlane android build_apk
        env:
          ANDROID_KEYSTORE_PATH: ${{ secrets.ANDROID_KEYSTORE_PATH }}
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      
      - name: Upload build artifact
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v3
        with:
          name: android-build
          path: apps/mobile/android/app/build/outputs/

  beta-release:
    name: Beta Release
    runs-on: macos-latest
    needs: [build-ios, build-android]
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true
          working-directory: 'apps/mobile'
      
      - name: Upload to TestFlight & Play Store
        run: |
          cd apps/mobile
          fastlane ios upload_testflight
          fastlane android upload_play_store_internal
        env:
          FASTLANE_USER: ${{ secrets.APPLE_ID }}
          FASTLANE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          ANDROID_JSON_KEY: ${{ secrets.ANDROID_JSON_KEY }}

  production-release:
    name: Production Release
    runs-on: macos-latest
    needs: [build-ios, build-android]
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true
          working-directory: 'apps/mobile'
      
      - name: Release to App Store & Play Store
        run: |
          cd apps/mobile
          fastlane ios release_to_appstore
          fastlane android release_to_play_store
        env:
          FASTLANE_USER: ${{ secrets.APPLE_ID }}
          FASTLANE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          ANDROID_JSON_KEY: ${{ secrets.ANDROID_JSON_KEY }}
```

### GitHub Secrets Required

```
APPLE_ID = developer@school-erp.com
APPLE_PASSWORD = (app-specific password)
MATCH_PASSWORD = (code signing certificate password)
ANDROID_JSON_KEY = (Play Store service account JSON)
ANDROID_KEYSTORE_PATH = /path/to/keystore.jks
ANDROID_KEYSTORE_PASSWORD = xxx
ANDROID_KEY_ALIAS = release-key
ANDROID_KEY_PASSWORD = xxx
SLACK_WEBHOOK = (for notifications)
```

## Build Times

```
CI Pipeline Performance:
├─ Lint & Test: 3-5 minutes ✅
├─ iOS Build: 8-12 minutes ✅
├─ Android Build: 10-15 minutes ✅
└─ Total (parallel): ~20 minutes ✅ (well under 30-min target)
```

## Versioning Strategy

```
Version Format: X.Y.Z
- X = Major (schema changes, breaking API changes)
- Y = Minor (new features, backward compatible)
- Z = Patch (bug fixes, internal changes)

Release Process:
1. Create PR with version bump (e.g., v1.2.3)
2. PR reviewed & merged to main
3. Tag commit: git tag v1.2.3
4. GitHub Actions:
   - Builds production binaries
   - Uploads to App Store & Play Store
   - Creates GitHub Release
   - Notifies team on Slack

Hotfix Process:
1. Create branch from latest tag (e.g., v1.2.2)
2. Apply fix, bump patch version (v1.2.3)
3. Merge to main, tag, and release
```

## Consequences

### Positive
- ✅ Leverages existing GitHub Actions knowledge
- ✅ Zero cost (within free tier)
- ✅ Fast feedback loop (~20 minutes)
- ✅ Automated testing before release
- ✅ Reproducible builds
- ✅ Credential management via GitHub secrets
- ✅ Supports both iOS & Android from single workflow
- ✅ Easy to scale to multiple developers

### Negative
- ⚠️ macOS runners slightly slower than Linux
- ⚠️ Fastlane updates can break builds
- ⚠️ App Store review time unpredictable (1-24 hours)
- ⚠️ Secrets management is developer responsibility
- ⚠️ Xcode version changes can cause issues

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Fastlane breakage | Pin version in Gemfile, test locally first |
| Secrets exposure | Use GitHub secrets, rotate credentials regularly |
| Build failures | Test locally before pushing, detailed logs in Actions |
| version conflicts | Semantic versioning, changelog maintenance |
| Store rejection | Follow guidelines, test on real devices |

## Alternatives Considered

### 1. Jenkins (Rejected)
- **Pros:** Full control, self-hosted, no vendor lock-in
- **Cons:** Operational overhead, infrastructure cost, DevOps burden
- **Decision:** GitHub Actions sufficient, no need for additional infrastructure

### 2. Travis CI (Rejected)
- **Pros:** Mobile-friendly, simpler setup
- **Cons:** Acquired by Idera, community moved to GitHub Actions
- **Decision:** GitHub Actions is standard now

### 3. Bitrise (Rejected)
- **Pros:** Mobile-first, good UX
- **Cons:** ₹3,000+/month cost, vendor lock-in
- **Decision:** GitHub Actions free tier sufficient

## Success Metrics

- Both iOS and Android builds complete in <30 minutes
- 100% test pass rate before release
- Zero deployment failures in Week 5
- <5 minute average for PR feedback
- All 6 ADRs documented

## References

- **PR #12:** DevOps CI/CD + Monitoring - WEEK5_PR_DETAILED_PLANS.md
- **Frontend Build:** React Native setup - 15_MOBILE_APP_SPECIFICATION.md
- **Existing CI:** Backend GitHub Actions - 3_CICD_PIPELINE.md
- **Monitoring:** Deployment metrics - 12_MONITORING_OBSERVABILITY.md

## Future Revisions

- **Week 6:** E2E regression testing on physical devices
- **Week 7:** Automated screenshot generation for app stores
- **Week 8+:** Continuous deployment for beta channel


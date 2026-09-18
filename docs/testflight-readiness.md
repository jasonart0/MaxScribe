# TestFlight verification — 2026-09-18

Status: local checks pass; the reported TestFlight blank screen still requires verification on an iPhone or iOS simulator. No signed IPA has been built or uploaded in this session.

## Changes prepared

- Keep one safe-area and gesture root mounted through onboarding and login. Seed the safe-area provider with native metrics, or temporary zero insets when the scene has not supplied metrics yet. This removes a render gate that otherwise hides all children until the first native inset event. It is a candidate fix for the reported blank screen, not a device-confirmed diagnosis.
- Guard Proceed, sample processing, and Generate Note against duplicate concurrent AI requests from rapid taps.
- Align the Expo release version with the native Xcode project: 1.0.1. The next local iOS build number is 2. EAS production uses remotely managed build numbers and auto-increments them.
- Preserve Expo 57.0.23 scene lifecycle support, microphone and Face ID permissions, and the datepicker plugin.
- Set the user-confirmed Expo owner to `jasonart`.

## Completed checks

| Check | Result |
| --- | --- |
| Clean install of merged package-lock.json | Pass; npm audit reported zero vulnerabilities |
| ESLint and TypeScript | Pass |
| Regression tests | 67 passed, zero failed |
| iOS, Android and Web release exports after startup change | Pass |
| Expo Doctor on merged dependencies/plugins | 21/21 passed |
| Final Expo iOS config introspection | Pass |
| Microphone / Face ID usage descriptions | Present |
| iOS scene manifest | Uses EXExpoAppSceneDelegate |
| Local EAS archive inspection | package-lock.json and source present; local credentials, node_modules and native project files excluded |
| Git whitespace check for prepared changes | Pass |
| Local browser onboarding, Continue/Get Started and login | Pass in isolated Chrome at localhost:8081; no console errors or uncaught page errors |

Regression coverage includes authentication failures, secure password storage, browser password-manager refusal, API response validation, native audio multipart requests, expired sessions, offline/timeouts, recording interruptions, pause/resume/stop, playback lifecycle, canceled dictation, clinical field preservation, failed encounter saves, and voice-to-transcript-to-note navigation/retry.

## Remaining release gates

- Verify native TestFlight startup with the installed build number, iOS version and device launch logs. Windows cannot run Xcode or the iOS simulator. Local web startup has now been observed in an isolated headless Chrome instance; the in-app browser connection itself remains unavailable.
- Build a signed iOS Release archive and cold-launch it on a device. Generated Hermes bundles are not a substitute for this check.
- Verify authenticated live transcription and encounter saving using an explicitly approved test account/patient. The automated API tests use mocked network boundaries; no live clinical record was saved.
- Confirm the intended EAS project. This workspace has no EAS project ID. The account is authenticated, but `eas init --non-interactive` could not find `@jasonart/MaxScribe`; no new project was created.

## Build paths

### Local blank screen after pulling dependencies

The running Metro server retained a stale dependency graph while `npm ci` replaced node_modules. Its log reported `Unable to resolve "../Expo.fx"` and `Unable to resolve "react"`, even though the installed files existed. The verified stale Expo process was stopped, and the server restarted with `npx expo start --clear --port 8081 --localhost`. Actual browser checks then passed through all three onboarding slides to the login screen with no runtime errors. Screenshots and machine-readable results are saved locally in `.expo/local-onboarding.png`, `.expo/local-login.png` and `.expo/local-startup-result.json`.

When pulling dependency changes, stop the running Expo server before `npm ci`, then restart with `npm start -- --clear` and reload the page. The inspected merge had no unresolved conflict entries. The remote dependency changes were Expo 57.0.22 to 57.0.23 plus expo-build-properties; its iOS scene setup and note-modal SafeAreaProvider changes are preserved.

### Existing Xcode upload workflow

On the Mac used to upload this app, sync these changes, run `npm ci`, and install the iOS pods. Open `ios/MaxScribe.xcworkspace`, clean the build folder, and archive the Release configuration. Confirm version 1.0.1 and a build number greater than the last uploaded build before uploading.

### EAS workflow

Link the correct existing project first. The production profile already uses store distribution and automatic build-number increments. Then:

```sh
eas build --platform ios --profile production --clear-cache
```

After the signed build and device startup checks pass, submit that specific build to TestFlight:

```sh
eas submit --platform ios --id <verified-build-id>
```

The EAS archive excludes local native files so the production build generates native projects from the current Expo plugins. Local Xcode builds use the tracked native projects instead.

## Device acceptance checks

1. Cold launch after install and after force-closing. Verify onboarding Continue, Skip and Get Started lead to login, without a blank screen.
2. Sign in, save/forget credentials, force-close, reopen and sign out. Confirm password settings behave on the actual device keychain.
3. Select the intended test patient; verify existing avatars and initials without changing the reverted image-download behavior.
4. Deny microphone permission once, grant it, record a non-empty clip, pause/resume, stop and preview. Confirm completed duration and playback.
5. Proceed, generate notes, edit/dictate and save only to the approved test encounter. Rapid double taps must produce one request.
6. Test offline/timeout and expired-session handling, then retry. Verify failures preserve the recording/transcript and do not show false save success.
7. Background/foreground the app and navigate away during playback/recording. Confirm recovery and that playback stops when leaving its screen.

Device acceptance checks are pending, not reported as passed.

# Building an Android App with Trusted Web Activity (TWA)

This guide explains how to package the Han's Laser Daily Service Report web application as an Android app using Trusted Web Activity (TWA). This approach wraps your Progressive Web App (PWA) in a native Android container that launches in full-screen mode without browser chrome.

## Prerequisites

Before you begin, ensure you have:

1. **Production URL**: Your app must be deployed and accessible via HTTPS on the Internet Computer
2. **Android Studio**: Download from [developer.android.com/studio](https://developer.android.com/studio)
3. **Java Development Kit (JDK)**: Version 11 or higher
4. **PWA Requirements Met**: Your app must have a valid web manifest and service worker (already implemented)

## Step 1: Verify PWA Manifest and Icons

Before building the Android app, verify that your PWA assets are accessible in production:

1. **Check the manifest**: Visit `https://your-production-url.ic0.app/manifest.webmanifest`
   - Verify it returns a valid JSON response (HTTP 200)
   - Confirm `start_url`, `name`, `short_name`, and `display` fields are present

2. **Check the icons**: Verify both icon URLs are accessible:
   - `https://your-production-url.ic0.app/assets/generated/android-app-icon.dim_192x192.png`
   - `https://your-production-url.ic0.app/assets/generated/android-app-icon.dim_512x512.png`
   - Both should return HTTP 200 with valid PNG images

3. **Test PWA installability**: Open your production URL in Chrome on Android
   - You should see an "Add to Home screen" or "Install app" prompt
   - If not, use Chrome DevTools Lighthouse to diagnose PWA issues

## Step 2: Set Up Android Studio Project

### Option A: Using Bubblewrap CLI (Recommended for Quick Setup)

Bubblewrap is a command-line tool that automates TWA project creation:

1. **Install Bubblewrap**:
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Initialize TWA project**:
   ```bash
   bubblewrap init --manifest https://your-production-url.ic0.app/manifest.webmanifest
   ```

3. **Follow the prompts**:
   - Application name: `Han's Laser Reports`
   - Package name: `com.hanslaser.reports` (or your preferred package name)
   - Host: `your-production-url.ic0.app`
   - Start URL: `/`
   - Icon URL: Use the 512x512 icon from your manifest
   - Theme color: `#1a1a1a`
   - Background color: `#1a1a1a`
   - Display mode: `standalone`

4. **Build the project**:
   ```bash
   bubblewrap build
   ```

   This generates an APK in the `app-release-unsigned.apk` file.

### Option B: Manual Android Studio Setup

If you prefer manual control or need custom configuration:

1. **Create a new Android Studio project**:
   - Select "Empty Activity"
   - Set package name (e.g., `com.hanslaser.reports`)
   - Minimum SDK: API 23 (Android 6.0)

2. **Add TWA dependencies** to `app/build.gradle`:
   ```gradle
   dependencies {
       implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
   }
   ```

3. **Configure AndroidManifest.xml**:
   ```xml
   <manifest xmlns:android="http://schemas.android.com/apk/res/android"
       package="com.hanslaser.reports">

       <uses-permission android:name="android.permission.INTERNET" />

       <application
           android:allowBackup="true"
           android:icon="@mipmap/ic_launcher"
           android:label="Han's Laser Reports"
           android:theme="@style/Theme.AppCompat.NoActionBar">

           <activity
               android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
               android:exported="true">
               <intent-filter>
                   <action android:name="android.intent.action.MAIN" />
                   <category android:name="android.intent.category.LAUNCHER" />
               </intent-filter>
           </activity>

           <activity
               android:name="com.google.androidbrowserhelper.trusted.WebViewFallbackActivity"
               android:exported="true" />

           <meta-data
               android:name="asset_statements"
               android:resource="@string/asset_statements" />
       </application>
   </manifest>
   ```

4. **Add asset links** in `res/values/strings.xml`:
   ```xml
   <string name="asset_statements">
       [{
           \"relation\": [\"delegate_permission/common.handle_all_urls\"],
           \"target\": {
               \"namespace\": \"web\",
               \"site\": \"https://your-production-url.ic0.app\"
           }
       }]
   </string>
   ```

5. **Replace app icons**: Copy your 192x192 and 512x512 PNG icons to the appropriate `res/mipmap-*` directories

## Step 3: Build Debug APK

For local testing without signing:

### Using Bubblewrap:

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# INVERT FM - Your Sound, Your Rules

This application is a creative tool for music lovers, content creators, and singers who want total control over sound. Discover royalty-free music, sing your own way with pitch and tempo controls, and enjoy an audiophile-grade listening experience.

## Features

- **Royalty-Free Music Discovery**: Powered by the Jamendo API, find thousands of songs across various genres.
- **Advanced Playback Controls**: Adjust pitch (key), speed (tempo), treble, and bass booster in real-time.
- **YouTube Integration**: Watch the latest videos from your favorite skateboarding and user-added channels.
- **Playlist Management**: Create and manage custom playlists.
- **Favorites**: Save your favorite tracks for quick access.
- **Local File Playback**: Play your own local audio files.
- **Customizable UI**: Adjust the look and feel of the app with different templates and custom backgrounds.

## Setup & Running

**1. Jamendo Client ID**
To discover music from Jamendo, you need a free Client ID from the Jamendo API. When you first launch the app, it will prompt you to enter one.
- You can get a Client ID by registering an application at the [Jamendo Developer Portal](https://developer.jamendo.com/v3.0/applications).

Your Client ID is saved in your browser's local storage for convenience, so you only need to enter it once.

**Note**: The Gemini API key (for disclaimer translations) is provided automatically by the AI Studio environment and does not need to be configured.

---

## Local Development (Outside AI Studio)

If you download this project to run on your own machine, follow these steps.

**Prerequisites:** Node.js

1.  Navigate into the `build` directory:
    `cd build`
2.  Install dependencies:
    `npm install`
3.  Run the app from within the `build` directory:
    `npm run dev`

The app will launch in your browser, where it will prompt you for the necessary Jamendo Client ID as described above.
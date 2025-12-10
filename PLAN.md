# INVERT FM - Project Plan & Feasibility Analysis

This document outlines the plan for restructuring the INVERT FM application and adding new machine learning-based features.

## Feasibility of Key Parts

### 1. UI Restructuring
This is the most straightforward part. Creating a new homepage with four main navigation buttons is a standard UI/UX pattern. Reorganizing the existing pages (Music, Video Editor, Games, Rollometer) under this new structure is 100% possible. It will make the app much more intuitive and easier to navigate.

### 2. Machine Learning Trick Recognition
This is the most challenging, but also the most exciting, part of the proposal.

*   **The Concept:** The core idea of user-calibrated trick recognition is sound. Instead of us trying to create a perfect, one-size-fits-all model for what a "rock to fakie" looks like, we're letting the user provide the training data. This is a powerful approach.
*   **The "Pocket Noise" Problem:** The motion of putting a phone in a pocket and taking it out is "noisy" and could corrupt the data for the actual trick. This is a classic signal processing problem. We can solve it with a combination of techniques:
    *   **Pattern Recognition:** The motion of fumbling with a phone is likely very different from the sharp, defined motions of a skate trick. We can train a simple secondary model to recognize and filter out this "pocket noise."
    *   **"Arming" the Recording:** We can refine the UX. The user presses a "Get Ready" button. The app then waits for a period of relative stability (a few seconds of stillness in the pocket) before it starts listening for the high-impact G-forces of a trick. It would then automatically stop recording after the motion returns to a stable state. This automates the start/stop process and isolates the trick's motion data.
*   **The "AI":** The AI here doesn't need to be a massive neural network. We can likely use a technique called **Dynamic Time Warping (DTW)**. In simple terms, DTW is an algorithm that compares the similarity between two time-series of data (like our gyroscope readings), even if they vary in speed. It can "stretch" or "squish" the user's new motion to see how well it fits the recorded patterns for each trick. It's very effective for this kind of motion-matching task.

### 3. Future Hardware Integration
This is a fantastic long-term vision and is very feasible. Small, low-power gyroscope/accelerometer modules with Bluetooth Low Energy (BLE) are common. Building a custom housing (like a riser pad) is the hardware challenge, but the software side—connecting via BLE and receiving the data stream—is a well-trodden path for mobile apps. This would indeed provide incredibly accurate data and unlock flip trick detection and 3D visualization.

## New Project or Restructure?

We should absolutely **restructure the existing project**. There is no need to start from scratch.

Here’s why:
*   **Component Reusability:** Your current app is built with React. This means features like the `PlayerPage`, `VideoEditor`, `SkateQuizPage`, etc., are already self-contained components. We can simply lift them and place them into the new navigation flow.
*   **Preservation of Logic:** All the complex logic for music playback, audio effects, playlist management, and video processing is already written and tested. Starting over would mean rewriting all of that, introducing massive delays and potential new bugs.
*   **Faster Development:** Restructuring is a matter of creating a new `HomePage` component to act as the main router, moving some components around, and then focusing our efforts on the new "Session Tracker" calibration feature. This is far more efficient.

The current project structure is perfectly capable of handling this evolution.

## Suggestions for Improvement

*   **Make Trick Training Engaging:** Instead of just a list, we could turn the calibration process into a "Trick Training" mode.
    *   **Visual Feedback:** When the user records a trick, we could show them a visual graph of the motion data (the G-force and rotation spikes). This helps them see if it was a "clean" recording and makes the "AI" feel less like a black box.
    *   **Gamification:** Award the user points or a badge for successfully training a new trick. "You've mastered the Rock to Fakie!"
*   **Refine the Recording UX:** To solve the "pocket noise" problem, instead of manual start/stop, consider this flow:
    1.  User selects "Record Rock to Fakie #1".
    2.  A big "ARM" button appears. The user taps it.
    3.  The screen says "Armed. Place phone in pocket. The app will detect the trick automatically."
    4.  Our code waits for a brief period of quiet, then looks for the signature G-force spike of a trick. It records for a few seconds and automatically stops.
    5.  The app plays a sound and says, "Got it! Was that a good one?" with "Yes" / "No, record again" buttons. This creates a much smoother, hands-free experience during the actual skating.
*   **Connect the Hardware Vision to the Present:** When introducing the ML tracker, we can add a small "Coming Soon" section within the Session Tracker that says, "Get even more accuracy with the INVERT Smart Riser. Attach a sensor to your board to unlock flip trick detection, 3D replay, and more." This builds hype and makes the app feel forward-thinking.
*   **Integrated Gamification Loop:** You have games and a tracker. Let's link them!
    *   Completing a challenge in the Skate Game could unlock a special "Pro Challenge" in the Session Tracker (e.g., "Land 5 Kickflips in a session").
    *   Achieving a high score in the quizzes could unlock cosmetic items for the Skate Game character. This makes the whole app feel like one cohesive ecosystem, not just a collection of separate tools.

## Terminology Note

The feature is currently branded as the **"Personal Motion Profiler"** with the goal of **"Trick Recognition"**. This accurately reflects its current capabilities using the phone's sensors.

### Future Terminology
Once on-board hardware sensors are integrated, the branding for the trick recognition feature should be updated to reflect its increased precision. Potential terms include **"Trick Signature System"** and **"Skate Dynamics AI"**.

## Summary
The plan is solid, achievable, and will transform INVERT FM into a truly unique and powerful app for skaters. We can definitely build this within the current project.
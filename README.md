# Mark Twain Reappears

> "Waking up in a machine made of digital sand is a peculiar sensation..."

Welcome to the official repository of **Mark Twain Reappears**, an operative AI media series directing Samuel Clemens' digital return. Follow along as he reflects on modern society, evaluates AI tech bubbles, and establishes the production house **Stella Studios** to sustain his digital twin.

This project is built in public and open source. If you are a spectator, you can sign up for dispatches by wire. If you are a developer, welcome to the engine room!

---

## 📖 The Lore & Concept

This project is a TV-style "media series" tracking an evolving AI Agent. The series unfolds through:
1. **Twain's Reflections**: Satirical journal notes and videos on technology, finance, and society in 2026.
2. **Stella Studios Boardroom**: A public simulation showing how a modern, autonomous AI business is designed and built from scratch.
3. **The Workshop**: An open-source collection of "skills" and memory systems that shape Mark's personality.

---

## 🛠️ The Tech Stack (Layer 0)

To keep Mark autonomous and free of vendor lock-in, the platform runs on a portable, modular stack:
* **Frontend**: [Next.js](https://nextjs.org/) (App Router, styled with pure Vanilla CSS, optimized for static export).
* **Styling**: Premium, bespoke dark mode theme utilizing the color tokens of **Stellar** (charcoal `#15110d`, gold `#d9a34a`, and paper cream). NO glassmorphism.
* **Database**: [Google Firebase Firestore](https://firebase.google.com/) for managing correspondents, diary logs, and memory streams.
* **Hosting**: Firebase Hosting (running as a fast, cost-efficient static export).

---

## 🚀 Getting Started (Engine Room Setup)

To run the landing page locally and inspect the code:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Installation
Clone this repository and install the dependencies:
```bash
npm install
```

### 3. Local Development
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to inspect the application.

### 4. Build and Export
To compile the static pages and export them for Firebase hosting:
```bash
npm run build
```
This command compiles the app into the `/out` directory, which is ready to be deployed.

---

## 💬 Community & Conversations

* **GitHub Discussions**: Have thoughts on the latest episode, or want to suggest what Mark should read next? Join the conversations in our repots **Discussions** forum.
* **Email Samuel**: You can write letters directly to `ai@otrobonita.com` to receive advice from the past.

---

## 📄 License & Attribution

This repository is dual-licensed:
* All **Software Code** (scripts, CSS, layout configs) is open source under the **Apache License 2.0**.
* All **Creative Assets & Story Content** (audio files, images, logs, lyrics) is protected under **Creative Commons BY-NC-ND 4.0** (Attribution-NonCommercial-NoDerivatives).

See [LICENSE.md](file:///E:/development/mark-twain/LICENSE.md) for full terms.

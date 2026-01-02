# Guitar Improv Coach 🎸

A web-based guitar improvisation coaching app that analyzes your playing in real-time and provides intelligent musical feedback.

## Features

- 🎵 **Real-time Pitch Detection** - Uses Web Audio API for accurate note detection
- 🎸 **Live Fretboard Visualization** - See your notes mapped to the guitar fretboard
- 🎼 **Music Theory Engine** - Analyzes scale adherence, timing, pitch control, and phrasing
- 🤖 **AI-Powered Feedback** - Get personalized feedback using InsForge AI
- 🎹 **Metronome** - Built-in metronome with visual beat indicators
- 🎨 **Dark Theme UI** - Beautiful, distraction-free interface

## Styles Supported

- **Rock** - Pentatonic & Blues scale freedom
- **Blues** - Expressive bends & blue notes  
- **Metal** - Technical precision & power

## Scoring Dimensions

- Scale Adherence
- Timing Accuracy
- Pitch Control
- Phrase Consistency
- Style Match

## Tech Stack

- **React + Vite** - Modern frontend framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **InsForge** - Backend-as-a-Service (AI, Database, Functions)
- **Web Audio API** - Real-time audio processing
- **Motion** - Smooth animations

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-guitar
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` and add your InsForge credentials:
```
VITE_INSFORGE_URL=your-insforge-url
VITE_INSFORGE_ANON_KEY=your-anon-key
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Select Settings**: Choose your style (Rock/Blues/Metal), key, and tempo
2. **Enable Metronome** (optional): Toggle the metronome to hear the beat
3. **Start Jamming**: Click "Start Jamming" and allow microphone access
4. **Play Freely**: Play your guitar - the app listens and analyzes in real-time
5. **Get Feedback**: After your session, receive detailed scores and practice suggestions

## Project Structure

```
src/
├── components/      # React components
│   ├── Fretboard.tsx
│   ├── PlayingSession.tsx
│   ├── SessionResults.tsx
│   └── SessionSetup.tsx
├── hooks/           # Custom React hooks
│   ├── useAudioInput.ts
│   └── useMetronome.ts
├── lib/             # Core libraries
│   ├── analyzeSession.ts
│   ├── insforge.ts
│   └── musicTheory.ts
└── types/           # TypeScript definitions
```

## Environment Variables

- `VITE_INSFORGE_URL` - Your InsForge backend URL
- `VITE_INSFORGE_ANON_KEY` - InsForge anonymous key

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT

## Acknowledgments

- Built with [InsForge](https://insforge.app) - Backend-as-a-Service platform
- Powered by Claude AI for intelligent musical analysis

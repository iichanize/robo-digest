# RoboDigest

**RoboDigest** is a daily dashboard for robotics researchers and enthusiasts. It fetches the latest papers from arXiv (`cs.RO`) and provides AI-powered summaries on demand, helping you stay up-to-date with trends in ROS 2, logistics, warehouse automation, and simulation.

![Initial MVP](https://via.placeholder.com/800x400?text=RoboDigest+Dashboard+Preview)

## Features

- **Daily Feed**: Automatically fetches the latest robotics papers from arXiv.
- **Smart Search**: Filter papers by keywords to find exactly what you're interested in.
- **AI Summarization**: Click "✨ AI要約する" to generate a concise 3-point summary in Japanese using Google Gemini 2.5.
- **Bookmarks**: Save interesting papers to your favorites (stored locally in your browser).
- **Responsive Design**: Modern, clean interface built with Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Google Gemini API Key

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/iichanize/robo-digest.git
    cd robo-digest
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env.local` file in the root directory:

    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  Run the development server:

    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API (`gemini-2.5-flash`)
- **Data Source**: arXiv API

## License

MIT

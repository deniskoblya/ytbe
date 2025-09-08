# 🎬 YouTube Transcriber AI

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green.svg)](https://openai.com/)

Transform any YouTube video into a searchable transcript with AI-powered summaries, search functionality, and intelligent chat. Perfect for research, content creation, and learning.

🚀 **[Live Demo: https://ytbe.ai](https://ytbe.ai)**

## ✨ Features

- **📝 Instant Transcription** - Get accurate transcripts from any YouTube video
- **🤖 AI-Powered Summaries** - Generate structured summaries in English or Russian
- **🔍 Smart Search** - AI-powered search through transcript content
- **💬 Interactive Chat** - Discuss summaries with an AI assistant
- **🎯 Timestamp Navigation** - Click on any timestamp to jump to that moment
- **📱 Responsive Design** - Works perfectly on desktop and mobile
- **🔒 Privacy First** - All data stored locally in your browser
- **🌐 Multi-language Support** - English and Russian interface

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/deniskoblya/ytbe.git
   cd ytbe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:2121`

## 🔐 API Key Setup

To use AI features (summaries, search, chat), you'll need an OpenAI API key:

1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Create a new secret key
4. Click the "Setup OpenAI API" button in the app
5. Enter your API key

**🔒 Privacy Note**: Your API key and video data are stored only in your browser's local storage. We never save this information on our servers.

## 🛠️ How It Works

1. **Paste YouTube URL** - Enter any YouTube video URL
2. **Get Transcript** - The app fetches the transcript automatically
3. **AI Analysis** - Generate summaries, search content, or chat about the video
4. **Local Storage** - Everything is saved locally for quick access

## 🎯 Use Cases

- **📚 Educational Content** - Study lectures and tutorials
- **🎙️ Podcast Analysis** - Extract key insights from long-form content
- **📰 News & Interviews** - Quickly understand main points
- **🔬 Research** - Analyze video content for academic work
- **✍️ Content Creation** - Get inspiration and references

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Video Player**: React Player
- **AI**: OpenAI GPT-4
- **Styling**: Tailwind CSS

## 📁 Project Structure

```
src/
├── App.tsx           # Main application component
├── main.tsx          # Application entry point
├── index.css         # Global styles
└── vite-env.d.ts     # Vite type definitions
```

## 🌟 Key Components

- **Transcript Display** - Shows transcript with timestamps
- **AI Summary** - Structured summaries with key insights
- **Smart Search** - AI-powered content search
- **Chat Widget** - Interactive AI assistant
- **Video Library** - Local storage of processed videos
- **API Key Modal** - Secure API key configuration

## 🔧 Configuration

### Environment Variables
Create a `.env` file (optional):
```env
VITE_OPENAI_API_KEY=your_api_key_here
```

### Port Configuration
Default port is `2121`. Change in `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000, // Your desired port
  },
});
```

## 🚀 Deployment

### Vercel
```bash
npm run build
npx vercel --prod
```

### Netlify
```bash
npm run build
# Deploy the dist folder
```

### GitHub Pages
```bash
npm run build
# Deploy the dist folder to gh-pages branch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

Having issues? Check out our [Issues](https://github.com/deniskoblya/ytbe/issues) page or create a new issue.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for the powerful GPT-4 API
- [React](https://reactjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first styling
- [Radix UI](https://www.radix-ui.com/) for accessible components

---

<div align="center">
  <strong>🎬 Transform YouTube videos into actionable insights with AI!</strong>
</div>

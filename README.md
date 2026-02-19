# 3D Architectural Render MCP App

A high-performance, aesthetically pleasing 3D architectural rendering application built as a Model Context Protocol (MCP) server. This app allows AI agents to generate, manipulate, and visualize 3D scenes using simple primitives through a streamlined communication bridge.

## ✨ Features

- **Progressive 3D Rendering**: Real-time visualization of architectural scenes using Three.js.
- **MCP Integration**: Fully compatible with the Model Context Protocol, allowing seamless tool execution and resource management.
- **Cinematic Experience**: Automated and manual camera controls with smooth GSAP animations for professional-grade visualization.
- **Premium UI/UX**: Modern "Glassmorphism" aesthetics with dark/light mode support, leveraging Tailwind CSS and the Outfit typography.
- **State Management**: Robust checkpointing system (Redis/Memory) to save and restore complex 3D scenes.
- **Internationalization**: Full support for English and French locales.
- **Optimized for Vercel**: Ready for serverless deployment with a dedicated API handler.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Three.js](https://threejs.org/), [GSAP](https://gsap.com/), [Lucide React](https://lucide.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend/Bridge**: [MCP SDK](https://github.com/modelcontextprotocol), [Express](https://expressjs.com/), [Bun](https://bun.sh/)
- **Infrastructure**: [Vite](https://vitejs.dev/), [Vercel](https://vercel.com/)
- **Internationalization**: [i18next](https://www.i18next.com/)

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- An MCP-compatible client or host application.

### Installation

```bash
# Clone the repository
git clone https://github.com/djottaroot/3d-render-mcp-app.git
cd 3d-render-mcp-app

# Install dependencies
bun install
```

### Development

```bash
# Run the development server (HMR for UI + Watch for Server)
bun run dev
```

### Build

```bash
# Generate the production bundle
bun run build
```

## 📦 Deployment

This project is deployed on **Vercel**:  
🚀 **Production URL**: [https://3d-render-mcp-app.vercel.app](https://3d-render-mcp-app.vercel.app)

### Manual Deployment
1. Connect your GitHub repository to Vercel.
2. Vercel will automatically detect the `vercel.json` configuration.
3. Set your environment variables (optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` for persistent state).
4. Deploy!

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ by Djotta

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false
          },
          '/projects': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // 代码分割优化
        rollupOptions: {
          output: {
            // 手动分块策略
            manualChunks: {
              // React核心库
              'react-vendor': ['react', 'react-dom'],
              // 动画库
              'animation': ['framer-motion'],
              // 工具库
              'utils': ['lucide-react'],
            },
            // 资源文件命名
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name.split('.');
              const ext = info[info.length - 1];
              if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
                return 'assets/images/[name]-[hash][extname]';
              }
              if (/\.(woff2?|ttf|otf|eot)$/i.test(assetInfo.name)) {
                return 'assets/fonts/[name]-[hash][extname]';
              }
              return 'assets/[name]-[hash][extname]';
            },
            // JS文件命名
            chunkFileNames: 'assets/js/[name]-[hash].js',
            // 入口文件命名
            entryFileNames: 'assets/js/[name]-[hash].js',
          }
        },
        // 压缩选项 - 使用esbuild（Vite内置，无需额外依赖）
        minify: 'esbuild',
        // 资源内联阈值（小于4KB的资源内联为base64）
        assetsInlineLimit: 4096,
        // 启用CSS代码分割
        cssCodeSplit: true,
        // 生成source map（生产环境关闭）
        sourcemap: false,
        // 目标浏览器
        target: 'es2015',
      },
      // 优化依赖预构建
      optimizeDeps: {
        include: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
        exclude: []
      }
    };
});

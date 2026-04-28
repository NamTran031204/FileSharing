import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// su dung cho mockup phat video
const FIXED_HLS_DIR = 'E:/DaiCuongBK/Project3/FileSharing/server/filesharing-videocodec/temp/dir'

const hlsLocalPlugin = () => ({
    name: 'hls-local-static-route',
    configureServer(server: any) {
        server.middlewares.use('/hls-local', (req: any, res: any) => {
            const rawPath = (req.url ?? '/').split('?')[0]
            const relativePath = decodeURIComponent(rawPath).replace(/^\/+/, '') || 'master.m3u8'
            const resolvedPath = path.resolve(FIXED_HLS_DIR, relativePath)
            const normalizedBase = path.resolve(FIXED_HLS_DIR)

            if (!resolvedPath.startsWith(normalizedBase)) {
                res.statusCode = 403
                res.end('Forbidden')
                return
            }

            if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
                res.statusCode = 404
                res.end('Not found')
                return
            }

            const ext = path.extname(resolvedPath).toLowerCase()
            if (ext === '.m3u8') {
                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
            } else if (ext === '.ts') {
                res.setHeader('Content-Type', 'video/mp2t')
            }

            fs.createReadStream(resolvedPath).pipe(res)
        })
    },
})
// su dung cho mockup phat video

export default defineConfig({
    // su dung cho mockup phat video
    server: {
        fs: {
            allow: [
                '..',
                FIXED_HLS_DIR,
            ],
        },
    },
    // su dung cho mockup phat video

    plugins: [
        tailwindcss(),

        // su dung cho mockup phat video
        hlsLocalPlugin(),
        // su dung cho mockup phat video
    ],
})
# 第一阶段: 仅在需要时安装依赖
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 根据首选的包管理器安装依赖
COPY package.json package-lock.json* ./
RUN npm ci

# 第二阶段: 仅在需要时重新构建源代码
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js 收集关于通用用法的匿名遥测数据。
# 详情见: https://nextjs.org/telemetry
# 如果你想在构建期间禁用遥测，请取消下面一行的注释。
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# 第三阶段: 生产环境镜像，复制所有文件并运行 next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# 如果你想在运行时禁用遥测，请取消下面一行的注释。
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# 设置预渲染缓存的正确权限
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 自动利用输出跟踪来减小镜像大小
# 详情见: https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# server.js 是通过 standalone 输出由 next build 创建的
# 详情见: https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]

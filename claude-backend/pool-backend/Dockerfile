# Pool Backend Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源代码和配置文件
COPY . .

# 编译 TypeScript
RUN npm run build

# 生产阶段 - 使用更小的镜像
FROM node:18-alpine

WORKDIR /app

# 只复制 package.json 并安装生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制编译后的文件
COPY --from=0 /app/dist ./dist

# 暴露端口
EXPOSE 8787

# 启动应用
CMD ["npm", "start"]

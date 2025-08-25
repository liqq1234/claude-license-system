# Pool Backend Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY src src

# 编译 TypeScript
RUN npm run build

# 暴露端口
EXPOSE 8787

# 启动应用
CMD ["npm", "start"]

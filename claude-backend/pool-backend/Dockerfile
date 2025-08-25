# Pool Backend Dockerfile
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./
COPY tsconfig.json ./

# 安装所有依赖（包括开发依赖）以支持热重载
RUN npm install

# 复制源代码
COPY src src
COPY database database
COPY scripts scripts

# 暴露端口
EXPOSE 8787

# 默认启动命令（可以被docker-compose覆盖）
CMD ["npm", "run", "dev"]

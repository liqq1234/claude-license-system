# Claude Frontend Dockerfile - 开发模式
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 复制 package.json
COPY package.json ./

# 安装所有依赖（包括开发依赖）
RUN npm install

# 复制源代码
COPY . .

# 暴露Vite开发服务器端口
EXPOSE 8080

# 默认启动命令（可以被docker-compose覆盖）
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

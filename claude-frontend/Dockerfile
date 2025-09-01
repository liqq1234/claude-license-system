# claude-frontend Dockerfile - 开发模式
FROM node:18-bullseye-slim

# 设置工作目录
WORKDIR /app

# 替换 Debian apt 源为阿里云
RUN echo "deb http://mirrors.aliyun.com/debian bullseye main contrib non-free" > /etc/apt/sources.list \
    && echo "deb http://mirrors.aliyun.com/debian bullseye-updates main contrib non-free" >> /etc/apt/sources.list \
    && echo "deb http://mirrors.aliyun.com/debian-security bullseye-security main contrib non-free" >> /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制 package.json
COPY package.json ./

# 设置 npm 国内源，加速依赖安装
RUN npm config set registry https://registry.npmmirror.com/ \
    && npm install

# 复制源代码
COPY . .

# 暴露 Vite 开发服务器端口
EXPOSE 8080

# 默认启动命令
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

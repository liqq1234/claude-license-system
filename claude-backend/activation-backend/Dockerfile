FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 复制 package.json 和安装依赖
COPY package.json package.json
COPY npm-shrinkwrap.json npm-shrinkwrap.json
# 安装所有依赖（包括开发依赖）以支持热重载
RUN npm install --include=dev

# 复制应用文件
COPY src src
COPY config.js config.js
COPY index.js index.js
COPY sample.private.pem sample.private.pem
COPY sample.public.pem sample.public.pem

# 暴露端口
EXPOSE 8888

# 默认启动命令（可以被docker-compose覆盖）
CMD ["npm", "run", "dev"]

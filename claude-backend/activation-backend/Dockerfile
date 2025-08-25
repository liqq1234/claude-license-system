FROM node:alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和安装依赖
COPY package.json package.json
COPY npm-shrinkwrap.json npm-shrinkwrap.json
RUN npm install --production

# 复制应用文件
COPY src src
COPY config.js config.js
COPY index.js index.js
COPY sample.private.pem sample.private.pem
COPY sample.public.pem sample.public.pem

# 暴露端口
EXPOSE 8888

# 启动应用
CMD ["node", "index.js"]

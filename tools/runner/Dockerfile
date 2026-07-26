# 격리된 컨테이너 안에서 실행 서버를 돌린다.
#   docker build -t coderun-runner tools/runner
#   docker run --rm -p 127.0.0.1:8787:8787 --network none --memory 512m --pids-limit 128 coderun-runner
# --network none 을 주면 실행되는 코드가 바깥으로 나갈 수 없다.
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc g++ default-jdk-headless golang-go rustc \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server.cjs .
ENV HOST=0.0.0.0 PORT=8787 RUN_TIMEOUT_MS=10000
RUN useradd -m runner && chown -R runner /app
USER runner
EXPOSE 8787
CMD ["node", "server.cjs"]

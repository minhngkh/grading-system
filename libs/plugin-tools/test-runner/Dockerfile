FROM minhngkh/judge:0.0.0

ENV PATH="/usr/local/bin:${PATH}"

# Install necessary dependencies and tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      unzip \
      build-essential && \
    rm -rf /var/lib/apt/lists/*


# Python: uv, python, pip
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

ENV PYTHON_VERSIONS="3.12.11 3.13.5"
RUN env UV_PYTHON_INSTALL_DIR=/usr/local/bin/python-install \
        UV_PYTHON_BIN_DIR=/usr/local/bin/python-install \
        uv python install ${PYTHON_VERSIONS} && \
    for version in ${PYTHON_VERSIONS}; do \
      ln -sf /opt/uv/python/cpython-${version}*/bin /usr/local/bin/python${version}-bin; \
    done && \
    uv cache clean


# Node.js: node, npm, pnpm, fnm
ENV SYSTEM_NODEJS_VERSION="22.17.1"
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs=${SYSTEM_NODEJS_VERSION}-1nodesource1 && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@latest && \
    npm cache clean --force

RUN curl -fsSL https://fnm.vercel.app/install | bash -s -- --install-dir "/usr/local/bin"

ENV NODEJS_VERSIONS="20.19.4"
RUN for version in ${NODEJS_VERSIONS}; do \
      env FNM_DIR=/usr/local/bin/fnm-install fnm install ${version} && \
      mkdir -p /usr/local/bin/node${version}-bin/ && \
      ln -s /usr/local/bin/fnm-install/node-versions/v${version}/installation/bin/node /usr/local/bin/node${version}-bin/; \
    done

ENTRYPOINT ["/opt/go-judge", "-dir", "/tmp/go-judge"]
# RUN gcc --version && \
#     g++ --version && \
#     uv --version && \
#     uv python list && \
#     node --version && \
#     /usr/local/bin/node20.19.4-bin/node --version && \
#     npm --version && \
#     pnpm --version


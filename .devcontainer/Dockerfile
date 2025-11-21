# Use the official Node.js LTS image
FROM node:lts

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    procps \
    lsb-release \
    # Required for node-gyp
    python3 \
    make \
    g++ \
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set the working directory
WORKDIR /workspace

# Install global dependencies
RUN pnpm add -g \
    @adonisjs/cli \
    typescript \
    ts-node \
    nodemon \
    eslint \
    prisma

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install project dependencies with pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build

# Set the default command to start the development server
CMD ["pnpm", "dev"]

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

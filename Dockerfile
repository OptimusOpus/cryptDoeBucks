FROM --platform=linux/amd64 node:22-bullseye

WORKDIR /labs

# Install tools for Solidity analysis
RUN apt-get update && apt-get install -y \
    libssl-dev \
    python3-dev \
    python3-pip \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install solc-select slither-analyzer mythril

# Copy project files
COPY . /labs/

# Install Node.js dependencies
RUN yarn install

# Run SVM (Solidity Version Manager)
RUN bin/svm

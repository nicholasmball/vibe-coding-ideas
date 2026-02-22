# syntax=docker/dockerfile:1
ARG TARGETPLATFORM=linux/arm64

FROM --platform=${TARGETPLATFORM} alpine:latest

# Install Podman and dependencies
RUN apk add --no-cache \
    podman \
    fuse-overlayfs \
    slirp4netns \
    iptables \
    ip6tables

# Copy init script
COPY init /init
RUN chmod +x /init

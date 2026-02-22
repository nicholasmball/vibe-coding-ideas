#!/bin/bash
set -e

ALPINE_VERSION="3.19"

# Determine architecture (from arg or auto-detect)
if [ -n "$1" ]; then
    ARCH="$1"
else
    case "$(uname -m)" in
        "arm64" | "aarch64") ARCH="arm64" ;;
        "x86_64" | "amd64") ARCH="x86_64" ;;
        *) echo "Unsupported architecture: $(uname -m)"; exit 1 ;;
    esac
fi

# Set arch-specific variables
case "$ARCH" in
    "arm64")
        ALPINE_ARCH="aarch64"
        DOCKER_PLATFORM="linux/arm64"
        ;;
    "x86_64")
        ALPINE_ARCH="x86_64"
        DOCKER_PLATFORM="linux/amd64"
        ;;
    *)
        echo "Usage: $0 [arm64|x86_64]"
        exit 1
        ;;
esac

OUTPUT_DIR="images/$ARCH"
MODULES_DIR="modules-$ARCH"

echo "=== Building $ARCH Alpine VM Image ==="

mkdir -p "$OUTPUT_DIR"

# Download kernel (if not exists)
if [ ! -f "$OUTPUT_DIR/vmlinuz" ]; then
    echo "Downloading $ARCH kernel..."
    wget -q "https://dl-cdn.alpinelinux.org/alpine/v${ALPINE_VERSION}/releases/${ALPINE_ARCH}/netboot/vmlinuz-virt" \
        -O "$OUTPUT_DIR/vmlinuz"
fi

# Download modules (if not exists)
if [ ! -f "$OUTPUT_DIR/modloop-virt" ]; then
    echo "Downloading $ARCH modules..."
    wget -q "https://dl-cdn.alpinelinux.org/alpine/v${ALPINE_VERSION}/releases/${ALPINE_ARCH}/netboot/modloop-virt" \
        -O "$OUTPUT_DIR/modloop-virt"
fi

# Extract modules (using Docker for cross-platform compatibility)
if [ ! -d "$MODULES_DIR" ]; then
    echo "Extracting $ARCH kernel modules..."
    mkdir -p "$MODULES_DIR"
    docker run --rm --platform "$DOCKER_PLATFORM" \
        -v "$(pwd)/$OUTPUT_DIR/modloop-virt:/modloop.squashfs:ro" \
        -v "$(pwd)/$MODULES_DIR:/output" \
        alpine:latest sh -c '
            apk add --no-cache squashfs-tools > /dev/null 2>&1
            cd /output
            unsquashfs -f -d . /modloop.squashfs > /dev/null 2>&1
            mkdir -p lib/modules
            mv modules/* lib/modules/ 2>/dev/null || true
            rmdir modules 2>/dev/null || true
        '
fi

# Build container image
echo "Building $ARCH container image..."
docker buildx build --platform "$DOCKER_PLATFORM" --build-arg TARGETPLATFORM="$DOCKER_PLATFORM" \
    -t "vibecodes/host-vm:$ARCH" --load .

# Export filesystem
docker rm -f "temp-$ARCH" 2>/dev/null || true
docker create --platform "$DOCKER_PLATFORM" --name "temp-$ARCH" "vibecodes/host-vm:$ARCH"
docker export "temp-$ARCH" -o "$OUTPUT_DIR/rootfs.tar"
docker rm "temp-$ARCH"

# Create initramfs
echo "Creating $ARCH initramfs..."
docker run --rm --platform "$DOCKER_PLATFORM" \
    -v "$(pwd)/$OUTPUT_DIR/rootfs.tar:/rootfs.tar:ro" \
    -v "$(pwd)/$MODULES_DIR:/modules:ro" \
    -v "$(pwd)/$OUTPUT_DIR:/output" \
    alpine:latest sh -c '
        cd /tmp
        tar -xf /rootfs.tar

        # Copy modules
        mkdir -p lib
        cp -r /modules/lib/modules lib/

        # Verify init
        if [ ! -f init ]; then
            echo "ERROR: /init not found!"
            exit 1
        fi
        chmod +x init

        # Create cpio archive
        find . | cpio -o -H newc 2>/dev/null | gzip > /output/rootfs.cpio.gz
    '

# Clean up intermediate files
rm -f "$OUTPUT_DIR/rootfs.tar"

echo "=== $ARCH build complete ==="
ls -lh "$OUTPUT_DIR/rootfs.cpio.gz"

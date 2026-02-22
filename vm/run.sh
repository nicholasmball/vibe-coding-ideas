#!/bin/bash
set -e

# Detect platform and architecture
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Map architecture names
case "$ARCH" in
    "arm64" | "aarch64")
        VM_ARCH="arm64"
        QEMU_BIN="qemu-system-aarch64"
        CONSOLE="ttyAMA0"
        # Use HVF on macOS for native speed
        if [ "$PLATFORM" = "darwin" ]; then
            MACHINE="-M virt,accel=hvf -cpu host"
        else
            MACHINE="-M virt,accel=kvm -cpu host"
        fi
        ;;
    "x86_64" | "amd64")
        VM_ARCH="x86_64"
        QEMU_BIN="qemu-system-x86_64"
        CONSOLE="ttyS0"
        # Use HVF on macOS, KVM on Linux
        if [ "$PLATFORM" = "darwin" ]; then
            MACHINE="-M q35,accel=hvf -cpu host"
        else
            MACHINE="-M q35,accel=kvm -cpu host"
        fi
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

IMAGE_DIR="./images/$VM_ARCH"

# Check if images exist
if [ ! -f "$IMAGE_DIR/vmlinuz" ] || [ ! -f "$IMAGE_DIR/rootfs.cpio.gz" ]; then
    echo "VM images not found for $VM_ARCH. Run './build.sh $VM_ARCH' first."
    exit 1
fi

echo "Starting VibeCodes VM ($VM_ARCH on $PLATFORM)..."
echo "Using: $QEMU_BIN"

$QEMU_BIN \
  $MACHINE \
  -m 2G \
  -smp 2 \
  -nographic \
  -nodefaults \
  -no-user-config \
  -serial mon:stdio \
  -kernel "$IMAGE_DIR/vmlinuz" \
  -initrd "$IMAGE_DIR/rootfs.cpio.gz" \
  -append "console=$CONSOLE init=/init" \
  -netdev user,id=net0,hostfwd=tcp::2375-:2375 \
  -device virtio-net-pci,netdev=net0

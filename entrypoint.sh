#!/bin/bash
set -e

if [ -z "$VPN_USERNAME" ] || [ -z "$VPN_PASSWORD" ]; then
  echo "❌ Error: VPN_USERNAME or VPN_PASSWORD environment variables are missing."
  exit 1
fi

echo "Generating temporary VPN credentials..."
echo "$VPN_USERNAME" > /tmp/vpn-auth.txt
echo "$VPN_PASSWORD" >> /tmp/vpn-auth.txt
chmod 600 /tmp/vpn-auth.txt

echo "Starting OpenVPN..."
# No --daemon: run in background so we can capture its PID and see its logs
openvpn --config /etc/openvpn/config.ovpn --auth-user-pass /tmp/vpn-auth.txt &
OVPN_PID=$!

echo "Waiting for VPN connection to establish..."
for i in {1..30}; do
  if ip link show tun0 > /dev/null 2>&1; then
    echo "✅ VPN Connected successfully!"
    break
  fi
  sleep 1
done

if ! ip link show tun0 > /dev/null 2>&1; then
  echo "❌ VPN failed to connect. Exiting."
  kill "$OVPN_PID" 2>/dev/null
  exit 1
fi

echo "Starting Next.js application securely..."
gosu nextjs node server.js &
NODE_PID=$!

# Forward SIGTERM/SIGINT so docker stop/restart shuts down cleanly
term() {
  echo "Caught signal, shutting down..."
  kill "$NODE_PID" 2>/dev/null
  kill "$OVPN_PID" 2>/dev/null
  wait "$NODE_PID" 2>/dev/null
  exit 0
}
trap term SIGTERM SIGINT

# Watchdog: exit (so restart:unless-stopped fires) if VPN or node dies
while true; do
  if ! kill -0 "$OVPN_PID" 2>/dev/null; then
    echo "❌ OpenVPN process died. Exiting to trigger restart."
    kill "$NODE_PID" 2>/dev/null
    exit 1
  fi
  if ! ip link show tun0 > /dev/null 2>&1; then
    echo "❌ VPN tunnel (tun0) is down. Exiting to trigger restart."
    kill "$NODE_PID" 2>/dev/null
    exit 1
  fi
  if ! kill -0 "$NODE_PID" 2>/dev/null; then
    echo "❌ Node process died. Exiting."
    kill "$OVPN_PID" 2>/dev/null
    exit 1
  fi
  sleep 15
done
#!/usr/bin/env python3
"""
Simple HTTP Tunnel - Exposes localhost:8080 via a public URL
Uses serveo.net (free, no setup needed)
"""

import subprocess
import sys
import platform
import time

def get_public_url():
    """
    Use SSH to create a tunnel via serveo.net
    No account needed, URL expires when tunnel closes
    """
    print("=" * 50)
    print("Creating Public URL via Serveo.net")
    print("=" * 50)
    print("\n⏳ Connecting (this takes 5-10 seconds)...\n")
    
    # SSH tunnel via serveo.net
    # This creates a public URL that forwards to localhost:8080
    cmd = [
        "ssh",
        "-R", "80:localhost:8080",
        "serveo.net"
    ]
    
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Read output until we get the URL
        print("📍 Your temporary public URL:\n")
        for line in iter(process.stdout.readline, ''):
            if line:
                print(f"  {line.strip()}")
                if "http" in line.lower():
                    print("\n✅ PUBLIC URL IS READY!")
                    print("   Share this URL with Agent 6 for the demo")
                    print("\n⏏️  Press Ctrl+C to stop the tunnel")
                    print("=" * 50)
        
        # Keep the tunnel alive
        process.wait()
        
    except FileNotFoundError:
        print("❌ SSH not found on this system.")
        print("\nAlternatives:")
        print("1. Install OpenSSH: https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse")
        print("2. Use Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/")
        print("3. Use ngrok: https://ngrok.com/download")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 Tunnel closed. Demo URL no longer available.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    get_public_url()

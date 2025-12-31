# typed: false
# frozen_string_literal: true

# Homebrew formula for proxmux - Terminal UI for Proxmox VE
# To use this formula, users should tap the repository:
#   brew tap asachs01/proxmux https://github.com/asachs01/proxmux
#   brew install proxmux
class Proxmux < Formula
  desc "Terminal UI for managing Proxmox VE virtualization platform"
  homepage "https://github.com/asachs01/proxmux"
  version "0.2.1-test"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/asachs01/proxmux/releases/download/v#{version}/proxmux-darwin-arm64.tar.gz"
      sha256 "7f2a11f927b14966d542973e9f5f50d16d635f3a9d77633a4704ee9f3d8c52d1"

      def install
        bin.install "proxmux-darwin-arm64" => "proxmux"
      end
    end

    on_intel do
      url "https://github.com/asachs01/proxmux/releases/download/v#{version}/proxmux-darwin-x64.tar.gz"
      sha256 "7f2a11f927b14966d542973e9f5f50d16d635f3a9d77633a4704ee9f3d8c52d1"

      def install
        bin.install "proxmux-darwin-x64" => "proxmux"
      end
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/asachs01/proxmux/releases/download/v#{version}/proxmux-linux-arm64.tar.gz"
      sha256 "7f2a11f927b14966d542973e9f5f50d16d635f3a9d77633a4704ee9f3d8c52d1"

      def install
        bin.install "proxmux-linux-arm64" => "proxmux"
      end
    end

    on_intel do
      url "https://github.com/asachs01/proxmux/releases/download/v#{version}/proxmux-linux-x64.tar.gz"
      sha256 "7f2a11f927b14966d542973e9f5f50d16d635f3a9d77633a4704ee9f3d8c52d1"

      def install
        bin.install "proxmux-linux-x64" => "proxmux"
      end
    end
  end

  def caveats
    <<~EOS
      To get started, configure your Proxmox connection:
        proxmux --config

      Or create a config file at ~/.config/proxmux/config.json:
        {
          "host": "https://your-proxmox-host:8006",
          "user": "root@pam",
          "tokenId": "your-token-id",
          "tokenSecret": "your-token-secret"
        }

      For more information, visit:
        #{homepage}
    EOS
  end

  test do
    assert_match "proxmux", shell_output("#{bin}/proxmux --help", 0)
  end
end

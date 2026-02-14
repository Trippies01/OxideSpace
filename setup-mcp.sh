#!/bin/bash
# Supabase MCP Setup Script for macOS/Linux

echo "🚀 Supabase MCP Kurulum Başlatılıyor..."

# Cursor MCP config dosya yolu
if [[ "$OSTYPE" == "darwin"* ]]; then
    CURSOR_CONFIG_PATH="$HOME/Library/Application Support/Cursor/User/globalStorage/mcp.json"
else
    CURSOR_CONFIG_PATH="$HOME/.config/Cursor/User/globalStorage/mcp.json"
fi

echo ""
echo "Cursor config dosyası konumu:"
echo "  $CURSOR_CONFIG_PATH"

# Supabase bilgilerini al
echo ""
echo "Supabase bilgilerinizi girin:"
read -p "Supabase URL (örn: https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Supabase Service Role Key (güvenli tutun!): " SUPABASE_SERVICE_KEY

# Config dizinini oluştur
CONFIG_DIR=$(dirname "$CURSOR_CONFIG_PATH")
mkdir -p "$CONFIG_DIR"

# MCP config JSON oluştur
cat > "$CURSOR_CONFIG_PATH" << EOF
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server"
      ],
      "env": {
        "SUPABASE_URL": "$SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY": "$SUPABASE_SERVICE_KEY",
        "SUPABASE_ANON_KEY": "$SUPABASE_ANON_KEY"
      }
    }
  }
}
EOF

echo ""
echo "✅ MCP yapılandırması oluşturuldu!"
echo ""
echo "Cursor'ı yeniden başlatmanız gerekiyor."
echo ""
echo "Test için Cursor'da şu komutları deneyin:"
echo "  @supabase list tables"
echo "  @supabase describe table profiles"



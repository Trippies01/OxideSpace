# Supabase MCP Setup Script for Windows
# Bu script Cursor MCP yapılandırmasını otomatik olarak oluşturur

Write-Host "Supabase MCP Kurulum Başlatılıyor..." -ForegroundColor Green

# Cursor MCP config dosya yolu
$cursorConfigPath = "$env:APPDATA\Cursor\User\globalStorage\mcp.json"
$cursorSettingsPath = "$env:APPDATA\Cursor\User\settings.json"

Write-Host "`nCursor config dosyası konumu:" -ForegroundColor Yellow
Write-Host "  $cursorConfigPath" -ForegroundColor Cyan

# Supabase bilgilerini al
Write-Host "`nSupabase bilgilerinizi girin:" -ForegroundColor Yellow
$supabaseUrl = Read-Host "Supabase URL (örn: https://xxxxx.supabase.co)"
$supabaseAnonKey = Read-Host "Supabase Anon Key"
$supabaseServiceKey = Read-Host "Supabase Service Role Key (güvenli tutun!)"

# MCP config oluştur
$mcpConfig = @{
    mcpServers = @{
        supabase = @{
            command = "npx"
            args = @("-y", "@supabase/mcp-server")
            env = @{
                SUPABASE_URL = $supabaseUrl
                SUPABASE_SERVICE_ROLE_KEY = $supabaseServiceKey
                SUPABASE_ANON_KEY = $supabaseAnonKey
            }
        }
    }
}

# JSON'a dönüştür
$jsonConfig = $mcpConfig | ConvertTo-Json -Depth 10

# Dosyayı kaydet
$configDir = Split-Path -Parent $cursorConfigPath
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$jsonConfig | Out-File -FilePath $cursorConfigPath -Encoding UTF8

Write-Host "`n✅ MCP yapılandırması oluşturuldu!" -ForegroundColor Green
Write-Host "`nCursor'ı yeniden başlatmanız gerekiyor." -ForegroundColor Yellow
Write-Host "`nTest için Cursor'da şu komutları deneyin:" -ForegroundColor Cyan
Write-Host "  @supabase list tables" -ForegroundColor White
Write-Host "  @supabase describe table profiles" -ForegroundColor White



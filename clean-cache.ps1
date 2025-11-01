# Script PowerShell pour nettoyer le cache Next.js

Write-Host "🧹 Nettoyage du cache Next.js..." -ForegroundColor Cyan

# Arrêter tous les processus Node
Write-Host "🛑 Arrêt des processus Node..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Supprimer .next
if (Test-Path ".next") {
    Write-Host "🗑️ Suppression du dossier .next..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ .next supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️ .next n'existe pas" -ForegroundColor Gray
}

# Supprimer node_modules/.cache
if (Test-Path "node_modules/.cache") {
    Write-Host "🗑️ Suppression du cache node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "✅ Cache supprimé" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Nettoyage terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "Vous pouvez maintenant relancer le serveur avec:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""

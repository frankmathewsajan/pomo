$version = (Get-Content package.json | ConvertFrom-Json).version
$tagName = "v$version"

Write-Host "Releasing $tagName..."

# Build the project
npm run tauri build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Aborting release." -ForegroundColor Red
    exit 1
}

# Create a local tag
git tag $tagName
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create tag. It might already exist." -ForegroundColor Yellow
} else {
    git push origin $tagName
}

# Create Github Release using GitHub CLI
$msiPath = "src-tauri\target\release\bundle\msi\pomo_${version}_x64_en-US.msi"
$exePath = "src-tauri\target\release\bundle\nsis\pomo_${version}_x64-setup.exe"

# We check if they exist before uploading
$filesToUpload = @()
if (Test-Path $msiPath) { $filesToUpload += $msiPath }
if (Test-Path $exePath) { $filesToUpload += $exePath }

if ($filesToUpload.Count -eq 0) {
    Write-Host "No build artifacts found to upload." -ForegroundColor Red
    exit 1
}

Write-Host "Creating GitHub Release and uploading artifacts..."
gh release create $tagName $filesToUpload --title "Release $tagName" --generate-notes

Write-Host "Done." -ForegroundColor Green

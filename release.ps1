$packageJsonPath = "package.json"
$packageLockJsonPath = "package-lock.json"
$cargoTomlPath = "src-tauri\Cargo.toml"
$tauriConfPath = "src-tauri\tauri.conf.json"

$currentVersion = (Get-Content $packageJsonPath | ConvertFrom-Json).version

Write-Host "Current version is $currentVersion"
$updateVersion = Read-Host "Do you want to update the version before releasing? (y/N)"

if ($updateVersion -match "^[yY]") {
    $newVersion = Read-Host "Enter new version (e.g. 0.9.1)"
    if (-not [string]::IsNullOrWhiteSpace($newVersion)) {
        Write-Host "Updating version to $newVersion in files..."
        
        $pkgLines = Get-Content $packageJsonPath
        $pkgLines -replace '^(\s*"version":\s*").*?(")', "`${1}$newVersion`$2" | Set-Content $packageJsonPath
        
        $pkgLockLines = Get-Content $packageLockJsonPath
        $pkgLockLines -replace '^(\s*"version":\s*").*?(")', "`${1}$newVersion`$2" | Set-Content $packageLockJsonPath
        
        $tauriLines = Get-Content $tauriConfPath
        $tauriLines -replace '^(\s*"version":\s*").*?(")', "`${1}$newVersion`$2" | Set-Content $tauriConfPath
        
        $cargoContent = Get-Content $cargoTomlPath -Raw
        $cargoContent = $cargoContent -replace '(?m)(^\[package\]\s*[\r\n]+(?:[^\[]*[\r\n]+)*?^version\s*=\s*").*?(")', "`${1}$newVersion`$2"
        Set-Content -Path $cargoTomlPath -Value $cargoContent -NoNewline

        $version = $newVersion
    }
    else {
        $version = $currentVersion
    }
}
else {
    $version = $currentVersion
}

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
}
else {
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

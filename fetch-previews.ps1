$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Continue'
$repos = @('Calabash', 'Linnet', 'Skills-as-Docs')
$dir = Join-Path $PSScriptRoot 'assets'
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

foreach ($repo in $repos) {
    $lower = $repo.ToLower()
    $out = Join-Path $dir ("$lower.png")
    $url = "https://opengraph.githubassets.com/1/Guesswhat-Studio/$repo"
    try {
        Invoke-WebRequest -Uri $url -UseBasicParsing -UserAgent 'Mozilla/5.0' -OutFile $out
        $size = (Get-Item $out).Length
        Write-Host "$repo : OK ($size bytes) -> $out"
    } catch {
        Write-Host "$repo : FAILED - $($_.Exception.Message)"
    }
}

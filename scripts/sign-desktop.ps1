param(
    [string]$FilePath,
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'
$thumbprint = ($env:SFD_SIGN_CERT_THUMBPRINT -replace '\s', '').ToUpperInvariant()
if ($thumbprint -notmatch '^[0-9A-F]{40}$') {
    throw 'Set SFD_SIGN_CERT_THUMBPRINT to a trusted code-signing certificate in CurrentUser\My.'
}
$certificate = Get-Item -LiteralPath "Cert:\CurrentUser\My\$thumbprint"
if (-not $certificate.HasPrivateKey -or $certificate.NotAfter -le (Get-Date) -or $certificate.NotBefore -gt (Get-Date)) {
    throw 'The signing certificate must be valid and have an accessible private key.'
}
if ('1.3.6.1.5.5.7.3.3' -notin @($certificate.EnhancedKeyUsageList.ObjectId)) {
    throw 'The selected certificate is not a code-signing certificate.'
}
$chain = [System.Security.Cryptography.X509Certificates.X509Chain]::new()
try {
    if (-not $chain.Build($certificate)) { throw 'The signing certificate chain is not trusted.' }
} finally { $chain.Dispose() }

$signTool = $env:SFD_SIGNTOOL_PATH
if (-not $signTool) {
    $sdkBin = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits\10\bin'
    $signTool = Get-ChildItem -LiteralPath $sdkBin -Directory |
        Where-Object { $_.Name -match '^10\.0\.\d+\.\d+$' } |
        Sort-Object { [version]$_.Name } -Descending |
        ForEach-Object { Join-Path $_.FullName 'x64\signtool.exe' } |
        Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $signTool -or -not (Test-Path -LiteralPath $signTool -PathType Leaf)) {
    throw 'Install Windows SDK SignTool or set SFD_SIGNTOOL_PATH to signtool.exe.'
}
if ($CheckOnly) { Write-Output 'Code-signing certificate and SignTool are available.'; exit 0 }
if (-not $FilePath -or -not (Test-Path -LiteralPath $FilePath -PathType Leaf)) { throw 'A file to sign is required.' }

& $signTool sign /sha1 $thumbprint /s My /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 $FilePath
if ($LASTEXITCODE -ne 0) { throw 'Authenticode signing failed.' }
& $signTool verify /pa /all /tw $FilePath
if ($LASTEXITCODE -ne 0) { throw 'Authenticode verification failed.' }
$signature = Get-AuthenticodeSignature -LiteralPath $FilePath
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Thumbprint -ne $thumbprint -or -not $signature.TimeStamperCertificate) {
    throw 'Expected a trusted, timestamped signature from the configured publisher.'
}

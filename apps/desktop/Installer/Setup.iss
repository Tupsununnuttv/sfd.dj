#ifndef AppVersion
  #error AppVersion must be supplied by the release builder
#endif
#ifndef PayloadDir
  #error PayloadDir must be supplied by the release builder
#endif
#ifndef PrerequisiteInclude
  #error PrerequisiteInclude must be supplied by the release builder
#endif
#include PrerequisiteInclude
#ifdef InstallerTests
  #define ProductName "SFD DJ Desktop Installer Test"
  #define ProductId "SFD-DJ-Desktop-Installer-Tests"
#else
  #define ProductName "SFD DJ Desktop"
  #define ProductId "SFD.DJ.Desktop"
#endif

[Setup]
AppId={#ProductId}
AppName={#ProductName}
AppVersion={#AppVersion}
AppPublisher=SFD-DJ.EU
AppPublisherURL=https://sfd-dj.eu/
AppSupportURL=https://sfd-dj.eu/contact
DefaultDirName={autopf}\SFD DJ Desktop
DefaultGroupName={#ProductName}
DisableDirPage=no
AppendDefaultDirName=no
DisableProgramGroupPage=yes
DisableWelcomePage=no
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=commandline
MinVersion=10.0.22000
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
SetupIconFile=..\Assets\app.ico
UninstallDisplayIcon={app}\SFD-DJ-Desktop.exe
WizardStyle=modern dynamic
WizardImageFile=..\Assets\wizard-banner.png
WizardSmallImageFile=..\Assets\wizard-logo.png
WizardImageBackColor=$171017
OutputDir={#OutputDir}
OutputBaseFilename=SFD-DJ-Setup
VersionInfoDescription=SFD DJ Desktop Setup
VersionInfoProductName=SFD DJ Desktop
VersionInfoCompany=SFD-DJ.EU
Compression=lzma2
SolidCompression=yes
CloseApplications=yes
RestartApplications=no
Uninstallable=yes
ShowLanguageDialog=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "estonian"; MessagesFile: "Languages\Estonian.isl"
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "german"; MessagesFile: "compiler:Languages\German.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "finnish"; MessagesFile: "compiler:Languages\Finnish.isl"
Name: "ukrainian"; MessagesFile: "compiler:Languages\Ukrainian.isl"
Name: "latvian"; MessagesFile: "Languages\Latvian.isl"
Name: "lithuanian"; MessagesFile: "compiler:Languages\Lithuanian.isl"
Name: "polish"; MessagesFile: "compiler:Languages\Polish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#PayloadDir}\*"; DestDir: "{app}"; Excludes: "*.xml,*.pdb"; Flags: ignoreversion recursesubdirs createallsubdirs
#ifdef InstallerTests
Source: "{#TestStubDir}\*"; Flags: dontcopy
#endif

[Icons]
Name: "{group}\SFD DJ Desktop"; Filename: "{app}\SFD-DJ-Desktop.exe"; IconFilename: "{app}\SFD-DJ-Desktop.exe"
Name: "{autodesktop}\SFD DJ Desktop"; Filename: "{app}\SFD-DJ-Desktop.exe"; IconFilename: "{app}\SFD-DJ-Desktop.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\SFD-DJ-Desktop.exe"; Description: "{cm:LaunchProgram,SFD DJ Desktop}"; Flags: nowait postinstall skipifsilent runasoriginaluser; Check: CanLaunch

[CustomMessages]
english.Win11Required=SFD DJ Desktop requires Windows 11 (64-bit).
english.Components=Setup automatically installs required Microsoft .NET Desktop Runtime, Visual C++ Redistributable and WebView2 components if they are missing or outdated. An internet connection is required for these downloads.
english.InstallingComponent=Installing %1...
english.ComponentError=Could not install %1 (error %2). Check your internet connection and try again.
estonian.Win11Required=SFD DJ Desktop vajab Windows 11 (64-bitine).
estonian.Components=Paigaldaja lisab automaatselt vajalikud Microsoft .NET Desktop Runtime’i, Visual C++ Redistributable’i ja WebView2 komponendid, kui need puuduvad või on vananenud. Nende allalaadimiseks on vaja internetiühendust.
estonian.InstallingComponent=Komponendi %1 paigaldamine...
estonian.ComponentError=Komponendi %1 paigaldamine ebaõnnestus (viga %2). Kontrolli internetiühendust ja proovi uuesti.
russian.Win11Required=Для SFD DJ Desktop требуется Windows 11 (64-разрядная).
russian.Components=Установщик автоматически добавит необходимые компоненты Microsoft .NET Desktop Runtime, Visual C++ Redistributable и WebView2, если они отсутствуют или устарели. Для загрузки требуется интернет.
russian.InstallingComponent=Установка %1...
russian.ComponentError=Не удалось установить %1 (ошибка %2). Проверьте подключение к интернету и повторите попытку.
brazilianportuguese.Win11Required=O SFD DJ Desktop requer o Windows 11 (64 bits).
brazilianportuguese.Components=O instalador adiciona automaticamente os componentes Microsoft .NET Desktop Runtime, Visual C++ Redistributable e WebView2 necessários quando estão ausentes ou desatualizados. É preciso ter acesso à internet para baixá-los.
brazilianportuguese.InstallingComponent=Instalando %1...
brazilianportuguese.ComponentError=Não foi possível instalar %1 (erro %2). Verifique sua conexão com a internet e tente novamente.
spanish.Win11Required=SFD DJ Desktop requiere Windows 11 (64 bits).
spanish.Components=El instalador añade automáticamente los componentes Microsoft .NET Desktop Runtime, Visual C++ Redistributable y WebView2 necesarios si faltan o están desactualizados. Se requiere conexión a internet para descargarlos.
spanish.InstallingComponent=Instalando %1...
spanish.ComponentError=No se pudo instalar %1 (error %2). Comprueba tu conexión a internet e inténtalo de nuevo.
german.Win11Required=SFD DJ Desktop benötigt Windows 11 (64 Bit).
german.Components=Das Setup installiert die erforderlichen Komponenten Microsoft .NET Desktop Runtime, Visual C++ Redistributable und WebView2 automatisch, wenn sie fehlen oder veraltet sind. Für diese Downloads ist eine Internetverbindung erforderlich.
german.InstallingComponent=%1 wird installiert...
german.ComponentError=%1 konnte nicht installiert werden (Fehler %2). Prüfe deine Internetverbindung und versuche es erneut.
french.Win11Required=SFD DJ Desktop nécessite Windows 11 (64 bits).
french.Components=Le programme d’installation ajoute automatiquement les composants Microsoft .NET Desktop Runtime, Visual C++ Redistributable et WebView2 nécessaires s’ils sont absents ou obsolètes. Une connexion internet est requise pour ces téléchargements.
french.InstallingComponent=Installation de %1...
french.ComponentError=Impossible d’installer %1 (erreur %2). Vérifiez votre connexion internet et réessayez.
finnish.Win11Required=SFD DJ Desktop vaatii Windows 11:n (64-bittinen).
finnish.Components=Asennusohjelma lisää tarvittavat Microsoft .NET Desktop Runtime-, Visual C++ Redistributable- ja WebView2-komponentit automaattisesti, jos ne puuttuvat tai ovat vanhentuneita. Niiden lataaminen vaatii internetyhteyden.
finnish.InstallingComponent=Asennetaan %1...
finnish.ComponentError=Komponentin %1 asennus epäonnistui (virhe %2). Tarkista internetyhteys ja yritä uudelleen.
ukrainian.Win11Required=Для SFD DJ Desktop потрібна Windows 11 (64-розрядна).
ukrainian.Components=Інсталятор автоматично додасть потрібні компоненти Microsoft .NET Desktop Runtime, Visual C++ Redistributable та WebView2, якщо вони відсутні або застарілі. Для завантаження потрібен інтернет.
ukrainian.InstallingComponent=Встановлення %1...
ukrainian.ComponentError=Не вдалося встановити %1 (помилка %2). Перевірте підключення до інтернету та спробуйте ще раз.
latvian.Win11Required=SFD DJ Desktop ir nepieciešama Windows 11 (64 bitu).
latvian.Components=Instalētājs automātiski pievieno nepieciešamos Microsoft .NET Desktop Runtime, Visual C++ Redistributable un WebView2 komponentus, ja tie trūkst vai ir novecojuši. To lejupielādei ir nepieciešams interneta savienojums.
latvian.InstallingComponent=Instalē %1...
latvian.ComponentError=Neizdevās instalēt %1 (kļūda %2). Pārbaudiet interneta savienojumu un mēģiniet vēlreiz.
lithuanian.Win11Required=SFD DJ Desktop reikia Windows 11 (64 bitų).
lithuanian.Components=Diegimo programa automatiškai prideda reikiamus Microsoft .NET Desktop Runtime, Visual C++ Redistributable ir WebView2 komponentus, jei jų trūksta arba jie pasenę. Šiems atsisiuntimams reikalingas interneto ryšys.
lithuanian.InstallingComponent=Diegiama %1...
lithuanian.ComponentError=Nepavyko įdiegti %1 (klaida %2). Patikrinkite interneto ryšį ir bandykite dar kartą.
polish.Win11Required=SFD DJ Desktop wymaga systemu Windows 11 (64-bitowego).
polish.Components=Instalator automatycznie dodaje wymagane składniki Microsoft .NET Desktop Runtime, Visual C++ Redistributable i WebView2, jeśli ich brakuje lub są nieaktualne. Do ich pobrania wymagane jest połączenie z internetem.
polish.InstallingComponent=Instalowanie %1...
polish.ComponentError=Nie udało się zainstalować %1 (błąd %2). Sprawdź połączenie z internetem i spróbuj ponownie.

[Code]
var
  DependencyRestart: Boolean;
  DownloadPage: TDownloadWizardPage;

function VersionAtLeast(Value, Minimum: String): Boolean;
var Actual, Required: Int64;
begin
  if (Length(Value) > 0) and ((Value[1] = 'v') or (Value[1] = 'V')) then Delete(Value, 1, 1);
  Result := StrToVersion(Value, Actual) and StrToVersion(Minimum, Required);
  if Result then Result := ComparePackedVersion(Actual, Required) >= 0;
end;

#ifdef InstallerTests
function TestPresent(Kind, Minimum: String): Boolean;
var Value: AnsiString;
begin
  Result := LoadStringFromFile('{#TestStateDir}\' + Kind + '.version', Value);
  if Result then Result := VersionAtLeast(Trim(String(Value)), Minimum);
  Log('Test prerequisite ' + Kind + ': ' + String(Value) + ' >= ' + Minimum);
end;
#endif

function DotNetPresent: Boolean;
var Names: TArrayOfString; I, J: Integer; Root: Integer;
begin
#ifdef InstallerTests
  Result := TestPresent('dotnet', '{#DotNetVersion}');
#else
  Result := False;
  for I := 0 to 1 do begin
    if I = 0 then Root := HKLM64 else Root := HKLM32;
    if RegGetValueNames(Root, 'SOFTWARE\dotnet\Setup\InstalledVersions\x64\sharedfx\Microsoft.WindowsDesktop.App', Names) then begin
      for J := 0 to GetArrayLength(Names) - 1 do
        if (Copy(Names[J], 1, 3) = '10.') and VersionAtLeast(Names[J], '{#DotNetVersion}') then begin Result := True; Exit; end;
    end;
  end;
#endif
end;

function VcPresent: Boolean;
var Root, I: Integer; Installed: Cardinal; Version: String;
begin
#ifdef InstallerTests
  Result := TestPresent('vc', '{#VcVersion}');
#else
  Result := False;
  for I := 0 to 1 do begin
    if I = 0 then Root := HKLM64 else Root := HKLM32;
    if RegQueryDWordValue(Root, 'SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64', 'Installed', Installed)
      and (Installed = 1) and RegQueryStringValue(Root, 'SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64', 'Version', Version)
      and VersionAtLeast(Version, '{#VcVersion}') then begin Result := True; Exit; end;
  end;
#endif
end;

function WebViewPresent: Boolean;
var Version: String;
begin
#ifdef InstallerTests
  Result := TestPresent('webview', '1.0.0.0');
#else
  Result := RegQueryStringValue(HKLM32, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version)
    and VersionAtLeast(Version, '1.0.0.0');
  if not Result then Result := RegQueryStringValue(HKCU, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', Version)
    and VersionAtLeast(Version, '1.0.0.0');
#endif
end;

function Present(Kind: String): Boolean;
begin
  if Kind = 'dotnet' then Result := DotNetPresent
  else if Kind = 'vc' then Result := VcPresent
  else Result := WebViewPresent;
end;

function InstallComponent(Kind, Name, Url, Hash, FileName, Parameters: String): String;
var Code: Integer; Command: String;
begin
  Result := '';
  if Present(Kind) then begin Log(Name + ': already installed'); Exit; end;
  try
    WizardForm.PreparingLabel.Caption := FmtMessage(CustomMessage('InstallingComponent'), [Name]);
#ifdef InstallerTests
    ExtractTemporaryFile('PrerequisiteStub.exe');
    ExtractTemporaryFile('PrerequisiteStub.dll');
    ExtractTemporaryFile('PrerequisiteStub.runtimeconfig.json');
    Command := ExpandConstant('{tmp}\PrerequisiteStub.exe');
    Parameters := Parameters + ' --kind=' + Kind + ' --state="{#TestStateDir}"';
#else
    DownloadPage.Clear;
    DownloadPage.Add(Url, FileName, Hash);
    DownloadPage.Show;
    try DownloadPage.Download; finally DownloadPage.Hide; end;
    Command := ExpandConstant('{tmp}\') + FileName;
#endif
    if not Exec(Command, Parameters, '', SW_HIDE, ewWaitUntilTerminated, Code) then begin
      Result := FmtMessage(CustomMessage('ComponentError'), [Name, IntToStr(Code)]); Exit;
    end;
    if (Code = 3010) or (Code = 1641) then DependencyRestart := True
    else if ((Code <> 0) and (Code <> 1638)) or not Present(Kind) then
      Result := FmtMessage(CustomMessage('ComponentError'), [Name, IntToStr(Code)]);
  except Result := Name + ': ' + GetExceptionMessage; end;
end;

function InitializeSetup: Boolean;
var OS: TWindowsVersion;
begin
  GetWindowsVersionEx(OS);
  Result := (OS.Major = 10) and (OS.Minor = 0) and (OS.Build >= 22000) and (OS.ProductType = VER_NT_WORKSTATION);
  if not Result then SuppressibleMsgBox(CustomMessage('Win11Required'), mbError, MB_OK, IDOK);
  // Read-only deployment diagnostic: report detection and exit before changing the system.
  if Result and (ExpandConstant('{param:CHECKPREREQUISITES|}') = '1') then begin
    Log('CHECK language=' + ExpandConstant('{language}'));
    Log('CHECK next=' + SetupMessage(msgButtonNext));
    Log('CHECK folder=' + SetupMessage(msgWizardSelectDir));
    Log('CHECK shortcut=' + CustomMessage('CreateDesktopIcon'));
    Log('CHECK components=' + CustomMessage('Components'));
    Log('CHECK componentError=' + CustomMessage('ComponentError'));
    if DotNetPresent then Log('CHECK dotnet=1') else Log('CHECK dotnet=0');
    if VcPresent then Log('CHECK vc=1') else Log('CHECK vc=0');
    if WebViewPresent then Log('CHECK webview=1') else Log('CHECK webview=0');
    Result := False;
  end;
end;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), CustomMessage('Components'), nil);
end;

function UpdateReadyMemo(Space, NewLine, UserInfo, DirInfo, TypeInfo, Components, GroupInfo, Tasks: String): String;
begin
  Result := DirInfo + NewLine + NewLine + GroupInfo + NewLine + Tasks + NewLine + NewLine + CustomMessage('Components');
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  Result := InstallComponent('vc', 'Microsoft Visual C++ Redistributable', '{#VcUrl}', '{#VcHash}', 'vc_redist.x64.exe', '/install /quiet /norestart');
  if Result <> '' then Exit;
  Result := InstallComponent('dotnet', '.NET Desktop Runtime {#DotNetVersion}', '{#DotNetUrl}', '{#DotNetHash}', 'windowsdesktop-runtime.exe', '/install /quiet /norestart');
  if Result <> '' then Exit;
  Result := InstallComponent('webview', 'Microsoft Edge WebView2', '{#WebViewUrl}', '{#WebViewHash}', 'MicrosoftEdgeWebView2Setup.exe', '/silent /install');
end;

function NeedRestart: Boolean;
begin Result := DependencyRestart; end;

function CanLaunch: Boolean;
begin Result := not DependencyRestart; end;

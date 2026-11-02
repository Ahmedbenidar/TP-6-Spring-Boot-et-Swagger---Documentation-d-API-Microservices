<#
    Convertit une sortie console (fichier .log) en image PNG de terminal.
    Utilisation :
        powershell -ExecutionPolicy Bypass -File docs\tools\console-vers-png.ps1 `
            -Entree docs\logs\tests-endpoints.log -Sortie docs\screenshots\tests-endpoints.png `
            -Titre "Tests des endpoints REST"

    -LargeurMax renvoie a la ligne les lignes trop longues (comme le ferait
    une vraie fenetre de terminal) afin de garder une image lisible.
    -Debut / -Fin limitent l'image a une plage de lignes du fichier source
    (1 = premiere ligne) pour extraire une portion du log reel.
#>
param(
    [Parameter(Mandatory = $true)][string]$Entree,
    [Parameter(Mandatory = $true)][string]$Sortie,
    [Parameter(Mandatory = $true)][string]$Titre,
    [int]$LargeurMax = 110,
    [double]$TaillePolice = 13,
    [int]$Debut = 0,
    [int]$Fin = 0
)

Add-Type -AssemblyName System.Drawing

$dossier = Split-Path -Parent $Sortie
if (-not (Test-Path $dossier)) { New-Item -ItemType Directory -Path $dossier | Out-Null }

$brutes = [System.IO.File]::ReadAllLines((Resolve-Path $Entree))
if ($Debut -gt 0 -or $Fin -gt 0) {
    $d = [Math]::Max($Debut, 1)
    $f = if ($Fin -gt 0) { [Math]::Min($Fin, $brutes.Count) } else { $brutes.Count }
    $brutes = $brutes[($d - 1)..($f - 1)]
}

$lignes = New-Object System.Collections.Generic.List[string]
foreach ($l in $brutes) {
    $texte = $l.Replace("`t", "    ")
    if ($texte.Length -le $LargeurMax) {
        $lignes.Add($texte)
    }
    else {
        $reste = $texte
        while ($reste.Length -gt $LargeurMax) {
            $lignes.Add($reste.Substring(0, $LargeurMax))
            $reste = "    " + $reste.Substring($LargeurMax)
        }
        $lignes.Add($reste)
    }
}

$police = New-Object System.Drawing.Font("Consolas", $TaillePolice)
$policeTitre = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)

$mesure = New-Object System.Drawing.Bitmap 1, 1
$g = [System.Drawing.Graphics]::FromImage($mesure)
$largeurCaractere = $g.MeasureString("M", $police).Width
$hauteurLigne = [int][Math]::Ceiling($g.MeasureString("Mg", $police).Height)
$g.Dispose()
$mesure.Dispose()

$largeurTexte = 0
foreach ($l in $lignes) {
    $w = [int][Math]::Ceiling($l.Length * $largeurCaractere)
    if ($w -gt $largeurTexte) { $largeurTexte = $w }
}

$marge = 18
$barre = 38
$largeur = [Math]::Max($largeurTexte + 2 * $marge, 900)
$hauteur = $lignes.Count * $hauteurLigne + 2 * $marge + $barre

$image = New-Object System.Drawing.Bitmap $largeur, $hauteur
$dessin = [System.Drawing.Graphics]::FromImage($image)
$dessin.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$dessin.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$fond = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(12, 12, 12))
$barreFond = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(45, 45, 48))
$dessin.FillRectangle($fond, 0, 0, $largeur, $hauteur)
$dessin.FillRectangle($barreFond, 0, 0, $largeur, $barre)
$dessin.DrawString($Titre, $policeTitre, [System.Drawing.Brushes]::WhiteSmoke, 14, 9)

$bouton = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(90, 90, 95))
$dessin.FillEllipse($bouton, 12, 14, 11, 11)

$texte = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 220, 220))
$y = $marge + $barre
foreach ($l in $lignes) {
    $dessin.DrawString($l, $police, $texte, $marge, $y)
    $y += $hauteurLigne
}

$image.Save((Join-Path (Get-Location) $Sortie), [System.Drawing.Imaging.ImageFormat]::Png)
$dessin.Dispose()
$image.Dispose()
$police.Dispose()
$policeTitre.Dispose()
$fond.Dispose()
$barreFond.Dispose()
$bouton.Dispose()
$texte.Dispose()

"Image generee : $Sortie ($largeur x $hauteur)"

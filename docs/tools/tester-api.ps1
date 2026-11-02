# ------------------------------------------------------------------
# Test des endpoints REST de l'API etudiants (application sur le port 8080).
# Chaque ligne "PS>" est la commande reellement executee par le terminal.
# Les corps JSON sont dans docs/payloads/ car, sous Windows, curl.exe ne
# recoit pas correctement un JSON inline entre guillemets.
# ------------------------------------------------------------------
$base = "http://localhost:8080"
$format = '\n[HTTP %{http_code}]'

function Afficher([string]$commande, [scriptblock]$execution) {
    Write-Output ("PS> " + $commande)
    $sortie = & $execution
    Write-Output $sortie
    Write-Output ""
}

Write-Output "=== 1. Nombre d'etudiants enregistres ==="
Afficher "curl.exe -s $base/students/count" {
    curl.exe -s -w $format "$base/students/count"
}

Write-Output "=== 2. Liste complete des etudiants ==="
Afficher "curl.exe -s $base/students/all | ConvertFrom-Json | Format-Table id,nom,prenom,dateNaissance,filiere -AutoSize" {
    (curl.exe -s "$base/students/all") | ConvertFrom-Json |
        Format-Table id, nom, prenom, dateNaissance, filiere -AutoSize | Out-String -Width 200
}

Write-Output "=== 3. POST /students/save : ajout d'un etudiant ==="
Afficher "curl.exe -s -X POST $base/students/save -H `"Content-Type: application/json`" -d @docs/payloads/etudiant.json" {
    Get-Content docs\payloads\etudiant.json
    curl.exe -s -w $format -X POST "$base/students/save" -H "Content-Type: application/json" -d "@docs/payloads/etudiant.json"
}

$idCree = @((curl.exe -s "$base/students/search?nom=ALAOUI") | ConvertFrom-Json)[0].id

Write-Output "=== 4. GET /students/$idCree : consultation de l'etudiant cree ==="
Afficher "curl.exe -s $base/students/$idCree" {
    curl.exe -s -w $format "$base/students/$idCree"
}

Write-Output "=== 5. GET /students/count apres ajout ==="
Afficher "curl.exe -s $base/students/count" {
    curl.exe -s -w $format "$base/students/count"
}

Write-Output "=== 6. GET /students/byYear : repartition par annee de naissance ==="
Afficher "curl.exe -s $base/students/byYear" {
    curl.exe -s -w $format "$base/students/byYear"
}

Write-Output "=== 7. POST /students/save : donnees invalides (validation Jakarta) ==="
Afficher "curl.exe -s -X POST $base/students/save -H `"Content-Type: application/json`" -d @docs/payloads/etudiant-invalide.json" {
    curl.exe -s -w $format -X POST "$base/students/save" -H "Content-Type: application/json" -d "@docs/payloads/etudiant-invalide.json"
}

Write-Output "=== 8. GET /students/999 : identifiant inexistant ==="
Afficher "curl.exe -s $base/students/999" {
    curl.exe -s -w $format "$base/students/999"
}

Write-Output "=== 9. GET /students/search?nom=BEN ==="
Afficher "curl.exe -s `"$base/students/search?nom=BEN`" | ConvertFrom-Json | Format-Table id,nom,prenom,filiere -AutoSize" {
    (curl.exe -s "$base/students/search?nom=BEN") | ConvertFrom-Json |
        Format-Table id, nom, prenom, filiere -AutoSize | Out-String -Width 200
}

Write-Output "=== 10. GET /students/statistiques ==="
Afficher "curl.exe -s $base/students/statistiques | ConvertFrom-Json | ConvertTo-Json -Depth 4" {
    (curl.exe -s "$base/students/statistiques") | ConvertFrom-Json | ConvertTo-Json -Depth 4
}

Write-Output "=== 11. DELETE /students/delete/$idCree : suppression puis deuxieme appel ==="
Afficher "curl.exe -s -X DELETE $base/students/delete/$idCree" {
    curl.exe -s -w $format -X DELETE "$base/students/delete/$idCree"
}
Afficher "curl.exe -s -X DELETE $base/students/delete/$idCree" {
    curl.exe -s -w $format -X DELETE "$base/students/delete/$idCree"
}

Write-Output "=== 12. Documentation OpenAPI generee par springdoc ==="
Afficher "curl.exe -s $base/v3/api-docs | ConvertFrom-Json | Select-Object -ExpandProperty paths | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name | Where-Object { `$_ -like '/students*' }" {
    (curl.exe -s "$base/v3/api-docs") | ConvertFrom-Json | Select-Object -ExpandProperty paths |
        Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name |
        Where-Object { $_ -like "/students*" }
}

Write-Output "=== 13. Swagger UI ==="
Afficher "curl.exe -s -o NUL -w `"HTTP %{http_code}`" $base/swagger-ui/index.html" {
    curl.exe -s -o NUL -w "HTTP %{http_code}" "$base/swagger-ui/index.html"
}

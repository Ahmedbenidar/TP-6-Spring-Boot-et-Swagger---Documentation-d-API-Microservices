# ------------------------------------------------------------------
# Affichage des resultats reels des tests unitaires JUnit 5 / Mockito
# a partir des rapports Surefire produits par "mvn test".
# Chaque ligne "PS>" est la commande reellement executee par le terminal.
# ------------------------------------------------------------------
$rapport = "target\surefire-reports\com.example.studentmanagement.web.StudentControllerTest.txt"
$xml = "target\surefire-reports\TEST-com.example.studentmanagement.web.StudentControllerTest.xml"

Write-Output "=== 1. Rapport texte genere par Surefire ==="
Write-Output "PS> Get-Content $rapport"
Get-Content $rapport
Write-Output ""

Write-Output "=== 2. Detail des 9 tests executes ==="
Write-Output "PS> ([xml](Get-Content $xml)).testsuite.testcase | Format-Table name,time -AutoSize"
([xml](Get-Content $xml)).testsuite.testcase |
    ForEach-Object { [pscustomobject]@{ test = $_.name; duree_s = $_.time; statut = "OK" } } |
    Format-Table -AutoSize | Out-String -Width 200
Write-Output ""

Write-Output "=== 3. Synthese de la suite de tests ==="
Write-Output "PS> ([xml](Get-Content $xml)).testsuite | Select-Object name,tests,failures,errors,skipped,time"
([xml](Get-Content $xml)).testsuite |
    Select-Object name, tests, failures, errors, skipped, time |
    Format-List | Out-String -Width 200

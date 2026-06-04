#!/usr/bin/env pwsh

param(
    [string]$SourceDir = ".\HTML",
    [string]$OutputDir = ".\converted",
    [string[]]$FileFilter = @("Carnival-of-Crime-in-CT.html", "Adventures-of-Tom-Sawyer.html", "Connecticut-Yankee.html", "A-Tramp-Abroad.html", "Eves-Diary.html"),
    [switch]$ConvertAll
)

New-Item -ItemType Directory -Path $OutputDir -Force > $null

function Convert-BookHTML {
    param([string]$sourceFile, [string]$outputFile)

    try {
        $html = [System.IO.File]::ReadAllText($sourceFile, [System.Text.Encoding]::UTF8)

        $title = if ($html -match "<title>([^<]+)</title>") {
            ($matches[1] -replace "^\s+|\s+$").Trim()
        } else {
            [System.IO.Path]::GetFileNameWithoutExtension($sourceFile)
        }

        $author = "Mark Twain"
        $illustrator = ""
        if ($html -match "Illustrated by\s+([^<]+)<") {
            $illustrator = $matches[1].Trim()
        }

        $bodyMatch = [regex]::Match($html, "<body[^>]*>(.*?)</body>", [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if (-not $bodyMatch.Success) {
            throw "No body tag found"
        }

        $bodyContent = $bodyMatch.Groups[1].Value
        $bodyContent = $bodyContent -replace '(?s)<pre[^>]*>.*?\*\*\*(START|END) OF.*?</pre>\s*', ""
        $bodyContent = $bodyContent -replace '(?s)<div[^>]*>\*\*\*(START|END) OF.*?</div>\s*', ""
        $bodyContent = $bodyContent -replace '(?s)<p>\s*<br\s*/?>\s*</p>', ""
        $bodyContent = $bodyContent -replace '(?s)(<br\s*/?>\s*){5,}', "`n`n"

        $bookSlug = [System.IO.Path]::GetFileNameWithoutExtension($sourceFile)
        $bodyContent = $bodyContent -replace 'src="images/', "src=""/images/mark-twain/$bookSlug/"

        $jsonLd = @{
            "@context" = "https://schema.org"
            "@type" = "Book"
            "name" = $title
            "author" = @{
                "@type" = "Person"
                "name" = $author
            }
            "inLanguage" = "en"
        }

        if ($illustrator) {
            $jsonLd["illustrator"] = @{
                "@type" = "Person"
                "name" = $illustrator
            }
        }

        $jsonLdStr = ($jsonLd | ConvertTo-Json -Depth 10) -replace "`r`n", "`n"

        $newHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$title</title>
    <script type="application/ld+json">
$jsonLdStr
    </script>
    <style>
        :root {
            --bg: #15110d;
            --surface: #1d1611;
            --text: rgba(255, 244, 223, 0.95);
            --accent: #d9a34a;
            --spacing: 1.5rem;
        }

        * { box-sizing: border-box; }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: Georgia, serif;
            margin: 0;
            padding: 2rem;
            line-height: 1.8;
        }

        .book-text-content {
            max-width: 900px;
            margin: 0 auto;
        }

        h1, h2, h3, h4, h5, h6 {
            font-family: 'Courier Prime', 'Playfair Display', serif;
            color: var(--accent);
            margin-top: 2.5em;
            margin-bottom: 1em;
            text-align: center;
        }

        h1 { font-size: 2.5em; }
        h2 { font-size: 2em; }
        h3 { font-size: 1.5em; }

        p { margin: 0.8em 0; text-align: justify; }
        hr { border: none; border-top: 2px solid var(--accent); margin: 2em 0; }
        img { max-width: 100%; height: auto; display: block; }

        .paragraph-with-image {
            display: flex;
            gap: 2rem;
            margin: 2.5em 0;
            align-items: flex-start;
        }

        .layout-right { flex-direction: row-reverse; }
        .layout-left { flex-direction: row; }

        .circle-img-wrapper {
            flex-shrink: 0;
            width: 250px;
            height: 250px;
            border-radius: 50%;
            overflow: hidden;
            border: 2px solid var(--accent);
            position: relative;
        }

        .circle-img-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .image-paragraph-text { flex: 1; }

        @media (max-width: 768px) {
            .paragraph-with-image { flex-direction: column !important; }
            .circle-img-wrapper { width: 200px; height: 200px; }
        }
    </style>
</head>
<body>
    <div class="book-text-content">
        $bodyContent
    </div>
</body>
</html>
"@

        [System.IO.File]::WriteAllText($outputFile, $newHtml, [System.Text.Encoding]::UTF8)

        return @{
            Success = $true
            Title = $title
            Illustrator = $illustrator
            BookSlug = $bookSlug
        }

    } catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

$filesToConvert = if ($ConvertAll) {
    Get-ChildItem -Path $SourceDir -Filter "*.html" | Select-Object -ExpandProperty FullName
} else {
    $FileFilter | ForEach-Object {
        $path = Join-Path $SourceDir $_
        if (Test-Path $path) { $path }
    }
}

Write-Host "Converting $($filesToConvert.Count) books...`n" -ForegroundColor Cyan

$results = @()
foreach ($sourceFile in $filesToConvert) {
    $sourceName = Split-Path $sourceFile -Leaf
    $outputFile = Join-Path $OutputDir $sourceName

    Write-Host "Processing: $sourceName" -ForegroundColor White -NoNewline

    $result = Convert-BookHTML $sourceFile $outputFile

    if ($result.Success) {
        Write-Host " [OK]" -ForegroundColor Green
        Write-Host "  Title: $($result.Title)"
        if ($result.Illustrator) { Write-Host "  Illustrator: $($result.Illustrator)" }
        $results += $result
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "  Error: $($result.Error)"
    }
}

Write-Host "`nConversion complete: $($results.Where({$_.Success}).Count) / $($filesToConvert.Count) successful" -ForegroundColor Green
Write-Host "Output: $OutputDir" -ForegroundColor Cyan

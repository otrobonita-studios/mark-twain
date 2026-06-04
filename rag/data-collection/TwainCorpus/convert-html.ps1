#!/usr/bin/env pwsh
<#
.SYNOPSIS
Convert Mark Twain Project Gutenberg HTML files to standardized web format

.DESCRIPTION
Converts dated XHTML/HTML files to clean semantic HTML with:
- JSON-LD metadata
- Responsive image layouts (layout-left/right)
- Consistent CSS classes
- Normalized paths
- Removed Gutenberg boilerplate

.PARAMETER SourceFile
Path to HTML file to convert

.PARAMETER OutputFile
Path where converted file is written (default: same name in current dir)

.PARAMETER ValidateOnly
Only validate, don't write file
#>

param(
    [Parameter(ValueFromPipeline=$true)]
    [string]$SourceFile,
    [string]$OutputFile,
    [switch]$ValidateOnly
)

function ConvertMarkTwainHTML {
    param([string]$sourceFile)

    # Read file
    $html = [System.IO.File]::ReadAllText($sourceFile, [System.Text.Encoding]::UTF8)

    # Extract metadata from title and h1/h2 tags
    $title = ""
    $author = "Mark Twain"
    $illustrator = ""

    if ($html -match "<title>([^<]+)</title>") {
        $title = $matches[1] -replace "^\s+|\s+$" | ForEach-Object { $_.Trim() }
    }

    if ($html -match "Illustrated by\s+([^<]+)<") {
        $illustrator = $matches[1].Trim()
    }

    # Extract body content, removing DOCTYPE and head
    $bodyMatch = [regex]::Match($html, "<body[^>]*>(.*?)</body>", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $bodyMatch.Success) {
        Write-Error "No body tag found in $sourceFile"
        return $null
    }

    $bodyContent = $bodyMatch.Groups[1].Value

    # Remove Project Gutenberg boilerplate
    $bodyContent = $bodyContent -replace '(?s)<pre[^>]*>.*?\*\*\* START OF.*?\*\*\*.*?</pre>\s*', ""
    $bodyContent = $bodyContent -replace '(?s)<div[^>]*>\*\*\* START OF.*?\*\*\*</div>\s*', ""

    # Remove excessive <br /> spacing
    $bodyContent = $bodyContent -replace '(?s)<p>\s*(<br\s*/?>\s*)+</p>', ""
    $bodyContent = $bodyContent -replace '(?s)(<br\s*/?>\s*){4,}', '<br /><br />'

    # Normalize image paths
    $bodyContent = $bodyContent -replace 'src="images/', 'src="/images/mark-twain/[BOOKSLUG]/'

    # Extract book slug from source filename
    $bookSlug = [System.IO.Path]::GetFileNameWithoutExtension($sourceFile)
    $bodyContent = $bodyContent -replace '\[BOOKSLUG\]', $bookSlug

    # Create JSON-LD metadata
    $jsonLd = @{
        "@context" = "https://schema.org"
        "@type" = "Book"
        "name" = $title
        "author" = @{
            "@type" = "Person"
            "name" = $author
        }
        "datePublished" = "1900"
        "inLanguage" = "en"
    }

    if ($illustrator) {
        $jsonLd["illustrator"] = @{
            "@type" = "Person"
            "name" = $illustrator
        }
    }

    $jsonLdStr = $jsonLd | ConvertTo-Json -Depth 10

    # Build new HTML document
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

        body {
            background: var(--bg);
            color: var(--text);
            font-family: Georgia, serif;
            margin: 0;
            padding: var(--spacing);
        }

        .book-text-content {
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.7;
        }

        h1, h2, h3, h4, h5, h6 {
            font-family: 'Courier Prime', 'Playfair Display', serif;
            color: var(--accent);
            margin-top: 2em;
            margin-bottom: 1em;
        }

        h1 { font-size: 2.5em; text-align: center; }
        h2 { font-size: 2em; text-align: center; }
        h3 { font-size: 1.5em; text-align: center; }

        p {
            margin: 0.5em 0;
            text-align: justify;
        }

        .paragraph-with-image {
            display: flex;
            gap: var(--spacing);
            margin: 2em 0;
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
        }

        .circle-img-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .image-paragraph-text {
            flex: 1;
            min-width: 0;
        }

        .book-cover-trio {
            display: flex;
            justify-content: center;
            gap: 2em;
            margin: 3em 0;
        }

        .fig-trio-item {
            width: 200px;
        }

        .fig-trio-item img {
            width: 100%;
            border: 1px solid var(--accent);
        }

        hr {
            border: none;
            border-top: 2px solid var(--accent);
            margin: 2em 0;
        }

        .ask-mark-tooltip-container {
            display: inline;
        }

        .ask-mark-icon {
            vertical-align: super;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="book-text-content">
        <hr>
        $bodyContent
    </div>
</body>
</html>
"@

    return @{
        HTML = $newHtml
        Metadata = $jsonLd
        BookTitle = $title
        BookSlug = $bookSlug
    }
}

# Main execution
if ($sourceFile -and (Test-Path $sourceFile)) {
    Write-Host "Converting: $sourceFile" -ForegroundColor Cyan

    $result = ConvertMarkTwainHTML $sourceFile

    if ($result) {
        if (-not $OutputFile) {
            $OutputFile = Join-Path (Get-Location) ([System.IO.Path]::GetFileName($sourceFile))
        }

        if (-not $ValidateOnly) {
            [System.IO.File]::WriteAllText($OutputFile, $result.HTML, [System.Text.Encoding]::UTF8)
            Write-Host "✓ Wrote: $OutputFile" -ForegroundColor Green
        } else {
            Write-Host "✓ Validation passed" -ForegroundColor Green
            Write-Host "Title: $($result.BookTitle)"
            Write-Host "Slug: $($result.BookSlug)"
        }
    }
}

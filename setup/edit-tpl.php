<?php

$params = getopt("l:c:");

$lc = $params['l'];
$c = $params['c'];

if ($lc == "high-level" || $lc == "low-level") $lc .= "-components"; 

$fullFilePath = "templates/page-parts/{$lc}.tpl";
$lines = file($fullFilePath);
$isElement = false;
$newLines = [];

foreach ($lines as $line) {
    $line = trim($line);

    if ($line == "") continue;

    if (is_int(strpos($line, 'class="element"'))) {
        $newLines[] = $line;
        $isElement = true;
        continue;
    }

    if ($isElement) {
        if (is_int(strpos($line, "</div>"))) {
            $newLines[] = "  {@{$c}}";
            $newLines[] = $line;
            $isElement = false;
            continue;
        }

        $newLines[] = "  {$line}\n";
        continue;
    }

    if (!is_int(strpos($line, "<"))) $line = "  {$line}";

    $newLines[] = $line;
}

$newLines = implode("\n", $newLines);
file_put_contents($fullFilePath, $newLines);
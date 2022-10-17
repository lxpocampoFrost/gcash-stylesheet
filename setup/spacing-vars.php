<?php

$params = getopt("f:t:");
$fileName = "_{$params['f']}.scss";
$fullFilename = "sources/sass/page/components/{$fileName}";

if (array_key_exists("t", $params)) {
    if ($params["t"] == 'page') $fullFilename = "sources/sass/page/page-parts/page-template/{$fileName}";
    else {
        echo "Type does not exist\n";
        exit(); 
    }
}

echo $fullFilename;
echo "\n";

$varSpaces = [];
$newLines = [];
$cssContentLines = [];

$tokenVarsPath = 'sources/sass/page/common/globals/_tokens.scss';
$tokenVars = file_get_contents($tokenVarsPath);
$tokenVarsLines = explode("\n", $tokenVars);

// array of space attributes
$spaceAttr = array(
    'margin' => '',
    'margin-top' => '',
    'margin-bottom' => '',
    'margin-left' => '',
    'margin-right' => '',
    'padding' => '',
    'padding-top' => '',
    'padding-bottom' => '',
    'padding-left' => '',
    'padding-right' => '',
);

// ===================START CREATE SPACE HASH TABLE=============

$isSpace = false;

foreach ($tokenVarsLines as $tokenVarsLine) {
    if (is_int(strpos($tokenVarsLine, 'SPACE'))) {
        $isSpace = true;
        continue;
    }

    if ($isSpace) {
        $values = explode(":", $tokenVarsLine);

        if (count($values) > 1) {
            $var = $values[0];
            $value = trim(str_replace(";", "", $values[1]));

            $varSpaces[$value] = $var;

            continue;
        }

        if (trim($tokenVarsLine) == "") {
            break;
        }

        continue;
    }
}

// ===================END CREATE SPACE HASH TABLE=============

if (!file_exists($fullFilename)) {
    echo "File not found\n";
} else {
    echo "Scanning file {$fileName}...\n";
    processCssFile();
}

function processCssFile()
{
    global $cssContentLines, $fullFilename, $spaceAttr, $varSpaces;

    $cssFile = file_get_contents($fullFilename);
    $lines = explode("\n", $cssFile);
    $newLines = [];

    if (count($lines) < 2) {
        echo "File is empty!\n";
        return false;
    }

    foreach ($lines as $line) {
        $values = explode(":", $line);

        if (count($values) > 1 && !is_int(strpos($line, ' {'))) {
            $origAttr = $values[0];
            $origVal = $values[1];

            if (strpos($origAttr, 'background') > 0) {
                $newLines[] = $line;
                continue;
            }

            $attr = trim($origAttr);
            $value = trim($origVal);

            if (array_key_exists($attr, $spaceAttr)) {
                $pxValues = explode(" ", $value);
                $newValue = "";
        
                foreach ($pxValues as $val) {
                    $val = str_replace(";", "", $val);
        
                    if (array_key_exists($val, $varSpaces)) {
                        $newValue .= " " . $varSpaces[$val];
                    } else {
                        $newValue .= " " . $val;
                    }
                }

                $origVal = " " . trim($newValue) . ";";
            }

            $newLines[] = "{$origAttr}:{$origVal}";
            continue;
        }

        $newLines[] = $line;
    }

    // implode the variable and place the "\n" delimiter
    $cssContentLines = implode("\n", $newLines);

    // put the processed contents into the file
    file_put_contents($fullFilename, $cssContentLines);

    echo "Processing done!\n";
}

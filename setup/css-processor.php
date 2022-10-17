<?php

$params = getopt("t:c:s:");

$type = "";
$componentName = "";
$scss = "";

if (array_key_exists("t", $params)) {
    $type = $params["t"];
} else {
    echo "Type(-t) parameter is not indicated!\n";
    exit();
}

if (array_key_exists("c", $params)) {
    $componentName = $params["c"];
} else {
    echo "Component name(-c) parameter is not indicated!\n";
    exit();
}

if (array_key_exists("s", $params)) {
    $scss = $params["s"];
}

if ($type <> "elements") {
    $type .= "-components";
}

if ($scss == "") {
    $scss = $componentName;
}

$htmlFullFilePath = "templates/components/{$type}/{$componentName}.tpl";
$cssFullFilePath = "sources/sass/page/components/_{$scss}.scss";

$classHierarchy = [];
$shapeClasses = [];
$docColors = [];
$docFonts = [];
$varSpaces = [];
$newLines = [];
$cssContentLines = [];

$cssDoc = 'http://aux.frostdesigngroup.com/css-documentation/design-system.css';
$cssDoc = file_get_contents($cssDoc);
$cssDocLines = explode("\n", $cssDoc);

// array of the css blocks to be deleted
$deleteBlock = array(
    '@font-face {' => "",
    '* {' => "",
    'a {' => "",
    '.valign-text-middle {' => ""
);

// array of the css blocks to be deleted
$deleteWildcardBlock = array(
    '.separator' => "",
);

// array of attributes to be deleted
$deleteAttr = array(
    'white-space' => 'nowrap;',
    'height' => '96px;',
    'min-height' => '25px;',
    'letter-spacing' => '0.00px;',
    'line-height' => '15.2px;',
    'justify-content' => 'flex-end',
    'min-width' => '',
    'max-width' => '',
    'font-style' => '',
    'mix-blend-mode' => '',
    'overflow' => '',
);

// array of values to be deleted
$deleteValue = array(
    'absolute;' => "",
    '0;' => "",
    '0px;' => ""
);

// array of words to be deleted
$deleteWord = array(
    '@import' => "",
);

// array of attributes to be updated
$updateAttr = array(
    'background-color' => 'background',
);

// array of values to be updated
$updateValue = array(
    'width' => '100%;',
    'align-items' => 'center;',
);

// ===================START CREATE COLOR AND FONT HASH TABLE=============
foreach ($cssDocLines as $cssDocLine) {
    // if the variable has "--color" it means it is a color variable
    if (strpos($cssDocLine, '--color') == 4) {
        $line = explode(":", $cssDocLine);
        $attr = trim($line[0]);
        $val = trim($line[1]);
        $hexVal = preg_replace("/[^a-zA-Z0-9]/", "", $val);

        $split = str_split($hexVal, 2);
        $r = hexdec($split[0]);
        $g = hexdec($split[1]);
        $b = hexdec($split[2]);

        // for rgba value set the variable
        $docColors["rgba({$r}, {$g}, {$b}, 1)"] = $attr;

        // for hex color value set the variable
        $docColors[$hexVal] = $attr;
    }

    // if the variable has "--type" it means it is a font variable
    if (strpos($cssDocLine, '--type') == 4) {
        $line = explode(":", $cssDocLine);
        $attr = trim($line[0]);
        $val = explode(" ", trim($line[1]));
        $fontWeight = $val[0];
        $fontSizeLineHeight = explode("/", $val[1]);
        $fontSize = $fontSizeLineHeight[0];
        $fontFamily = preg_replace("/[^a-zA-Z0-9-]/", "", $val[count($val) - 1]);

        $docFonts["{$fontWeight} {$fontSize} {$fontFamily}"] = $attr;
    }
}

// ===================END CREATE COLOR AND FONT HASH TABLE=============

// ===================START CREATE MODIFIERS HASH TABLE=============

function getModifiers()
{
    global $htmlFullFilePath, $classHierarchy, $shapeClasses;

    $htmlContent = file_get_contents($htmlFullFilePath);

    $dom = new DOMDocument();
    $dom->loadHTML($htmlContent, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

    $tags = $dom->getElementsByTagName('*');
    $counter = 0;

    foreach ($tags as $tag) {
        $counter++;

        if ($tag->tagName == "script") {
            $tag->parentNode->removeChild($tag);
            continue;
        }

        if ($tag->tagName == "img") {
            if (is_int(strpos($tag->getAttribute('class'), "shape"))) {
                $shapeClass = $tag->getAttribute('class');
                $shapeSrc = $tag->getAttribute('src');

                $shapeClasses[$shapeClass] = $shapeSrc;

                $span = $dom->createElement("span");
                $span->setAttribute("class", $shapeClass);

                $tag->parentNode->replaceChild($span, $tag);
            }
        }

        if ($tag->getAttribute('class') <> "") {
            $classes = explode(" ", $tag->getAttribute('class'));

            if (count($classes) > 1) {
                $counter = 0;
                $parent = "";

                foreach ($classes as $class) {
                    $counter++;

                    if ($counter == 1) {
                        $parent = $class;
                        continue;
                    }

                    $classHierarchy[$class][] = $parent;
                }

                $tag->setAttribute('class', $parent);
            }
        }
    }

    $newHtml = $dom->saveHTML();

    file_put_contents($htmlFullFilePath, $newHtml);

    echo "Processing tpl done!\n";
}

// ===================END CREATE MODIFIERS HASH TABLE=============

if (!file_exists($htmlFullFilePath)) {
    echo 'File not found';
} else {
    echo "Processing tpl file...\n";
    getModifiers();
}

if (!file_exists($cssFullFilePath)) {
    echo 'File not found';
} else {
    echo "Processing scss file...\n";
    $variables = setupCssFile();
    if (is_array($variables)) processCssFile();
}

function processCssFile()
{
    global $variables, $newLines, $cssContentLines, $cssFullFilePath;

    // processFontClasses();
    
    foreach ($newLines as $class => $attributes) {
        $attributes = processFontClasses($class, $attributes);
        updateShapeClass($class);

        foreach ($attributes as $attr => $value) {

            if (deleteLine($class, $attr) || deleteLine($class, $value)) {
                unset($newLines[$class][$attr]);
                continue;
            }

            updateColorVariables($class, $attr, $value);
            updateLine($class, $attr, $value);

        }
    }

    removeModifiers();
    createCssArray();

    // implode the variable and place the "\n" delimiter
    $cssContentLines = implode("\n", $cssContentLines);

    // put the processed contents into the file
    file_put_contents($cssFullFilePath, $cssContentLines);

    echo "Processing scss done!\n";
}

function createCssArray()
{
    global $cssContentLines, $newLines;

    foreach ($newLines as $class => $attributes) {
        $cssContentLines[] = $class;

        foreach ($attributes as $attr => $value) {
            if ($attr != "}") {
                $cssContentLines[] = "    {$attr}: {$value}";
            }
        }

        $cssContentLines[] = "}";
    }
}

function updateShapeClass($class)
{
    global $newLines, $shapeClasses;

    $className = str_replace(".", "", $class);
    $className = str_replace(" {", "", $className);

    if (array_key_exists($className, $shapeClasses)) {
        $newLines[$class]['background-image'] = "url(" . $shapeClasses[$className] . ");";
    }
}

function removeModifiers()
{
    global $newLines, $classHierarchy;

    foreach ($newLines as $class => $attributes) {
        $className = str_replace(".", "", $class);
        $className = trim(str_replace("{", "", $className));

        if (array_key_exists($className, $classHierarchy)) {
            foreach ($classHierarchy[$className] as $parent) {
                $parent = "." . $parent . " {";

                $newLines[$parent] = array_merge($newLines[$parent], $newLines[$class]);
            }

        }
    }

    foreach ($classHierarchy as $class => $attributes) {
        unset($newLines[".". $class . " {"]);
    }
}

function processFontClasses($class, $attributes)
{
    global $variables, $docFonts, $newLines;

    $localFontSizes = $variables['localFontSizes'];
    $localFontFamilies = $variables['localFontFamilies'];

    $attrArray = [];
    $fontWeight = "";
    $fontSize = "";
    $fontFamily = "";
    $fontFamilyOrig = "";

    if (array_key_exists("font-weight", $attributes)) {
        // remove all characters except numbers
        $fontWeight = preg_replace("/[^0-9]/", "", $attributes['font-weight']);
    }

    if (array_key_exists("font-size", $attributes)) {
        if (is_int(strpos($attributes['font-size'], "var("))) {
            // remove other characters except the variable
            $fontAttrFontSize = str_replace("var(", "", $attributes['font-size']);
            $fontAttrFontSize = str_replace(");", "", $fontAttrFontSize);
            // get the value of the font size
            $fontSize = $localFontSizes[$fontAttrFontSize];
        } else {
            if (is_int(strpos($attributes['font-size'], "px"))) {
                $pxVal = preg_replace("/[^0-9]/", "", $attributes['font-size']);
                $fontSize = ((int)$pxVal / 16) . "rem";
            }

            if (is_int(strpos($attributes['font-size'], "rem"))) {
                $fontSize = str_replace(";", "", $attributes['font-size']);
            }
        }

        $newLines[$class]['font-size'] = "{$fontSize};";
        $attributes['font-size'] = "{$fontSize};";
    }

    if (array_key_exists("font-family", $attributes)) {
        if (is_int(strpos($attributes['font-family'], "var("))) {
            // remove other characters except the variable
            $fontAttrFontFamily = str_replace("var(", "", $attributes['font-family']);
            $fontAttrFontFamily = str_replace(");", "", $fontAttrFontFamily);
            // get the value of the font family
            $fontFamilyOrig = $localFontFamilies[$fontAttrFontFamily];
            // process the font family to match it with the font family in the CSS doc fonts variable
            $fontFamily = explode(',', $fontFamilyOrig);
            $fontFamily = preg_replace("/[^a-zA-Z0-9-]/", "", $fontFamily[0]);
        } else {
            $fontFamilyOrig = $attributes['font-family'];
            $fontFamily = explode(',', $fontFamilyOrig);
            $fontFamily = preg_replace("/[^a-zA-Z0-9-]/", "", $fontFamily[0]);
        }

        $newLines[$class]['font-family'] = "{$fontFamilyOrig};";
        $attributes['font-family'] = "{$fontFamilyOrig};";
    }

    // set the font key to be checked if it exists in the CSS doc
    $fontKey = "{$fontWeight} {$fontSize} {$fontFamily}";

    // if the font exists in the CSS doc replace it with the CSS doc variable
    if (array_key_exists($fontKey, $docFonts)) {
        $newLines[$class]["font"] = "var({$docFonts[($fontKey)]});";

        // unset the font attributes that is not needed
        unset($newLines[$class]['font-size']);
        unset($attributes['font-size']);
        unset($newLines[$class]['font-weight']);
        unset($attributes['font-weight']);
        unset($newLines[$class]['font-family']);
        unset($attributes['font-family']);
    }

    return $attributes;
}

function updateColorVariables($class, $attr, $value)
{
    global $variables, $newLines, $docColors;

    $localColors = $variables['localColors'];

    if (is_int(strpos($value, "var("))) {
        $var = explode('var(', $value);
        $firstPart = $var[0];
        $secondPart = str_replace(');', '', $var[1]);

        if (array_key_exists($secondPart, $localColors)) {
            $secondPart = $localColors[$secondPart];

            if (is_int(strpos($secondPart, "#")) || is_int(strpos($secondPart, "rgba"))) {
                // if the color is not existing in the CSS doc
                $newLines[$class][$attr] = "{$firstPart}{$secondPart}";
            } else {
                $newLines[$class][$attr] = "{$firstPart}var({$secondPart});";
            }

            return true;
        }
    }

    if (is_int(strpos($value, 'rgba'))) {
        $values = explode('rgba', $value);
        $firstPart = trim($values[0]);
        $secondPart = str_replace(';', '', $values[1]);

        $rgba = "rgba{$secondPart}";

        if (array_key_exists($rgba, $docColors)) {
            $var = $docColors[$rgba];
            $newLines[$class][$attr] = "{$firstPart} var({$var});";

            return true;
        }
    }

    if (is_int(strpos($value, '#'))) {
        $hexVal = preg_replace("/[^a-zA-Z0-9]/", "", $value);

        $values = explode('#', $value);
        $firstPart = trim($values[0]);
        $hexVal = preg_replace("/[^a-zA-Z0-9]/", "", $values[1]);

        if (array_key_exists($hexVal, $docColors)) {
            $var = $docColors[$hexVal];
            $newLines[$class][$attr] = "var({$var});";

            return true;
        }
    }

    return false;
}

function deleteLine($class, $toDelete) 
{

    global $deleteAttr, $deleteValue, $newLines;

    if ($toDelete == "min-width" || $toDelete == "max-width") {
        $newLines[$class]['width'] = "100%;";
    }

    // delete line if the attribute is existing in the deleteAttr array
    if (array_key_exists($toDelete, $deleteAttr)) {
        return true;
    }

    // delete line if the value is existing in the deleteValue array
    if (array_key_exists($toDelete, $deleteValue)) {
        return true;
    }

    return false;

}

function updateLine($class, $attr, $value) 
{

    global $updateAttr, $updateValue, $newLines;

    // if the attr is existing in the updateAttr array
    if (array_key_exists($attr, $updateAttr)) {
        $newAttr = $updateAttr[$attr];
        $value = $newLines[$class][$attr];

        $newLines[$class][$newAttr] = $value;

        unset($newLines[$class][$attr]);

        return true;
    }

    // if the value is existing in the updateValue array
    if (array_key_exists($attr, $updateValue)) {
        $newValue = $updateValue[$attr];

        $newLines[$class][$attr] = $newValue;

        return true;
    }

    return false;

}

function setupCssFile()
{
    global $docColors, $docFonts, $deleteBlock, $deleteWord, $deleteWildcardBlock, $newLines, $cssFullFilePath;

    $cssFile = file_get_contents($cssFullFilePath);
    $lines = explode("\n", $cssFile);

    if (count($lines) < 2) {
        echo "File is empty!\n";
        return false;
    }

    $isRoot = false;
    $isFont = false;
    $isBlock = false;
    $isDeleteBlock = false;
    $isDeleteWildcardBlock = false;

    $localColors = [];
    $localFontSizes = [];
    $localFontFamilies = [];
    $localFontClasses = [];

    $class = "";

    foreach ($lines as $line) {
        $line = trim($line);
        $values = explode(": ", $line);

        // if the line has a "root" word
        // set root mode to true
        if (is_int(strpos($line, "root"))) {
            $isRoot = true;
            continue;
        }

        // if root mode is true
        if ($isRoot) {
            if (count($values) > 1) {
                $attr = trim($values[0]);
                $val = trim($values[1]);

                // if the value has "#" it means its a hex color
                if (is_int(strpos($val, "#"))) {
                    // remove all characters except letters and numbers
                    $hexVal = preg_replace("/[^a-zA-Z0-9]/", "", $val);

                    // check if hex color exists in the CSS doc
                    // set the CSS doc variable to the local color variable
                    if (array_key_exists($hexVal, $docColors)) {
                        $localColors[$attr] = $docColors[$hexVal];
                        continue;
                    }

                    // if the color does not exist in the CSS doc
                    // set the hex color to the local color variable
                    $localColors[$attr] = $val;
                    continue;
                }

                if (is_int(strpos($val, 'rgba'))) {
                    $value = explode('rgba', $line);
                    $firstPart = trim($value[0]);
                    $secondPart = str_replace(';', '', $value[1]);
            
                    $rgba = "rgba{$secondPart}";
            
                    if (array_key_exists($rgba, $docColors)) {
                        $localColors[$attr] = $docColors[$rgba];
                        continue;
                    }

                    $localColors[$attr] = $val;
                    continue;
                }

                // if the variable has "--font-size" means its a font size
                if (is_int(strpos($attr, "--font-size"))) {
                    // remove all charaacters except numbers
                    if (is_int(strpos($val, "px"))) {
                        $pxVal = preg_replace("/[^0-9]/", "", $val);
                        // convert px value to rem value
                        $remVal = ((int)$pxVal / 16) . "rem";
                    }
        
                    if (is_int(strpos($val, "rem"))) {
                        $remVal = str_replace(";", "", $val);
                    }

                    // set the rem value to the local font size variable
                    $localFontSizes[$attr] = $remVal;
                    continue;
                }

                // if the variable has "--font-family" means its a font family
                if (is_int(strpos($attr, "--font-family"))) {
                    // remove the ; in the value
                    $fontFamily = str_replace(";", "", $val);

                    // set the value to the locak font family variable
                    $localFontFamilies[$attr] = $fontFamily;
                    continue;
                }
            }

            // if the line is a closing curly brace set root mode to false
            if ($line == "}") {
                $isRoot = false;
                continue;
            }

            continue;
        }

        // if the start of the block exists in the deleteBlock arrat
        // set delete block mode to true
        if (array_key_exists($line, $deleteBlock)) {    
            $isDeleteBlock = true;
            continue;
        }

        // if in delete block mode it will not add the line in file
        if ($isDeleteBlock) {
            // if line is a closing curly brace set delete block mode to false
            if ($line == "}") {
                $isDeleteBlock = false;
            }

            continue;
        }

        // if the start of the block exists in the deleteWildcardBlock arrat
        // set delete block mode to true
        if (is_int(strpos($line, " {"))) {
            foreach ($deleteWildcardBlock as $wildcard => $wildcardVal) {
                if (is_int(strpos($line, $wildcard))) {
                    $isDeleteWildcardBlock = true;
                    continue 2;
                }
            }
        }

        // if in delete block mode it will not add the line in file
        if ($isDeleteWildcardBlock) {
            // if line is a closing curly brace set delete block mode to false
            if ($line == "}") {
                $isDeleteWildcardBlock = false;
            }

            continue;
        }

        // delete line if the word is existing in the deleteWord array
        $lineExplode = explode(" ", $line);
        if (array_key_exists($lineExplode[0], $deleteWord)) {
            continue;
        }

        if (is_int(strpos($line, " {"))) {
            $class = $line;
            $newLines[$class] = [];

            $isBlock = true;

            continue;
        }

        if ($isBlock) {
            if ($line == "}") {
                $isBlock = false;
                $newLines[$class][$line] = "";

                continue;
            }

            if (count($values) > 1) {
                $attr = trim($values[0]);
                $val = trim($values[1]);

                $newLines[$class][$attr] = $val;
                continue;
            }
        }
    }

    return array(
        "localColors" => $localColors,
        "localFontSizes" => $localFontSizes,
        "localFontFamilies" => $localFontFamilies
    );
}
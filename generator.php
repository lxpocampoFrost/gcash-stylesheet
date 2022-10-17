<?php

$templates = [];
// getTemplates('/generator/', $templates);

$it = new RecursiveTreeIterator(
    new RecursiveDirectoryIterator(
        __DIR__."/generator/", 
        RecursiveDirectoryIterator::SKIP_DOTS
    )
);

// get email content from csv and convert to array
$contentCsv = file_get_contents("https://docs.google.com/spreadsheets/d/e/2PACX-1vS9sdfbl1K0CMNgiCFUKhtPdCgwVyBnX4cEPFk4ZwjLnWn8SICDMVQCKauXPaYBmqW0qa_p82r6iu6r/pub?output=csv");
$contentCsvToArray = array_map("str_getcsv", explode("\n", $contentCsv));
$contentArray = [];

foreach ($contentCsvToArray as $key => $value) {

    $var = "";

    foreach ($value as $key1 => $value1) {

        if ($key == 0) {

            if ($key1 == 0) continue;

            $contentArray[$value1] = [];
        }

        if ($key > 0) {

            if ($key1 == 0) {
                $var = $value1;
                continue;
            }

            $value1 = str_replace("\n", " ", $value1);
            $value1 = str_replace("\r", " ", $value1);

            $contentArray[$contentCsvToArray[0][$key1]][$var] = $value1;
        }
    }
}

// initialize the templates
foreach($it as $path) {
    if (preg_match("/generator\/(_\/)*(.*.tpl)/i", $path, $match)) {
        preg_match("/\-\/(.*)/", $path, $pathMatch);

        $filePath = $pathMatch[1];
        $template = $match[2];
        $name     = preg_replace("/\//", "_", $template);
        $content  = file_get_contents("/$filePath");

        preg_match("/(.+).tpl/", $name, $nameMatch);

        $id       = $nameMatch[1];
        $templates[$id] = $content;
    }
}

// update variables in design-system.html
$designSystemFile = "design-system.html";
$designSystemHtml = file_get_contents($designSystemFile);

if (preg_match_all("/\[@(.+?)\]/", $designSystemHtml, $matches)) {

    $designSystemHtml = findTemplateVars($designSystemHtml, $matches);

    file_put_contents($designSystemFile, $designSystemHtml);
}

// $designSystemGKFile = "design-system-gk.html";
// $designSystemGKHtml = file_get_contents($designSystemGKFile);

// if (preg_match_all("/\[@(.+?)\]/", $designSystemGKHtml, $matches)) {

//     $designSystemGKHtml = findTemplateVars($designSystemGKHtml, $matches);

//     file_put_contents($designSystemGKFile, $designSystemGKHtml);
// }

function findTemplateVars($html, $matches)
{
    $html = replaceTemplateVars($html, $matches);

    return $html;
}

// get and replace tpl variables
function replaceTemplateVars($html, $matches)
{
    global $templates;

    foreach ($matches[1] as $key => $value) {
        $tplVar = $matches[0][$key];
        $variable = $value;
        $varExplode = explode('_', $variable);
        $component = $varExplode[0];
        $tplHtml = $templates["_{$component}"];

        $tplHtml = replaceVarsFromCSV($variable, $tplHtml);
        $tplHtml = replaceItems($variable, $tplHtml);

        $html = str_replace($tplVar, $tplHtml, $html);
    }

    return $html;
}

// get and replace variables with content from CSV
function replaceVarsFromCSV($component, $html)
{
    global $contentArray, $templates;

    if (preg_match_all("/\{@(.+?)\}/", $html, $tplMatches)) {
        foreach ($tplMatches[1] as $key => $value) {
            $variable = $tplMatches[0][$key];
            $itemsHtml = $templates["_{$value}"];

            $html = str_replace($variable, $itemsHtml, $html);
        }
    }

    if (preg_match_all("/\[(.+?)\]/", $html, $matches)) {
        foreach ($matches[1] as $key => $value) {
            $variable = $matches[0][$key];
            $contentVar = $value;
            $content = $contentArray[$component][$contentVar];

            $html = str_replace($variable, $content, $html);
        }

    }

    return $html;
}

// get tpl of item and iterate through depending on the number of items from CSV per variable
function replaceItems($component, $html)
{
    global $contentArray, $templates;

    if (preg_match_all("/\{#(.+?)\}/", $html, $tplMatches)) {

        foreach ($tplMatches[1] as $key => $value) {
            $variable = $tplMatches[0][$key];
            $itemsHtml = $templates["_{$value}"];
            $listItemsHtml = '';

            if (preg_match_all("/\[(.+?)\]/", $itemsHtml, $matches)) {
                $listItems = [];
                foreach ($matches[1] as $key => $value) {
                    $items = explode('|', $contentArray[$component][$value]);
                    
                    for ($i=0; $i < count($items); $i++) { 
                        $listItems[$i][$value] = $items[$i];
                    }
                }
                
                foreach ($listItems as $listItem => $values) {
                    $listItemHtml = $itemsHtml;
                    foreach ($values as $key => $value) {
                        $listItemHtml = str_replace("[{$key}]", $value, $listItemHtml);
                    }

                    $listItemsHtml .= $listItemHtml;
                }
            }

            $html = str_replace($variable, $listItemsHtml, $html);
        }

    }

    return $html;
}

echo "Generating Templates:\n\n";

$templateCount = 0;
foreach ($templates as $id => $html) {

    // Ignore includes
    if (!preg_match("/^_/", $id)) {
        $templateCount++;

        // Get file name
        $parts = explode("_", $id);
        $file  = end($parts) . ".html";

        // Interpolate until all the variables have been interpolated
        while (preg_match_all("/{@(.+)}/", $html)) {
            $html = interpolate($html, $templates);
        }

        // Find title tag
        $title = "";
        if (preg_match_all("/{title=>(.+)}/", $html, $matches)) {
            $wholeTag = $matches[0][0];
            $title = $matches[1][0];

            $html = str_replace($wholeTag, "", $html);
        }

        // Find classes to be replaced
        $classes = [];
        while (preg_match_all("/{class=>(.+)}/", $html, $matches)) {
            $wholeTag = $matches[0][0];
            $contents = explode("=>", $matches[1][0]);
            $classes[$contents[0]] = $contents[1];

            $html = str_replace($wholeTag, "", $html);
        }

        // Find and replace variables from CSV
        if (preg_match_all("/\[@(.+?)\]/", $html, $matches)) {

            $html = replaceTemplateVars($html, $matches);

        }

        $templates["_content"] = $html;

        // inject the compiled into master
        $masterTemplate = $templates['_master'];
        $compiledHtml = interpolate($masterTemplate, $templates);

        // update title tag if title is indicated in tpl
        if($title <> "") $compiledHtml = updateTitleTag($compiledHtml, $title);

        if(count($classes) > 0) $compiledHtml = updateClasses($compiledHtml, $classes);

        // write it to file

        array_pop($parts);
        $dir      = implode("/", $parts);
        $fullPath = __DIR__ . "/page-templates/{$dir}/";

        if (!file_exists($fullPath)) {
            mkdir($fullPath, 0760, true);
        }

        echo " • $dir/$file/\n";
        
        file_put_contents($fullPath . $file, $compiledHtml);   
    }
}

function updateTitleTag($compiledHtml, $title)
{
    $dom = new DOMDocument(); 
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput       = true;
    @$dom->loadHTML($compiledHtml); 

    $titleTag = $dom->getElementsByTagName("title"); 
    $titleTag[0]->textContent = $title;

    return $compiledHtml = $dom->saveHTML();
}

function updateClasses($compiledHtml, $classes)
{
    $dom = new DOMDocument(); 
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput       = true;
    @$dom->loadHTML($compiledHtml); 

    foreach ($classes as $oldClass => $newClass) {
        $element = $dom->getElementById($oldClass);
        $element->setAttribute("class", $newClass);
    }

    return $compiledHtml = $dom->saveHTML();
}

echo "
—————————————————————————————————
Total templates generated » {$templateCount}\n";

function interpolate($html, $templates)
{
    $replacements = [];
    preg_match_all("/{@(.+)}/", $html, $templateVariables);

    foreach ($templateVariables[1] as $templateVariable) {
        $replacements[] = $templates["_".$templateVariable];
    }

    // format the variables for replacement
    $variables = array_map(
        function ($value) {
            return "/\{@$value\}/";
        }, 
        $templateVariables[1]
    );

    return preg_replace($variables, $replacements, $html);
}
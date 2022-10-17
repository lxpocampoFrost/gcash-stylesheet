#! /bin/sh

folder=$1
component=$2

if [ -z "$folder" ]
then
    folder="high-level-components"
fi

cd templates/components/$folder

if [ -z "$component" ]
then
    for file in *; do 
        if [ -f "$file" ]; then 
            echo "Copying $file..." 
            cp "$file" ../../../generator/_/_"$file"
        fi 
    done
elif [ ! -z "$folder" -a ! -z "$component" ]
then
    echo "Copying $component.tpl" 
    cp "$component.tpl" ../../../generator/_/_"$component.tpl"
fi
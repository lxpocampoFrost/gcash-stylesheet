#! /bin/sh

chmod 777 templates/components
chmod 777 templates/page-parts/high-level-components.tpl
chmod 777 templates/page-parts/low-level-components.tpl

lc=$1
c=$2

if [ $lc = "high-level" ]
then
    tpl="templates/components/$lc-components/$c.tpl"
elif [ $lc = "low-level" ]
then
    tpl="templates/components/$lc-components/$c.tpl"
elif [ $lc = "elements" ]
then
    tpl="templates/components/$lc/$c.tpl"
else
    echo "Folder not found!"
fi

echo "" >> $tpl
echo "Created $c.tpl"
php setup/edit-tpl.php -l$lc -c$c

if [ $lc != "elements" ]
then
    node beebop.js create-component $c
fi
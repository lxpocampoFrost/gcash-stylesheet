<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Globe Online: Design System</title>
    <meta name="viewport" content="width=device-width, initial-scale=1", user-scalable=no">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify-css.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.7.5/beautify-html.js"></script>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" href="assets/css/component-guide.css" />
    <link rel="stylesheet" href="assets/css/design-system.css" />
     <!-- Add the slick-theme.css if you want default styling -->
    <link rel="stylesheet" type="text/css" href="//cdn.jsdelivr.net/gh/kenwheeler/slick@1.8.1/slick/slick.css"/>
    <!-- Add the slick-theme.css if you want default styling -->
    <link rel="stylesheet" type="text/css" href="//cdn.jsdelivr.net/gh/kenwheeler/slick@1.8.1/slick/slick-theme.css"/>
</head>

<body>

    <div class="display-panels">
        {$control-bar}

        <div class="preview-pane -hide-code">
            <div class="section-block element-group --show-code -reference -component" 
                data-name="Elements">
                {$elements}
            </div>

            <div class="section-block element-group --show-code -reference -component" 
                data-name="Low Level Components">
                {$low-level-components}
            </div>

            <div class="section-block element-group --show-code -reference -component" 
                data-name="High Level Components">
                {$high-level-components}
            </div>

            <div class="section-block element-group --show-code -reference -component" 
                data-name="Landing Page Components">
                {$landing-components}
            </div>

            <div class="section-block element-group --show-code -reference -component" 
                data-name="Get Started Page Components">
                {$get-started-components}
            </div>
        </div>
        
        <div class="index-group">
        </div>
    </div>

    <script src="assets/js/ds.js"></script>
    <script src="assets/js/app.js"></script>

</body>

</html>
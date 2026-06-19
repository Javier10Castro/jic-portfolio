function injectAssets(pageHtml, pageContent, designStrategy) {
  var html = pageHtml;

  var seo = pageContent.seo || {};

  var scripts = '  <script>\n';
  scripts += '    (function(){\n';
  scripts += '      "use strict";\n';
  scripts += '      document.addEventListener("DOMContentLoaded",function(){\n';
  scripts += '        var links=document.querySelectorAll(\'a[href^="#"]\');\n';
  scripts += '        for(var i=0;i<links.length;i++){\n';
  scripts += '          links[i].addEventListener("click",function(e){\n';
  scripts += '            e.preventDefault();\n';
  scripts += '            var target=document.querySelector(this.getAttribute("href"));\n';
  scripts += '            if(target) target.scrollIntoView({behavior:"smooth",block:"start"});\n';
  scripts += '          });\n';
  scripts += '        }\n';
  scripts += '      });\n';
  scripts += '    })();\n';
  scripts += '  </script>\n';

  html = html.replace('</body>', scripts + '</body>');

  return html;
}

function generateScriptFile() {
  var js = '(function(){\n';
  js += '  "use strict";\n';
  js += '  document.addEventListener("DOMContentLoaded",function(){\n';
  js += '    var links=document.querySelectorAll(\'a[href^="#"]\');\n';
  js += '    for(var i=0;i<links.length;i++){\n';
  js += '      links[i].addEventListener("click",function(e){\n';
  js += '        e.preventDefault();\n';
  js += '        var target=document.querySelector(this.getAttribute("href"));\n';
  js += '        if(target) target.scrollIntoView({behavior:"smooth",block:"start"});\n';
  js += '      });\n';
  js += '    }\n';
  js += '  });\n';
  js += '})();\n';
  return js;
}

module.exports = { injectAssets, generateScriptFile };

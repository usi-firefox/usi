(() => {
    "use strict";
    /* global browser */
    
    let ele = document.querySelectorAll("a");
    if (ele.length <= 0) {
        return;
    }

    ele.forEach((element) => {
        let lang_key = element.getAttribute("data-i18n");
        if (lang_key) {
            element.innerHTML = browser.i18n.getMessage(lang_key);
        }
    });

})(); 
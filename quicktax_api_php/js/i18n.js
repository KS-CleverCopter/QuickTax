var storedLanguageData;

function updateLang(passedLanguageData) {
    // var langData = passedLanguageData || storedLanguageData;
    // //console.log(langData);

    // var allElements = document.querySelectorAll("[data-translate]");
    // for (let x = 0; x < allElements.length; x++) {
    //     const elm = allElements[x];
    //     var translatedVal = langData[elm.getAttribute("data-translate")];
    //     if (translatedVal) {
    //         if (elm.hasAttribute("placeHolder")) {
    //             elm.setAttribute("placeholder", translatedVal);
    //         } else {
    //             elm.innerHTML = translatedVal;
    //         }
    //     }
    // }
}

function setLang(key) {
    if (key == "fr") {
        langURL = "i18n/fr.json";
        $(".language-selector").each(function() {
            $(this).html('English');
        });
    } else {
        langURL = "i18n/en.json";
        $(".language-selector").each(function() {
            $(this).html('Français');
        });

    }
    $.getJSON(langURL, (resp) => {
        storedLanguageData = resp;
        updateLang(storedLanguageData);
    });
}

function getTranslatedValue(key) {
    //console.log(key);
    return storedLanguageData[key] || "Undefined";
}

// $(document).ready(() => {

//     var currentLang = navigator.language;
//     console.log("currentLang");
//     // French as default

//     if (currentLang.indexOf("en") >= 0) {
//         // English
//         langURL = "i18n/en.json";
//         $(".language-selector").each(function() {
//             $(this).html('Français');
//         });
//     } else if (currentLang.indexOf("fr") >= 0) {
//         langURL = "i18n/en.json";
//         $(".language-selector").each(function() {
//             $(this).html('English');
//         });
//     }
//     $.getJSON(langURL, (resp) => {
//         storedLanguageData = resp;
//         updateLang(storedLanguageData);
//     });

// })
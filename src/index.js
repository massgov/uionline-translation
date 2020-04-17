/**
 * Public URL directory that includes translations to be used.
 * Temp use of gist while repo is private.
 */
const dictionaryDirectory = 'https://cdn.jsdelivr.net/gh/massgov/uionline-translation@latest/dist/dictionaries/';

/**
 * These will match the dictionaries avilable to translate from
 */
const availableLanguages = new Map([
    ['en', 'English'],
    ['es', 'Spanish'],
    ['pt', 'Portuguese'],
    ['zh-CN', 'Chinese'],
    ['ht', 'Haitian Creole'],
    ['vi', 'Vietnamese']
]);

/**
 * Defaults to English, but will be set based on URL param or cookie
 */
let currentLangValue = 'en';

/**
 * UI-Online is already using jQuery
 */
jQuery(function () {
    /**
     * Need to change the charset to show accent marks and other language related symbols
     */
    jQuery("meta[http-equiv='Content-Type']").attr("content", "text/html; charset=UTF-8");
    jQuery("head").append('<meta charset="UTF-8">');

    /**
     * Adding a language picker to the top right underneath "Print Preview" which is the
     * same on all the pages and looks pretty clean.
     */
    let languageHtml = '<div style="margin-top: 3px;"><label for="cars" style="padding-right: 3px;">Language:</label><select id="language-picker">';
    availableLanguages.forEach((value, key) => {
        languageHtml += `<option value="${key}">${value}</option>`;
    });
    languageHtml += '</select></div>';
    jQuery('a[onclick^="javascript:getPrint(\'print_area\')"').first().after(languageHtml);

    /**
     * Always translate immediately if we change the language picker from English. If we are changing to
     * English, or to another language from a non english language, we need to reload the page to go back
     * to English, and then do the translate. NOT going to do N to M language mapping.
     */
    let currentLangValue = jQuery('#language-picker').val();
    jQuery('#language-picker').change(function () {
        var lang = jQuery(this).val();
        createCookie('lang', lang);
        console.log('Language changed to:', lang);

        if (currentLangValue != 'en') {
            console.log('Current language is not English, so reloading:', currentLangValue);
            location.reload();
        } else {
            currentLangValue = lang;
            handleButtons(lang);
            translatePage(lang);
        }
    });

    /**
     * ON PAGE LOAD, Check if we have a 'lang' URL param, which will take precedence over using a cookie.
     * The idea to this is to allow a direct link to a language from wherever.
     */
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const urlLang = urlParams.get('lang');
    const cookiedLang = readCookie('lang');
    if (urlLang && availableLanguages.has(urlLang) && urlLang != 'en') {
        console.log('URL param detected so translating to:', urlLang);
        createCookie('lang', urlLang);

        currentLangValue = urlLang;
        jQuery('#language-picker').val(urlLang);
        urlParams.delete('lang')
        history.replaceState && history.replaceState(
            null, '', location.pathname + location.search.replace(/[\?&]lang=[^&]+/, '').replace(/^&/, '?') + location.hash
        );
        translatePage(urlLang);
    } else if (cookiedLang && cookiedLang != 'en') {
        console.log('Cookie detected so translating to:', cookiedLang);

        currentLangValue = cookiedLang;
        jQuery('#language-picker').val(cookiedLang);
        translatePage(cookiedLang);
    }

    handleButtons(currentLangValue);
});

/**
 * Buttons are input[type=image] and use a src attribute that has a HEX value for the text and color
 * Used https://www.online-toolz.com/tools/text-hex-convertor.php to get HEX
 *
 * Next = /Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=4E657874
 * - Spanish = Siguiente = 5369677569656e7465
 * - Portuguese = Avançar = 4176616ec3a76172
 * - Chinese = 下一个 = e4b88be4b880e4b8aa
 * - Haitian = Next = 4E657874
 * - Vietnamese = Kế tiếp = 4be1babf207469e1babf70
 * Previous = /Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=50726576696F7573
 * - Spanish = Atrás = 417472c3a173
 * - Portuguese = Voltar = 566f6c746172
 * - Chinese = 背部 = e8838ce983a8
 * - Haitian = Retounen = 5265746f756e656e
 * - Vietnamese = Trở lại = 5472e1bb9f206ce1baa169
 * Start The Unemployment Benefits Application /Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=53746172742074686520556E656D706C6F796D656E742042656E6566697473204170706C69636174696F6E
 * - Spanish = Inicie la solicitud de beneficios de desempleo = 496e69636965206c6120736f6c6963697475642064652062656e65666963696f7320646520646573656d706c656f
 * - Portuguese = Iniciar o aplicativo de benefícios de desemprego = 496e6963696172206f2061706c6963617469766f2064652062656e6566c3ad63696f7320646520646573656d707265676f
 * - Chinese = 启动失业救济金申请 = e590afe58aa8e5a4b1e4b89ae69591e6b58ee98791e794b3e8afb7
 * - Haitian = Kòmanse Aplikasyon pou Benefis Chomaj = 4bc3b26d616e73652041706c696b6173796f6e20706f752042656e656669732043686f6d616a
 * - Vietnamese = Bắt đầu Đơn xin trợ cấp thất nghiệp = 42e1baaf7420c491e1baa77520c490c6a16e2078696e207472e1bba32063e1baa570207468e1baa574206e676869e1bb8770
 * TemplateName=42544E4F564552 is used on hover to make the text yellow
 *
 * BUT, the existing application doesn't handle the correct encoding returned from the hex of foreign chars/symbols. So we are going to use
 * images for just Spanish/Portuguese for now.
 */
function handleButtonsHex(lang) {
    if (lang != 'en') {
        let nextHex, prevHex, startHex;
        switch (lang) {
            case 'es':
                nextHex = '5369677569656e7465';
                prevHex = '417472c3a173';
                startHex = '496e69636965206c6120736f6c6963697475642064652062656e65666963696f7320646520646573656d706c656f';
                break;
            case 'pt':
                nextHex = '4176616ec3a76172';
                prevHex = '566f6c746172';
                startHex = '496e6963696172206f2061706c6963617469766f2064652062656e6566c3ad63696f7320646520646573656d707265676f';
                break;
            case 'zh-CN':
                nextHex = 'e4b88be4b880e4b8aa';
                prevHex = 'e8838ce983a8';
                startHex = 'e590afe58aa8e5a4b1e4b89ae69591e6b58ee98791e794b3e8afb7';
                break;
            case 'ht':
                nextHex = '4E657874';
                prevHex = '5265746f756e656e';
                startHex = '4bc3b26d616e73652041706c696b6173796f6e20706f752042656e656669732043686f6d616a';
                break;
            case 'vi':
                nextHex = '4be1babf207469e1babf70';
                prevHex = '5472e1bb9f206ce1baa169';
                startHex = '42e1baaf7420c491e1baa77520c490c6a16e2078696e207472e1bba32063e1baa570207468e1baa574206e676869e1bb8770';
                break;
            default:
        }

        // Next buttons
        $('input[src="/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=4E657874"]')
            .attr('src', `/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=${nextHex}`)
            .hover(
                function() {
                    $(this).attr('src', `/Core/ButtonImageHandler.ashx?TemplateName=42544E4F564552&Caption=${nextHex}`)
                },
                function() {
                    $(this).attr('src', `/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=${nextHex}`)
                }
            );

        // Prev buttons
        $('input[src="/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=50726576696F7573"]')
            .attr('src', `/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=${prevHex}`)
            .hover(
                function() {
                    $(this).attr('src', `/Core/ButtonImageHandler.ashx?TemplateName=42544E4F564552&Caption=${prevHex}`)
                },
                function() {
                    $(this).attr('src', `/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=${prevHex}`)
                }
            );

        // Start button
        $('input[src="/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=53746172742074686520556E656D706C6F796D656E742042656E6566697473204170706C69636174696F6E"]')
            .attr('src', `/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=${startHex}`)
            .hover(
                function() {
                    $(this).attr('src', `/Core/ButtonImageHandler.ashx?TemplateName=42544E4F564552&Caption=${startHex}`)
                },
                function() {
                    $(this).attr('src', `/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=${startHex}`)
                }
            );
    }
}

/**
 * We are only doing Spanish and Portuguese for now until we get more images
 */
function handleButtons(lang) {
    if (lang != 'en' && (lang == 'es' || lang == 'pt')) {
        const imagesBaseUrl = 'https://cdn.jsdelivr.net/gh/massgov/uionline-translation@latest/dist/images/';

        // Next buttons
        $('input[src="/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=4E657874"]')
            .attr('src', `${imagesBaseUrl}${lang}-Next.png`)
            .hover(
                function() {
                    $(this).attr('src', `${imagesBaseUrl}${lang}-Next_hover.png`)
                },
                function() {
                    $(this).attr('src', `${imagesBaseUrl}${lang}-Next.png`)
                }
            );

        // Prev buttons
        $('input[src="/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=50726576696F7573"]')
            .attr('src', `${imagesBaseUrl}${lang}-Previous.png`)
            .hover(
                function() {
                    $(this).attr('src', `${imagesBaseUrl}${lang}-Previous_hover.png`)
                },
                function() {
                    $(this).attr('src', `${imagesBaseUrl}${lang}-Previous.png`)
                }
            );

        // Start button
        $('input[src="/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=53746172742074686520556E656D706C6F796D656E742042656E6566697473204170706C69636174696F6E"]')
            .attr('src', `${imagesBaseUrl}${lang}-Start-App.png`)
            .hover(
                function() {
                    $(this).attr('src', `${imagesBaseUrl}${lang}-Start-App_hover.png`)
                },
                function() {
                    $(this).attr('src', `${imagesBaseUrl}${lang}-Start-App.png`)
                }
            );

        // Login button
        $('input[src="/Core/ButtonImageHandler.ashx?TemplateName=42544E&Caption=4C6F67696E"]')
            .attr('src', `${imagesBaseUrl}${lang}-Login.png`)
            .hover(
                function() {
                    $(this).attr('src', `${imagesBaseUrl}${lang}-Login_hover.png`)
                },
                function() {
                    $(this).attr('src', `${imagesBaseUrl}${lang}-Login.png`)
                }
            );
    }
}

/**
 * Some standard cookie functions to add/modify/delete the chosen language
 */
function createCookie(name, value, days) {
    var expires;

    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function getTranslator(lang, onTranslationMiss) {
    return jQuery.getJSON(`${dictionaryDirectory}${lang}.json`).then((dictionary) => {
       return new Translator(dictionary, onTranslationMiss);
    });
}


function translatePage(lang) {
    const untranslated = new Map();
    const onTranslationMiss = (str) => untranslated.set(str, '');

    getTranslator(lang, onTranslationMiss).then(translator => {
        function translateElement(el) {
            if (el.nodeType === Node.TEXT_NODE) {
                const translation = translator.translate(el.textContent);
                if (translation) {
                    el.textContent = translation.replace(/\u00a0/g, " ");
                }
            }
            el.childNodes.forEach(translateElement);
        }

        // Translate strings contained in specific HTML selectors.
        document.querySelectorAll('p').forEach(translateElement);
        document.querySelectorAll('b').forEach(translateElement);
        document.querySelectorAll('label').forEach(translateElement);
        document.querySelectorAll('td').forEach(translateElement);
        document.querySelectorAll('div.sectHead').forEach(translateElement);

        // Spit out the list of strings we weren't able to translate.
        console.log(JSON.stringify(Array.from(untranslated)));
    })
}

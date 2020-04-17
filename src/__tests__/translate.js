
const Translator = require('../translate');

describe('Translate', function() {

    const translator = new Translator([
        ['Hello', 'Bonjour'],
        ['Today is @placeholder_1', 'Aujourd\'hui est @placeholder_1'],
        ['The first day of 2019 was 1/1/2019', 'The first day of 2019 was THISWASNOTPLACEHOLDERED'],
    ]);

    it('Should replace simple translated strings', () => {
        expect(translator.translate('Hello')).toEqual('Bonjour');
    })
    it('Should leave leading and trailing whitespace when considering translations', () => {
        expect(translator.translate(' Hello ')).toEqual(' Bonjour ')
    });

    it('Should extract placeholders from strings and attempt to translate the placeholdered version', () => {
        expect(translator.translate('Today is 4/17/2020')).toEqual("Aujourd'hui est 4/17/2020");
    });

    it('Should prefer non-placeholdered translations to placeholdered translations', () => {
        expect(translator.translate('The first day of 2019 was 1/1/2019')).toEqual('The first day of 2019 was THISWASNOTPLACEHOLDERED');
    });

    it('Should return boolean false for untranslated strings', () => {
       expect(translator.translate('Untranslated string')).toEqual(false);
    });

    it('Should allow a callback on untranslated strings', () => {
        const cb = jest.fn();
        const trans = new Translator([], cb);
        trans.translate('Test 4/17/2020');
        expect(cb).toHaveBeenCalledWith('Test @placeholder_1');
    });

})

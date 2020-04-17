/**
 * This translator class handles string translation.
 *
 * @type {Translator}
 */
module.exports = class Translator {
    constructor(database, onUntranslated) {
        this.database = new Map(database);
        this.onUntranslated = onUntranslated || (() => {});
        this.seenTargets = new Map();
    }
    translate(str) {
        const original = str.trim();
        if(original.length) {
            if(this.database.has(original)) {
                return str.replace(original, this.database.get(original));
            }
            const [source, placeholders] = this.placeholderize(original);
            if(this.database.has(source)) {
                this.seenTargets.set(this.database.get(source), '');
                return str.replace(original, this.deplaceholderize(this.database.get(source), placeholders))
            }
            // If this string is already translated, skip logging it as an untranslated string.
            else if(!this.seenTargets.has(source)) {
                this.onUntranslated(source);
            }
        }
        return false;
    }
    placeholderize(str) {
        let i = 0;
        const placeholders = new Map();

        const placeholdered = str.replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/, (original) => {
            const key = `@placeholder_${i + 1}`;
            i++;
            placeholders.set(key, original);
            return key;
        });
        return [placeholdered, placeholders]
    }
    deplaceholderize(str, placeholders) {
        placeholders.forEach((replacement, placeholder) => {
            str = str.replace(placeholder, replacement)
        })
        return str
    }
}

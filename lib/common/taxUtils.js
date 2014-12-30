exports.settingsKey = "taxes";
function parseSettings(rawTaxes) {
    var settings = {};
    try {
        settings = JSON.parse(rawTaxes);
    }
    catch (e) {
    }
    var taxSettings = {
        taxes: settings.taxes || [],
        active: +settings.active || 0
    };
    return taxSettings;
}
exports.parseSettings = parseSettings;
function stringifySettings(taxesInfo) {
    var taxSettings = {
        taxes: taxesInfo.taxes || [],
        active: +taxesInfo.active || 0
    };
    taxSettings.taxes = _.map(taxSettings.taxes, function (taxInfo) {
        return {
            name: taxInfo.name || "",
            rate: +taxInfo.rate || 0
        };
    }).filter(function (taxInfo) {
        return taxInfo.rate > 0;
    });
    return JSON.stringify(taxSettings);
}
exports.stringifySettings = stringifySettings;

export interface TaxSettings {
  taxes: mktransaction.TaxInfo[];
  active: number; // 0 is inactive
}

export var settingsKey = "taxes";
export function parseSettings(rawTaxes) {
  var settings: any = {};
  try {
    settings = JSON.parse(rawTaxes);
  } catch(e) {}
  var taxSettings: TaxSettings = {
    taxes: settings.taxes || [],
    active: +settings.active || 0
  };
  return taxSettings;
}

export function stringifySettings(taxesInfo) {
  var taxSettings: TaxSettings = {
    taxes: taxesInfo.taxes || [],
    active: +taxesInfo.active || 0
  };
  taxSettings.taxes = _.map(taxSettings.taxes, function(taxInfo) {
    return {
      name: taxInfo.name || "",
      rate: +taxInfo.rate || 0
    };
  }).filter(function(taxInfo) {
    return taxInfo.rate > 0;
  });
  return JSON.stringify(taxSettings);
}

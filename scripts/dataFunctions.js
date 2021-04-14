function setupDamageData(baseDamageData) {
    var ver = [];
    var current = 0;
    baseDamageData.forEach(function (v) {
        var demons = [];
        var weapons = [];
        v.demons.forEach(function (d) {
            var demonObj;
            // null values indicate the need to check previous versions, or in special cases other demons (e.g. Armored Baron inherits from Baron)
            var health = 'health' in d ? d.health : null;
            var stagger = 'stagger' in d ? d.stagger : null;
            var armor = 'armor' in d ? d.armor : null;
            // intro indicates the first appearance of a demon, which means there's no need to iterate through older versions
            var intro = 'intro' in d ? intro : false;
            var damageMap = new Map();

            if ('damageModifiers' in d) {
                d.damageModifiers.forEach(function (dmg) {
                    var dmgMods = new Map();
                    dmg.damage.forEach(function (t) {
                        dmgMods.set(t.type, 'cap' in t ? new DamageCapModifier(t.value, t.cap) : t.value);
                    });

                    damageMap.set(dmg.weaponID, dmgMods);
                });
            }

            switch (d.id) {
                case 'imp_stone':
                    var stoneDamage = new Map();
                    if ('stoneModifiers' in d) {
                        d.stoneModifiers.forEach(function (dmg) {
                            var dmgMods = new Map();
                            dmg.damage.forEach(function (t) {
                                dmgMods.set(t.type, 'cap' in t ? new DamageCapModifier(t.value, t.cap) : t.value);
                            });
                            stoneDamage.set(dmg.weaponID, dmgMods);
                        });
                    }
                    demonObj = new StoneImp(health, stagger, damageMap, stoneDamage, armor, intro);
                    break;
                case 'baron_armored':
                    if ('armorModifiers' in d) {
                        damageMap = new Map();
                        d.armorModifiers.forEach(function (dmg) {
                            var dmgMods = new Map();
                            dmg.damage.forEach(function (t) {
                                dmgMods.set(t.type, 'cap' in t ? new DamageCapModifier(t.value, t.cap) : t.value);
                            });
                            damageMap.set(dmg.weaponID, dmgMods);
                        });
                    }
                default:
                    demonObj = new Demon(d.id, health, stagger, damageMap, armor, intro);
                    break;
            }

            var str = ['id', 'health', 'stagger', 'armor', 'damageModifiers', 'stoneModifiers', 'armorModifiers'];
            var keys = Object.keys(d);
            keys.forEach(function (key) {
                var match = false;
                for (var i = 0; i < str.length; i++) {
                    if (str[i] == key) match = true;
                    break;
                }
                if (!match) demonObj.addExtraInfo(key, d[key]);
            });
            demons.push(demonObj);
        });

        v.weapons.forEach(function (w) {
            var damage = new Map();
            var pellets = 'pellets' in w ? w.pellets : 1;
            w.damage.forEach(function (dmg) {
                damage.set(dmg.type, dmg.value);
            });
            weapons.push(new Weapon(w.id, damage, pellets));
        });
        ver.push(new Version(v.id, demons, weapons, v.prev));
        if (v.id > current) current = v.id;
    });
    currentPatch = current;
    return ver;
}

function getCurrentPatch(versions) {
    var c = 0;
    var ver;
    versions.forEach(function (v) {
        if (v.id > c) {
            c = v.id;
            ver = v;
        }
    });
    return ver;
}

function getVersionFromID(versions, vID) {
    var ver = null;
    versions.forEach(function (v) {
        if (v.id == vID) ver = v;
    });
    return ver;
}
// For getting values like health/stagger/armor (stuff that isn't stored in Maps)
function getValue(demon, key, versions) {
    var current = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    if (current === null) current = getCurrentPatch(versions);
    var d = current.getDemon(demon);
    if (d === undefined) return current.prev === -1 ? null : getValue(demon, key, versions, getVersionFromID(versions, current.prev));
    var value;
    switch (key) {
        case 'health':
            value = d.hp;
            break;
        case 'stagger':
            value = d.stagger;
            break;
        case 'armor':
            value = d.armor;
            break;
        default:
            return null;
    }
    if (value === null) return d.intro ? null : getValue(demon, key, versions, getVersionFromID(versions, current.prev));
    return value;
}
function getExtraInfoValue(demon, key, versions) {
    var current = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    if (current === null) current = getCurrentPatch(versions);
    var d = current.getDemon(demon);
    if (d === undefined) return current.prev === -1 ? null : getExtraInfoValue(demon, key, versions, getVersionFromID(versions, current.prev));
    var value = d.getExtraInfo(key);
    if (value === undefined) return d.intro ? null : getExtraInfoValue(demon, key, versions, getVersionFromID(versions, current.prev));
    return value;
}
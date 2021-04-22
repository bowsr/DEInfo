class Weapon {
    constructor(weaponID, damageMap, pellets) {
        this.id = weaponID;
        this.pellets = pellets;
        var damage = damageMap;

        this.getDamageValue = function(damageType) {
            return damage.get(damageType);
        }
    }
}

class DamageCapModifier {
    constructor(damageValue, damageCap) {
        this.value = damageValue;
        this.cap = damageCap;
    }
}

class Demon {
    constructor(demonID, health, staggerHP, damageMap, armor, intro) {
        this.id = demonID;
        this.hp = health;
        this.stagger = staggerHP;
        this.armor = armor;
        this.intro = intro;
        var damageModifiers = damageMap;
        var extraInfo = new Map(); // used for misc values (e.g. boss health for doom hunters, armored baron's armorhp)

        this.getModifierList = function() {
            return damageModifiers;
        }

        this.getWeaponModifiers = function(weaponID) {
            return damageModifiers.get(weaponID);
        }

        // Will return an instance of DamageCapModifier if there's a cap associated with that damageType
        this.getSpecificModifier = function(weaponID, damageType) {
            return this.getWeaponModifiers(weaponID).get(damageType);
        }

        this.getExtraInfo = function(infoKey) {
            return extraInfo.get(infoKey);
        }
        this.addExtraInfo = function(infoKey, info) {
            extraInfo.set(infoKey, info);
        }
    }
}

class StoneImp extends Demon {
    // armor -> base mitigation value for weapons
    //          gets overridden by any modifiers in stoneModifiers
    //          gets combined with any modifiers in damageModifiers
    constructor(health, staggerHP, damageMap, stoneMap, armor, intro) {
        super('imp_stone', health, staggerHP, damageMap, armor, intro);
        var stoneModifiers = stoneMap;

        this.getStoneModifierList = function() {
            return stoneModifiers;
        }

        this.getStoneModifiers = function(weaponID) {
            return stoneModifiers.get(weaponID);
        }

        this.getSpecificStoneModifier = function(weaponID, damageType) {
            return this.getStoneModifiers(weaponID).getDamageModifier(damageType);
        }
    }
}

class Version {
    constructor(versionID, demonList, weaponList, prev) {
        this.id = versionID;
        this.prev = prev;
        var demons = demonList;
        var weapons = weaponList;

        this.getDemon = function(demonID) {
            return demons.find(demon => demon.id === demonID);
        }
        this.getWeapon = function(weaponID) {
            return weapons.find(weapon => weapon.id === weaponID);
        }
        this.getWeaponsList = function() {
            return weapons;
        }
    }
}

function setupDamageData(baseDamageData) {
    var ver = [];
    var current = 0;
    baseDamageData.forEach(v => {
        var demons = [];
        var weapons = [];
        v.demons.forEach(d => {
            var demonObj;
            // null values indicate the need to check previous versions, or in special cases other demons (e.g. Armored Baron inherits from Baron)
            var health = ('health' in d) ? d.health : null;
            var stagger = ('stagger' in d) ? d.stagger : null;
            var armor = ('armor' in d) ? d.armor : null;
            // intro indicates the first appearance of a demon, which means there's no need to iterate through older versions
            var intro = ('intro' in d) ? intro : false;
            var damageMap = new Map();

            if('damageModifiers' in d) {
                d.damageModifiers.forEach(dmg => {
                    var dmgMods = new Map();
                    dmg.damage.forEach(t => {
                        dmgMods.set(t.type, ('cap' in t) ? new DamageCapModifier(t.value, t.cap) : t.value);
                    });
                    
                    damageMap.set(dmg.weaponID, dmgMods);
                });
            }

            switch(d.id) {
                case 'imp_stone':
                    var stoneDamage = new Map();
                    if('stoneModifiers' in d) {
                        d.stoneModifiers.forEach(dmg => {
                            var dmgMods = new Map();
                            dmg.damage.forEach(t => {
                                dmgMods.set(t.type, ('cap' in t) ? new DamageCapModifier(t.value, t.cap) : t.value);
                            });
                            stoneDamage.set(dmg.weaponID, dmgMods);
                        });
                    }
                    demonObj = new StoneImp(health, stagger, damageMap, stoneDamage, armor, intro);
                    break;
                case 'baron_armored':
                    if('armorModifiers' in d) {
                        damageMap = new Map();
                        d.armorModifiers.forEach(dmg => {
                            var dmgMods = new Map();
                            dmg.damage.forEach(t => {
                                dmgMods.set(t.type, ('cap' in t) ? new DamageCapModifier(t.value, t.cap) : t.value);
                            });
                            damageMap.set(dmg.weaponID, dmgMods);
                        });
                    }
                default:
                    demonObj = new Demon(d.id, health, stagger, damageMap, armor, intro);
                    break;
            }

            const str = ['id', 'health', 'stagger', 'armor', 'intro', 'damageModifiers', 'stoneModifiers', 'armorModifiers'];
            const keys = Object.keys(d);
            keys.forEach(key => {
                var match = false;
                for(var i = 0; i < str.length; i++) {
                    if(str[i] == key) match = true;
                    break;
                }
                if(!match) demonObj.addExtraInfo(key, d[key]);
            });
            demons.push(demonObj);
        });

        v.weapons.forEach(w => {
            var damage = new Map();
            var pellets = ('pellets' in w) ? w.pellets : 1;
            w.damage.forEach(dmg => {
                damage.set(dmg.type, dmg.value);
            });
            weapons.push(new Weapon(w.id, damage, pellets));
        });
        ver.push(new Version(v.id, demons, weapons, v.prev));
    });
    return ver;
}

function getCurrentPatch(versions) {
    var c = 0;
    var ver
    versions.forEach(v => {
        if(v.id > c) {
            c = v.id;
            ver = v;
        }
    });
    return ver;
}

function getVersionFromID(versions, vID) {
    var ver = null;
    versions.forEach(v => {
        if(v.id == vID) ver = v;
    });
    return ver;
}

function getNextVersionFromPrev(versions, prevID) {
    var ver = null;
    versions.forEach(v => {
        if(v.prev == prevID) ver = v;
    });
    return ver;
}

// For getting values like health/stagger/armor (stuff that isn't stored in Maps)
function getValue(demon, key, versions, current = null) {
    if(current === null) current = getCurrentPatch(versions);
    var d = current.getDemon(demon);
    if(d === undefined) return (current.prev === -1) ? null : getValue(demon, key, versions, getVersionFromID(versions, current.prev));
    var value;
    switch(key) {
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
    if(value === null) return (d.intro) ? null : getValue(demon, key, versions, getVersionFromID(versions, current.prev));
    return value;
}

// For getting values from the extraInfo Map
function getExtraInfoValue(demon, key, versions, current = null) {
    if(current === null) current = getCurrentPatch(versions);
    var d = current.getDemon(demon);
    if(d === undefined) return (current.prev === -1) ? null : getExtraInfoValue(demon, key, versions, getVersionFromID(versions, current.prev));
    var value = d.getExtraInfo(key);
    if(value === undefined) return (d.intro) ? null : getExtraInfoValue(demon, key, versions, getVersionFromID(versions, current.prev));
    return value;
}

// For getting an array of weapons to use for their base values
// This function currently does not support updates that change base values (not likely to happen in the future since they haven't changed since release)
function getBaseWeapons(versions, weapons = null, current = null) {
    if(current === null) current = getVersionFromID(versions, 10);
    if(weapons === null) weapons = [];
    if(current.getWeaponsList().length > 0) {
        current.getWeaponsList().forEach(w => {
            if((weapons.find(weap => weap.id === w.id) === undefined)) weapons.push(w);
        });
    }
    var nextVersion = getNextVersionFromPrev(versions, current.id);
    return (nextVersion === null) ? weapons : getBaseWeapons(versions, weapons, nextVersion);
}

function getSingleBaseWeapon(weapons, id) {
    var weapon;
    weapons.forEach(w => {
        if(w.id == id) weapon = w;
    });
    return weapon;
}

function getModifiersWithVersionTarget(versions, demonID, alt = false, target = 50, current = null, modifiers = null) {
    if(current === null) {
        var vID = 10;
        // Set the versionID to start at in the case of dlc demons since they won't have data from prior versions
        switch(demonID) {
            case 'spirit':
            case 'turret':
            case 'samur':
            case 'tentacle_super':
            case 'bloodmaykr':
                vID = 31;
                break;
            case 'baron_armored':
            case 'imp_stone':
            case 'soldier_riot':
            case 'trooper':
            case 'darklord':
            case 'prowler_cursed':
            case 'screecher':
                vID = 50;
                break;
            default:
                break;
        }
        current = getVersionFromID(versions, vID);
    }
    if(modifiers === null) modifiers = new Map();
    var demon = current.getDemon(demonID);
    if(demon === undefined) {
        var next = getNextVersionFromPrev(versions, current.id);
        return (next === null) ? modifiers : getModifiersWithVersionTarget(versions, demonID, alt, target, next, modifiers);
    }
    var list;
    if(alt && (demon instanceof StoneImp)) list = demon.getStoneModifierList();
    else list = demon.getModifierList();
    if(list.size > 0) {
        list.forEach((dmg, wID) => {
            var weapon = modifiers.get(wID);
            if(weapon === undefined) modifiers.set(wID, dmg);
            else {
                var types = new Map();
                // Add existing data from previous versions
                weapon.forEach((v, t) => { types.set(t, v); });
                // Add data from current version (will overwrite old data with matching keys if it exists)
                dmg.forEach((v, t) => { types.set(t, v); });
                modifiers.set(wID, types);
            }
        });
    }
    var nextVersion = getNextVersionFromPrev(versions, current.id);
    return (nextVersion === null || current.id == target) ? modifiers : getModifiersWithVersionTarget(versions, demonID, alt, target, nextVersion, modifiers);
}

function translateID(id) {
    var name;
    switch(id) {
        // Damage Sources
        case 'shotgun':
            name = 'Combat Shotgun';
            break;
        case 'shotgun_sticky':
            name = 'Sticky Bombs';
            break;
        case 'shotgun_fullauto':
            name = 'Full Auto';
            break;
        case 'heavycannon':
            name = 'Heavy Cannon';
            break;
        case 'heavycannon_precision':
            name = 'Precision Bolt';
            break;
        case 'heavycannon_micromissiles':
            name = 'Micro Missiles';
            break;
        case 'plasma':
            name = 'Plasma Rifle';
            break;
        case 'plasma_heatblast':
            name = 'Heat Blast';
            break;
        case 'plasma_microwave':
            name = 'Microwave Beam';
            break;
        case 'rocket':
            name = 'Rocket Launcher';
            break;
        case 'rocket_remotedet':
            name = 'Remote Detonate';
            break;
        case 'rocket_lockon':
            name = 'Lock-on Burst';
            break;
        case 'supershotgun':
            name = 'Super Shotgun';
            break;
        case 'ballista':
            name = 'Ballista';
            break;
        case 'ballista_arbalest':
            name = 'Arbalest';
            break;
        case 'ballista_destroyer':
            name = 'Destroyer Blade';
            break;
        case 'chaingun':
            name = 'Chaingun';
            break;
        case 'chaingun_mobileturret':
            name = 'Mobile Turret';
            break;
        case 'chaingun_energyshield':
            name = 'Energy Shield';
            break;
        case 'bfg':
            name = 'BFG';
            break;
        case 'unmaykr':
            name = 'Unmaykr';
            break;
        case 'crucible':
            name = 'Crucible';
            break;
        case 'frag':
            name = 'Frag Grenade';
            break;
        case 'bloodpunch':
            name = 'Blood Punch';
            break;
        case 'dash':
            name = 'Dash';
            break;
        case 'punch':
            name = 'Punch';
            break;
        case 'flamebelch':
            name = 'Flame Belch';
            break;
        case 'hammer':
            name = 'Sentinel Hammer';
            break;
        // Demons
        case 'arachnotron':
            name = 'Arachnotron';
            break;
        case 'cacodemon':
            name = 'Cacodemon';
            break;
        case 'dreadknight':
            name = 'Dread Knight';
            break;
        case 'hellknight':
            name = 'Hell Knight';
            break;
        case 'mancubus':
            name = 'Mancubus';
            break;
        case 'mancubus_cyber':
            name = 'Cyber Mancubus';
            break;
        case 'painelemental':
            name = 'Pain Elemental';
            break;
        case 'pinky':
            name = 'Pinky';
            break;
        case 'pinky_spectre':
            name = 'Spectre (Pinky)';
            break;
        case 'revenant':
            name = 'Revenant';
            break;
        case 'whiplash':
            name = 'Whiplash';
            break;
        case 'tentacle':
            name = 'Tentacle';
            break;
        case 'cueball':
            name = 'Cueball';
            break;
        case 'carcass':
            name = 'Carcass';
            break;
        case 'gargoyle':
            name = 'Gargoyle';
            break;
        case 'imp':
            name = 'Imp';
            break;
        case 'lostsoul':
            name = 'Lost Soul';
            break;
        case 'prowler':
            name = 'Prowler';
            break;
        case 'soldier':
            name = 'Soldier';
            break;
        case 'soldier_shield':
            name = 'Shield Soldier';
            break;
        case 'zombie':
            name = 'Zombie';
            break;
        case 'zombie_mecha':
            name = 'Mecha-Zombie';
            break;
        case 'maykrdrone':
            name = 'Maykr Drone';
            break;
        case 'archvile':
            name = 'Archvile';
            break;
        case 'baron':
            name = 'Baron of Hell';
            break;
        case 'doomhunter':
            name = 'Doom Hunter';
            break;
        case 'marauder':
            name = 'Marauder';
            break;
        case 'marauder_wolf':
            name = 'Marauder\'s Wolf';
            break;
        case 'tyrant':
            name = 'Tyrant';
            break;
        case 'gladiator':
            name = 'Gladiator';
            break;
        case 'iconofsin':
            name = 'Icon of Sin';
            break;
        case 'khanmaykr':
            name = 'Khan Maykr';
            break;
        case 'turret':
            name = 'Turret';
            break;
        case 'spirit':
            name = 'Spirit';
            break;
        case 'tentacle_super':
            name = 'Super Tentacle';
            break;
        case 'samur':
            name = 'Samur';
            break;
        case 'baron_armored':
            name = 'Armored Baron';
            break;
        case 'prowler_cursed':
            name = 'Cursed Prowler';
            break;
        case 'soldier_riot':
            name = 'Riot Soldier';
            break;
        case 'screecher':
            name = 'Screecher Zombie';
            break;
        case 'imp_stone':
            name = 'Stone Imp';
            break;
        case 'trooper':
            name = 'Demonic Trooper';
            break;
        case 'darklord':
            name = 'The Dark Lord';
            break;
        default:
            name = 'error';
            break;
    }
    return name;
}

function translateVersionID(vID) {
    var version;
    switch(vID) {
        case 10:
            version = '1.0 (Release)';
            break;
        case 11:
            version = '1.1';
            break;
        case 21:
            version = '2.1';
            break;
        case 31:
            version = '3.1';
            break;
        case 41:
            version = '4.1';
            break;
        case 50:
            version = '5.0';
            break;
        default:
            version = null;
            break;
    }
    return version;
}


export {
    Weapon,
    DamageCapModifier,
    Demon,
    StoneImp,
    Version,
    setupDamageData,
    getValue,
    getExtraInfoValue,
    getBaseWeapons,
    getSingleBaseWeapon,
    getModifiersWithVersionTarget,
    translateID,
    translateVersionID
}
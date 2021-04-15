function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Weapon = function Weapon(weaponID, damageMap, pellets) {
    _classCallCheck(this, Weapon);

    this.id = weaponID;
    this.pellets = pellets;
    var damage = damageMap;

    this.getDamageValue = function (damageType) {
        return damage.get(damageType);
    };
};

var DamageCapModifier = function DamageCapModifier(damageValue, damageCap) {
    _classCallCheck(this, DamageCapModifier);

    this.value = damageValue;
    this.cap = damageCap;
};

var Demon = function Demon(demonID, health, staggerHP, damageMap, armor, intro) {
    _classCallCheck(this, Demon);

    this.id = demonID;
    this.hp = health;
    this.stagger = staggerHP;
    this.armor = armor;
    this.intro = intro;
    var damageModifiers = damageMap;
    var extraInfo = new Map(); // used for misc values (e.g. boss health for doom hunters, armored baron's armorhp)

    this.getWeaponModifiers = function (weaponID) {
        return damageModifiers.get(weaponID);
    };

    // Will return an instance of DamageCapModifier if there's a cap associated with that damageType
    this.getSpecificModifier = function (weaponID, damageType) {
        return this.getWeaponModifiers(weaponID).get(damageType);
    };

    this.getExtraInfo = function (infoKey) {
        return extraInfo.get(infoKey);
    };
    this.addExtraInfo = function (infoKey, info) {
        extraInfo.set(infoKey, info);
    };
};

var StoneImp = function (_Demon) {
    _inherits(StoneImp, _Demon);

    // armor -> base mitigation value for weapons
    //          gets overridden by any modifiers in stoneModifiers
    //          gets combined with any modifiers in damageModifiers
    function StoneImp(health, staggerHP, damageMap, stoneMap, armor, intro) {
        _classCallCheck(this, StoneImp);

        var _this = _possibleConstructorReturn(this, (StoneImp.__proto__ || Object.getPrototypeOf(StoneImp)).call(this, 'imp_stone', health, staggerHP, damageMap, armor, intro));

        var stoneModifiers = stoneMap;

        _this.getStoneModifiers = function (weaponID) {
            return stoneModifiers.get(weaponID);
        };

        _this.getSpecificStoneModifier = function (weaponID, damageType) {
            return this.getStoneModifiers(weaponID).getDamageModifier(damageType);
        };
        return _this;
    }

    return StoneImp;
}(Demon);

var Version = function Version(versionID, demonList, weaponList, prev) {
    _classCallCheck(this, Version);

    this.id = versionID;
    this.prev = prev;
    var demons = demonList;
    var weapons = weaponList;

    this.getDemon = function (demonID) {
        return demons.find(function (demon) {
            return demon.id === demonID;
        });
    };
    this.getWeapon = function (weaponID) {
        return weapons.find(function (weapon) {
            return weapon.id === weaponID;
        });
    };
    this.getWeaponsList = function () {
        return weapons;
    };
};
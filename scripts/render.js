var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

function getNextVersionFromPrev(versions, prevID) {
    var ver = null;
    versions.forEach(function (v) {
        if (v.prev == prevID) ver = v;
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

// For getting values from the extraInfo Map
function getExtraInfoValue(demon, key, versions) {
    var current = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    if (current === null) current = getCurrentPatch(versions);
    var d = current.getDemon(demon);
    if (d === undefined) return current.prev === -1 ? null : getExtraInfoValue(demon, key, versions, getVersionFromID(versions, current.prev));
    var value = d.getExtraInfo(key);
    if (value === undefined) return d.intro ? null : getExtraInfoValue(demon, key, versions, getVersionFromID(versions, current.prev));
    return value;
}

// For getting an array of weapons for their base values
// This function currently does not support updates that change base values (not likely to happen in the future since they haven't changed since release)
function getBaseWeapons(versions) {
    var weapons = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var current = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    if (current === null) current = getVersionFromID(versions, 10);
    if (weapons === null) weapons = [];
    if (current.getWeaponsList().length > 0) {
        current.getWeaponsList().forEach(function (w) {
            if (weapons.find(function (weap) {
                return weap.id === w.id;
            }) === undefined) weapons.push(w);
        });
    }
    var nextVersion = getNextVersionFromPrev(versions, current.id);
    return nextVersion === null ? weapons : getBaseWeapons(versions, weapons, nextVersion);
}

function getSingleBaseWeapon(weapons, id) {
    var weapon;
    weapons.forEach(function (w) {
        if (w.id == id) weapon = w;
    });
    return weapon;
}

function translateID(id) {
    var name;
    switch (id) {
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
        default:
            name = 'error';
            break;
    }
    return name;
}

function ArmoredBaron(props) {
    return React.createElement(
        'div',
        null,
        React.createElement(
            'h2',
            null,
            'Armored Baron'
        ),
        React.createElement(
            'h3',
            null,
            'Stats'
        ),
        React.createElement(
            'p',
            null,
            'Health: ',
            getValue('baron', 'health', props.versions)
        ),
        React.createElement(
            'p',
            null,
            'Stagger Threshold: ',
            getValue('baron', 'stagger', props.versions)
        ),
        React.createElement(
            'p',
            null,
            'Armor HP: ',
            getExtraInfoValue('baron_armored', 'armorHP', props.versions)
        )
    );
}

var Shotgun = function (_React$Component) {
    _inherits(Shotgun, _React$Component);

    function Shotgun(props) {
        _classCallCheck(this, Shotgun);

        var _this = _possibleConstructorReturn(this, (Shotgun.__proto__ || Object.getPrototypeOf(Shotgun)).call(this, props));

        _this.state = {
            name: translateID(weapon.id),
            pellets: weapon.pellets,
            min: getDamageValue('minimum'),
            max: getDamageValue('maximum'),
            pb: getDamageValue('pointblank')
        };
        return _this;
    }

    _createClass(Shotgun, [{
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                null,
                React.createElement(
                    'h2',
                    null,
                    this.state.name
                ),
                React.createElement(
                    'h3',
                    null,
                    'Damage Stats'
                ),
                React.createElement(
                    'p',
                    null,
                    'Pellets: ',
                    this.state.pellets
                ),
                React.createElement(
                    'p',
                    null,
                    'Minimum: ',
                    this.state.min
                ),
                React.createElement(
                    'p',
                    null,
                    'Maximum: ',
                    this.state.max
                ),
                React.createElement(
                    'p',
                    null,
                    'Point Blank: ',
                    this.state.pb
                ),
                React.createElement(
                    'p',
                    null,
                    'Total Damage (Point Blank): ',
                    this.state.pellets * this.state.pb
                )
            );
        }
    }]);

    return Shotgun;
}(React.Component);

var MainPage = function (_React$Component2) {
    _inherits(MainPage, _React$Component2);

    function MainPage(props) {
        _classCallCheck(this, MainPage);

        var _this2 = _possibleConstructorReturn(this, (MainPage.__proto__ || Object.getPrototypeOf(MainPage)).call(this, props));

        _this2.state = {
            error: null,
            isLoaded: false,
            versionList: [],
            baseWeapons: []
        };
        return _this2;
    }

    _createClass(MainPage, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            var _this3 = this;

            fetch('https://bowsr.github.io/de-info/data/damage.json').then(function (res) {
                return res.json();
            }).then(function (result) {
                _this3.setState({
                    isLoaded: true,
                    versionList: setupDamageData(result)
                });
            }, function (error) {
                _this3.setState({
                    isLoaded: true,
                    error: error
                });
            });
        }
    }, {
        key: 'render',
        value: function render() {
            var _state = this.state,
                error = _state.error,
                isLoaded = _state.isLoaded,
                versionList = _state.versionList;

            if (error) {
                return React.createElement(
                    'div',
                    null,
                    'Error: ',
                    error.message
                );
            } else if (!isLoaded) {
                return React.createElement(
                    'div',
                    null,
                    'Loading'
                );
            } else {
                var baseWeapons = getBaseWeapons(this.state.versionList);
                return (
                    //<ArmoredBaron versions={versionList} />
                    React.createElement(Shotgun, { weapon: getSingleBaseWeapon(baseWeapons, 'shotgun') })
                );
            }
        }
    }]);

    return MainPage;
}(React.Component);

var element = React.createElement(MainPage, null);

ReactDOM.render(element, document.getElementById('root'));
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

var ArmoredBaron = function (_React$Component) {
    _inherits(ArmoredBaron, _React$Component);

    function ArmoredBaron(props) {
        _classCallCheck(this, ArmoredBaron);

        var _this = _possibleConstructorReturn(this, (ArmoredBaron.__proto__ || Object.getPrototypeOf(ArmoredBaron)).call(this, props));

        _this.state = {
            error: null,
            isLoaded: false,
            versions: []
        };
        return _this;
    }

    _createClass(ArmoredBaron, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            var _this2 = this;

            fetch('https://bowsr.github.io/de-info/data/damage.json').then(function (res) {
                return res.json();
            }).then(function (result) {
                _this2.setState({
                    isLoaded: true,
                    versions: setupDamageData(result)
                });
            }, function (error) {
                _this2.setState({
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
                versions = _state.versions;

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
                var _currentPatch = getCurrentPatch(versions);
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
                        getValue('baron', 'health', versions)
                    ),
                    React.createElement(
                        'p',
                        null,
                        'Stagger Threshold: ',
                        getValue('baron', 'stagger', versions)
                    ),
                    React.createElement(
                        'p',
                        null,
                        'Armor HP: ',
                        getExtraInfoValue('baron_armored', 'armorHP', versions)
                    )
                );
            }
        }
    }]);

    return ArmoredBaron;
}(React.Component);

var element = React.createElement(ArmoredBaron, null);

ReactDOM.render(element, document.getElementById('root'));
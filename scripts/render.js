var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
                var currentPatch = getCurrentPatch(versions);
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
import React from 'react';
import ReactDOM from 'react-dom';
import { setupDamageData, getValue, getExtraInfoValue, getBaseWeapons, getSingleBaseWeapon, getModifiersWithVersionTarget, translateID, translateVersionID } from './dataHandling';

/*
function ArmoredBaron(props) {
    return (
        <div>
            <div className='objectName'>Armored Baron</div>
            <h3>Stats</h3>
            <p>Health: {getValue('baron', 'health', props.versions)}</p>
            <p>Stagger Threshold: {getValue('baron', 'stagger', props.versions)}</p>
            <p>Armor HP: {getExtraInfoValue('baron_armored', 'armorHP', props.versions)}</p>
        </div>
    );
}
*/

class ArmoredBaron extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: 'Armored Baron',
            hp: getValue('baron', 'health', props.versions),
            stagger: getValue('baron', 'stagger', props.versions),
            armor: getValue('baron_armored', 'armor', props.versions),
            armorHP: getExtraInfoValue('baron_armored', 'armorHP', props.versions),
            armorModifiers: getModifiersWithVersionTarget(props.versions, 'baron_armored', false, 50),
            modifiers: getModifiersWithVersionTarget(props.versions, 'baron', false, 50)
        };
    }

    render() {
        const { name, hp, stagger, armorHP, armorModifiers, modifiers } = this.state;
        return (
            <div>
                <h2>{name}</h2>
                <h3>Stats</h3>
                <p>Health: {hp}</p>
                <p>Stagger Threshold: {hp * stagger}</p>
                <p>Armor HP: {armorHP}</p>
                <h3>Damage against Armor</h3>
                <div>

                </div>
            </div>
        );
    }
}

class Shotgun extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: translateID(props.weapon.id),
            pellets: props.weapon.pellets,
            min: props.weapon.getDamageValue('minimum'),
            max: props.weapon.getDamageValue('maximum'),
            pb: props.weapon.getDamageValue('pointblank')
        };
    }

    render() {
        const { name, pellets, min, max, pb } = this.state;
        return (
            <div>
                <h2>{name}</h2>
                <h3>Damage Stats</h3>
                <p>Pellets: {pellets}</p>
                <p>Minimum: {min}</p>
                <p>Maximum: {max}</p>
                <p>Point Blank: {pb}</p>
                <p>Total Damage (Point Blank): {pellets * pb}</p>
            </div>
        )
    }
}

class VersionSelector extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.props.onVersionChange(event.target.value);
    }

    render() {
        var selections = [];
        this.props.versionIDs.forEach(id => {
            selections.push(<option key={id} value={id}>{translateVersionID(id)}</option>)
        });
        return (
            <select value={this.props.defaultVersion} onChange={this.handleChange}>
                {selections}
            </select>
        );
    }
}

class MainPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            versionList: [],
            current: 50
        };
    }

    componentDidMount() {
        fetch('https://bowsr.github.io/de-info/data/damage.json')
            .then(res => res.json())
            .then((result) => {
                this.setState({
                    isLoaded: true,
                    versionList: setupDamageData(result),
                });
            },
            (error) => {
                this.setState({
                    isLoaded: true,
                    error
                });
            }
        )
    }

    handleVersionChange(value) {
        this.setState({version: value});
    }

    render() {
        const { error, isLoaded, versionList, current } = this.state;
        if(error) {
            return <div>Error: {error.message}</div>
        }else if(!isLoaded) {
            return <div>Loading</div>
        }else {
            var baseWeapons = getBaseWeapons(versionList);
            var versionIDList = [];
            versionList.forEach(v => {
                versionIDList.push(v.id);
            });
            versionIDList.sort((a, b) => b - a);
            return (
                <div>
                    <div>Selected Version: {current}</div>
                    <VersionSelector defaultVersion={current} versionIDs={versionIDList} onVersionChange={this.handleVersionChange} />
                    <ArmoredBaron versions={versionList} />
                    {/* <Shotgun weapon={getSingleBaseWeapon(baseWeapons, 'shotgun')} /> */}
                </div>
            );
        }
    }
}

const element = <MainPage />;

ReactDOM.render(element, document.getElementById('root'));
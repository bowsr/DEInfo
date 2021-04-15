import React from 'react';
import ReactDOM from 'react-dom';
// import { Weapon, DamageCapModifier, Demon, StoneImp, Version } from './dataHandling';
import { setupDamageData, getValue, getExtraInfoValue, getBaseWeapons, getSingleBaseWeapon, translateID } from './dataHandling';


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

class Shotgun extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: translateID(props.weapon.id),
            pellets: props.weapon.pellets,
            min: props.weapon.getDamageValue('minimum'),
            max: props.weapon.getDamageValue('maximum'),
            pb: props.weapon.getDamageValue('pointblank'),
        }
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

class MainPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            versionList: []
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

    render() {
        const { error, isLoaded, versionList } = this.state;
        if(error) {
            return <div>Error: {error.message}</div>
        }else if(!isLoaded) {
            return <div>Loading</div>
        }else {
            var baseWeapons = getBaseWeapons(versionList);
            return (
                //<ArmoredBaron versions={versionList} />
                <Shotgun weapon={getSingleBaseWeapon(baseWeapons, 'shotgun')} />
            );
        }
    }
}

const element = <MainPage />;

ReactDOM.render(element, document.getElementById('root'));
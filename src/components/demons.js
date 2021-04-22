import React from 'react';
import { getValue, getExtraInfoValue, getModifiersWithVersionTarget, translateID, translateVersionID } from '../data/dataHandling';

function DemonBaseInfo(props) {
    var name = translateID(props.demonID);
    var hp = getValue(props.demonID, 'health', props.versions, props.target);
    var stagger = Math.trunc(hp * getValue(props.demonID, 'stagger', props.versions, props.target));
    return (
        <div>
            <h2>{name}</h2>
            <h3>Stats</h3>
            <p>Health: {hp}</p>
            <p>Stagger Threshold: {stagger}</p>
        </div>
    )
}

function DemonDamageModifiers(props) {

}

function LowVersionWarning(props) {
    if(props.target >= props.intro) return (<div></div>);
    return (
        <div>
            <div className='lowVersionWarning'>Data does not exist for the version you selected ({translateVersionID(props.target)})</div>
            <div className='lowVersionWarning'>Showing data for version {translateVersionID(props.intro)} instead</div>
        </div>
    )
}

class ArmoredBaron extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            armorHP: getExtraInfoValue('baron_armored', 'armorHP', this.props.versions),
            armorModifiers: getModifiersWithVersionTarget(this.props.versions, 'baron_armored', false, 50),
            modifiers: getModifiersWithVersionTarget(this.props.versions, 'baron', false, 50),
            intro: 50
        };
    }

    render() {
        const { name, hp, stagger, armorHP, armorModifiers, modifiers, intro } = this.state;
        const selectedVersion = (this.props.selectedVersion < intro) ? intro : this.props.selectedVersion;
        return (
            <div>
                <LowVersionWarning target={this.props.selectedVersion} intro={intro} />
                <DemonBaseInfo demonID={'baron_armored'} versions={this.props.versions} target={selectedVersion} />
                <p>Armor HP: {armorHP}</p>
                <h3>Damage against Armor</h3>
                <div>

                </div>
            </div>
        );
    }
}

export {
    ArmoredBaron
}
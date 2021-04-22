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
            <select value={this.props.selectedVersion} onChange={this.handleChange}>
                {selections}
            </select>
        );
    }
}

export {
    VersionSelector
}
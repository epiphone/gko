/** @jsx React.DOM */

/**
 * TIEA212 GKO Viikkotehtävä 1 - Canasta-korttipelin pistelaskuohjelma
 * Aleksi Pekkala (aleksi.v.a.pekkala@student.jyu.fi)
 * 29.1.2014
 */

var ScoreList = React.createClass({
  /** Invoked whenever a score field value changes. */
  handleRoundUpdate: function(key, c1, b1, c2, b2) {
    var rounds = this.state.rounds;
    var params = [c1, b1, c2, b2];
    var noNullValues = params.every(function(d) { return d !== null; });

    if (key == rounds.length - 1 && noNullValues) {
      rounds.push({}); // Add a new round.
    }
    else {
      rounds[key] = {c1: c1, b1: b1, c2: c2, b2: b2}; // Update an existing round.
    }

    this.setState({rounds: rounds});
  },

  getInitialState: function() {
    return {rounds: [{}]};
  },

  render: function() {
    var totals = [0, 0];
    var key = 0;

    var roundNodes = this.state.rounds.map(function(round) {
      totals[0] += round.c1 + round.b1;
      totals[1] += round.c2 + round.b2;
      $.extend(round, {t1: totals[0], t2: totals[1]});
      return (
        <ScoreForm key={key++} round={round} onRoundUpdate={this.handleRoundUpdate}/>
      );
    }, this)

    return (
      <div>
        {roundNodes}
      </div>
    );
  }
});


var ScoreForm = React.createClass({
  handleInput: function(event) {
    if (event.target.value.length == 0) {
      return false;
    }
    var c1 = Utils.parseInt(this.refs.c1.getDOMNode().value);
    var b1 = Utils.parseInt(this.refs.b1.getDOMNode().value);
    var c2 = Utils.parseInt(this.refs.c2.getDOMNode().value);
    var b2 = Utils.parseInt(this.refs.b2.getDOMNode().value);
    this.props.onRoundUpdate(this.props.key, c1, b1, c2, b2);
  },

  /** Invoked after component has been rendered. */
  componentDidMount: function() {
    this.refs.c1.getDOMNode().focus();
  },

  render: function() {
    return (
      <div>
        Jako {this.props.key + 1} NIMI
        <table>
          <tr>
            <td></td>
            <td><strong>Puolue 1</strong></td>
            <td><strong>Puolue 2</strong></td>
          </tr>
          <tr>
            <td><strong>Bonus</strong></td>
            <td><input type="text" ref="c1" value={this.props.round.c1} onBlur={this.handleInput}/></td>
            <td><input type="text" ref="c2" value={this.props.round.c2} onBlur={this.handleInput}/></td>
          </tr>
          <tr>
            <td><strong>Kortti</strong></td>
            <td><input type="text" ref="b1" value={this.props.round.b1} onBlur={this.handleInput}/></td>
            <td><input type="text" ref="b2" value={this.props.round.b2} onBlur={this.handleInput}/></td>
          </tr>
          <tr>
            <td><strong>Yhteensä</strong></td>
            <td>{this.props.round.t1}</td>
            <td>{this.props.round.t2}</td>
          </tr>
        </table>
      </div>
    );
  }
});


React.renderComponent(
  <ScoreList players={["aleksi", "maleksi", "timo", "simo"]}/>,
  document.getElementById('content')
);
/** @jsx React.DOM */
"use strict";

/**
 * TIEA212 GKO Viikkotehtävä 1 - Canasta-korttipelin pistelaskuohjelma
 * Aleksi Pekkala (aleksi.v.a.pekkala@student.jyu.fi)
 * 29.1.2014
 */


var Utils = {
  /** Maps an integer into a timer string, e.g. 90 --> "00:01:30" */
  secondsToTimerStr: function(seconds) {
    var times = [seconds / 3600, seconds / 60, seconds];
    return times.map(function(d) {
      var str = (Math.floor(d) % 60).toString();
      return str.length === 1 ? "0" + str : str;
    }).join(":");
  },

  /** A hack to prompt browser to save a file; file type can't be set. */
  promptSaveFile: function(content) {
    location.href = "data:application/octet-stream," + encodeURIComponent(content);
  }
};


/**
 * A mixin that provides a setInterval function which will get
 * cleaned up when the component is destroyed.
 * Adapted from http://facebook.github.io/react/docs/reusable-components
 */
var SetIntervalMixin = {
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },

  clearAllIntervals: function() {
    this.intervals.map(clearInterval);
    this.intervals = [];
  },

  /** Invoked when component is initialized. */
  componentWillMount: function() {
    this.intervals = [];
  },

  /** Invoked when component is destroyed. */
  componentWillUnmount: function() {
    this.clearAllIntervals();
  }
};


// Linting is disabled because React uses a special JSX syntax.
/* jshint ignore:start */

/**
 * The parent component.
 */
var ScoreContainer = React.createClass({

  /**
   * Update the given round, possibly insert a new round and
   * check for game over.
   *
   * @param {number} index  Round index.
   * @param {object} scores Object with round scores: c1, b1, c2 and b2.
   */
  handleRoundUpdate: function(index, scores) {
    var state = this.state;
    var props = ["c1", "b1", "c2", "b2"];
    var totals = {t1: 0, t2: 0};

    state.rounds = state.rounds.map(function(round) {
      if (round.index === index) {
        $.extend(round, scores);
      }

      var parsed = {};
      props.forEach(function(prop) {
        var val = round[prop];
        parsed[prop] = val ? (parseInt(val.trim()) || 0) : 0;
      });

      totals.t1 += parsed.c1 + parsed.b1;
      totals.t2 += parsed.c2 + parsed.b2;
      return $.extend(round, totals);
    });

    if (!state.gameOver) {

      if (totals.t1 >= 5000 || totals.t2 >= 5000) {
        state.gameOver = true;
      }
      else
      {
        var noEmptyValues = props.every(function(prop) {
          return scores[prop].length > 0;
        });

        if (index === state.rounds[state.rounds.length-1].index && noEmptyValues) {
          state.rounds.push({index: index + 1, t1: 0, t2: 0});
        }
      }
    }

    this.setState(state);
  },

  startNewGame: function() {
    var players = [];
    for (var i = 1; i <= 4; i++) {
      players.push(this.refs["p" + i].getDOMNode().value);
    };

    var blankRound = {index: 0, t1: 0, t2: 0, c1: "", b1: "", c2: "", b2: ""};

    this.setState({gameOver: false, players: players, rounds: [blankRound]});

    this.state.rounds.map(function(round) {
      var elem = this.refs["sf"+round.index].reset();
    }, this);
  },

  saveResults: function() {
    if (!this.state.gameOver) {
      alert("Keskeneräistä peliä ei voida tallentaa.");
      return;
    }

    var finalRound;
    var rounds = this.state.rounds.map(function(round) {
      finalRound = round;
      return "Jako " + (round.index + 1) + " Puolue 1: " + round.t1 + " Puolue 2: " + round.t2;
    });

    var ps = this.state.players;
    var teams = [
      "Puolue 1 (" + ps[0] + ", " + ps[2] + ")",
      "Puolue 2 (" + ps[1] + ", " + ps[3] + ")"
    ];
    if (finalRound.t1 > finalRound.t2) {
      teams[0] = teams[0] + " VOITTAJA";
    } else {
      teams[1] = teams[1] + " VOITTAJA";
    }

    var content = teams.concat(rounds).join("\n");
    Utils.promptSaveFile(content);
  },

  getInitialState: function() {
    return {rounds: [], gameOver: false};
  },

  render: function() {
    var players = this.state.players;
    var roundNodes = this.state.rounds.map(function(round) {
      var player = players[round.index % players.length];
      return (
        <ScoreForm ref={"sf" + round.index} player={player} round={round} onRoundUpdate={this.handleRoundUpdate}
        gameOver={this.state.gameOver}/>
      );
    }, this);

    var saveBtn = null;
    if (this.state.gameOver) {
      saveBtn = <input type="button" onClick={this.saveResults} value="Tallenna" />
    };

    return (
      <div>
        <fieldset>
          <legend>Puolue 1</legend>
          <label>Pelaaja 1 <input type="text" ref="p1"/></label>
          <label>Pelaaja 3 <input type="text" ref="p3"/></label>
        </fieldset>
        <fieldset>
          <legend>Puolue 2</legend>
          <label>Pelaaja 2 <input type="text" ref="p2"/></label>
          <label>Pelaaja 4 <input type="text" ref="p4"/></label>
        </fieldset>
        <input type="button" onClick={this.startNewGame} value="Aloita peli"/>
        {saveBtn}
        <div>
          {roundNodes}
        </div>
      </div>
    );
  }
});


/**
 * Form with 4 input fields, a timer and a total score display.
 */
var ScoreForm = React.createClass({

  mixins: [SetIntervalMixin],

  /** Parses integer values, invokes parent event handler. */
  handleSubmit: function(event) {
    if (event.target.value.length == 0) {
      return;
    }

    var scores = {};
    var params = ["c1", "b1", "c2", "b2"];
    var noEmptyValues = true;

    params.forEach(function(param) {
      var val = this.refs[param].getValue();

      if (val.length === 0) {
        noEmptyValues = false;
      }
      scores[param] = val;
    }.bind(this));

    if (noEmptyValues && this.intervals.length > 0) {
      this.clearAllIntervals(); // Stop counting.
    }

    this.props.onRoundUpdate(this.props.round.index, scores);
  },

  /** Clear form, reset state and start timer. */
  reset: function() {
    this.replaceState(this.getInitialState());
    Object.keys(this.refs).map(function(ref) {
      this.refs[ref].reset();
    }, this);

    if (this.intervals.length === 0) {
      this.setInterval(function() {
        this.setState({seconds: this.state.seconds + 1});
      }.bind(this), 1000);
    }
  },

  getInitialState: function() {
    return {seconds: 0, player1Class: null, player2Class: null, scores: {}};
  },

  /** If game over, highlight winning score and stop timer. */
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.gameOver) {
      var state = this.state;
      state.player1Class = nextProps.round.t1 > nextProps.round.t2 ? "highlight": null;
      state.player2Class = !state.player1Class ? "highlight" : null;
      this.setState(state);
      this.clearAllIntervals();
    }
  },

  /** Invoked after rendering; start timer. */
  componentDidMount: function() {
    this.setInterval(function() {
      this.setState({seconds: this.state.seconds + 1});
    }.bind(this), 1000);
  },

  render: function() {
    var validator = /^\s*[0-9]+\s*$/;
    var displayTime = Utils.secondsToTimerStr(this.state.seconds);

    return (
      <div>
        <p>Jako {this.props.round.index + 1} ({this.props.player})</p>
        <table>
          <tr>
            <td></td>
            <td><strong>Puolue 1</strong></td>
            <td><strong>Puolue 2</strong></td>
          </tr>
          <tr>
            <td><strong>Bonus</strong></td>
            <td><ValidatorInput validator={validator} ref="c1" onBlur={this.handleSubmit} autoFocus/></td>
            <td><ValidatorInput validator={validator} ref="c2" onBlur={this.handleSubmit}/></td>
          </tr>
          <tr>
            <td><strong>Kortti</strong></td>
            <td><ValidatorInput validator={validator} ref="b1" onBlur={this.handleSubmit}/></td>
            <td><ValidatorInput validator={validator} ref="b2" onBlur={this.handleSubmit}/></td>
          </tr>
          <tr>
            <td><strong>{displayTime}</strong></td>
            <td className={this.state.player1Class}>{this.props.round.t1}</td>
            <td className={this.state.player2Class}>{this.props.round.t2}</td>
          </tr>
        </table>
      </div>
    );
  }
});


/**
 * A input field that changes color when its value is invalid.
 */
var ValidatorInput = React.createClass({

  /** Helper for accessing input value - parent can use this also. */
  getValue: function() {
    return this.getDOMNode().value;
  },

  handleChange: function(event) {
    var value = event.target.value;
    var isValid = this.props.validator.test(value);

    this.setState({value: value, isValid: isValid});
  },

  getInitialState: function() {
    return {value: "", isValid: true};
  },

  reset: function() {
    this.setState({value: "", isValid: true});
  },

  render: function() {
    return this.transferPropsTo(
      <input type="text" ref="input" value={this.state.value} onChange={this.handleChange}
      className={this.state.isValid ? null : "invalid"}/>
    );
  }
});


React.renderComponent(
  <ScoreContainer/>,
  document.getElementById('content')
);

/** jshint ignore:end */
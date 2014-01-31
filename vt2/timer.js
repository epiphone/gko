/** @jsx React.DOM */
"use strict";

/**
 * TIEA212 GKO Viikkotehtävä 2 - Keittiöajastinohjelma
 * Aleksi Pekkala (aleksi.v.a.pekkala@student.jyu.fi)
 * 31.1.2014
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

  /**
   * Maps a timer string into an integer, e.g. "00:01:30" --> 90
   * @param  {string}  time Time in the form "hh:mm:ss", maximum is "24:00:00".
   * @return {?number}      Time in seconds, or null if parsing failed.
   */
  timerStrToSeconds: function(time) {
    time = time.trim();
    var regex = /^([01]?[0-9]|2[0-3]):([0-5]?\d):([0-5]?\d)$/;
    var res = time.match(regex);

    if (!res || res.length !== 4) {
      if (/^24:0{1,2}:0{1,2}$/.test(time)) { // Test for "24:00:00"
        return 24 * 60 * 60;
      }
      return null;
    }

    return parseInt(res[1])*3600 + parseInt(res[2])*60 + parseInt(res[3]);
  }
};




// Linting is disabled because React uses a special JSX syntax.
/* jshint ignore:start */

/**
 * The uppermost parent component.
 */
var TimerContainer = React.createClass({

  /** Invoked by the timer component, once per second. */
  handleTick: function(secondsLeft) {
    this.setState({secondsLeft: secondsLeft});
  },

  /** Invoked by the timer component upon expiry. */
  handleExpiry: function() {
    this.setState({timerIsRunning: false});
    alert("Aika loppui!");
  },

  handleTimerStart: function() {
    this.setState({timerIsRunning: true});
    this.refs.timer.start();
  },

  handleTimerStop: function() {
    this.setState({timerIsRunning: false});
    this.refs.timer.stop();
  },

  /** Parse time from input field, start timer or stopwatch. */
  handleTimerReset: function() {
    var seconds = Utils.timerStrToSeconds(this.refs.input.getValue());
    if (seconds !== null) {
      this.refs.timer.setTime(seconds);
      this.setState({secondsLeft: seconds});

      if (seconds === 0) {
        console.log("stopwatch mode"); // TODO
      }
    }
  },

  /** Invoked after rendering. */
  componentDidMount: function() {
    this.refs.timer.setTime(this.state.secondsLeft);
  },

  getInitialState: function() {
    return {timerIsRunning: false, secondsLeft: 90};
  },

  render: function() {
    var timerToggleBtn = null;
    if (this.state.timerIsRunning) {
      timerToggleBtn = <button onClick={this.handleTimerStop}>Stop</button>
    } else {
      timerToggleBtn = <button onClick={this.handleTimerStart}>Start</button>
    }

    return (
      <div className="timer-container">
        <Timer ref="timer" onTick={this.handleTick} onExpiry={this.handleExpiry} />

        <div>{Utils.secondsToTimerStr(this.state.secondsLeft)}</div>

        <div>
          {timerToggleBtn}
        </div>

        <ValidatorInput ref="input" validator={Utils.timerStrToSeconds}
        errorMsg="Syötä aika muodossa hh:mm:ss!" invalidClass="invalid" placeholder="00:01:30"/>

        <div>
          <button onClick={this.handleTimerReset}>Reset</button>
        </div>
      </div>
    );
  }
});


/**
 * A timer component.
 *
 * Component renders a hidden <span> element; this is a workaround for
 * React not actually supporting non-graphical components.
 */
var Timer = React.createClass({

  mixins: [SetIntervalMixin],

  isRunning: function() {
    return this.intervals.length > 0;
  },

  getTime: function() {
    return this.state.secondsLeft;
  },

  setTime: function(seconds) {
    this.setState({secondsLeft: seconds});
  },

  start: function() {
    if (this.getTime() > 0) {
      this.setInterval(this.tick, 1000);
    } else {
      this.props.onExpiry();
    }
  },

  stop: function() {
    this.clearAllIntervals();
  },

  tick: function() {
    this.setState({secondsLeft: this.state.secondsLeft - 1});

    if (this.getTime() > -1) {
      this.props.onTick(this.state.secondsLeft);
    } else {
      this.clearAllIntervals();
      this.props.onExpiry();
    }
  },

  getInitialState: function() {
    return {secondsLeft: 0};
  },

  render: function() {
    return <span style={{display: "none"}}/>;
  }
});




React.renderComponent(
  <TimerContainer/>,
  document.getElementById('content')
);

/** jshint ignore:end */
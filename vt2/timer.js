/** @jsx React.DOM */
"use strict";

/**
 * TIEA212 GKO Viikkotehtävä 2 - Keittiöajastinohjelma
 * Aleksi Pekkala (aleksi.v.a.pekkala@student.jyu.fi)
 * 6.2.2014
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
  handleTickEvent: function(seconds) {
    this.setState({seconds: seconds});
  },

  /** Invoked by the timer component upon expiry. */
  handleExpireEvent: function() {
    this.setState({timerIsRunning: false});
    alert("Aika loppui!");
  },

  handleSplitEvent: function(splitSeconds) {
    var splits = this.state.splits;
    this.setState({splits: splits.concat(splitSeconds)});
  },

  handleIdleOverEvent: function(idleTime) {
    console.log("Caught IdleOver event, idle lasted for " + idleTime + "s");
  },

  handleTimingOverEvent: function(timingTime) {
    console.log("Caught TimingOver event, timing lasted for " + timingTime + "s");
  },

  handleTimerStart: function() {
    this.setState({timerIsRunning: true});
    this.refs.timer.start();
  },

  handleTimerStop: function() {
    this.setState({timerIsRunning: false});
    this.refs.timer.stop();
  },

  /** Parse time from input field, clear splits, start timer or stopwatch. */
  handleTimerReset: function() {
    var seconds = Utils.timerStrToSeconds(this.refs.input.getValue());
    var stopwatchMode = !seconds;

    if (seconds !== null) {
      this.refs.timer.resetTime(seconds);
      this.setState({
        seconds: seconds,
        stopwatchMode: stopwatchMode,
        splits: []
      });
    }
  },

  /** Stop timing, set time to zero, clear splits, start stopwatch mode. */
  handleTimerHardReset: function() {
    this.refs.timer.hardReset();
    this.setState({
      seconds: 0,
      timerIsRunning: false,
      stopwatchMode: true,
      splits: []
    });
  },

  handleTimerSplit: function() {
    this.refs.timer.split();
  },

  /** Invoked after rendering. */
  componentDidMount: function() {
    this.refs.timer.resetTime(this.state.seconds);
  },

  getInitialState: function() {
    return {
      timerIsRunning: false,
      seconds: 90,
      stopwatchMode: false,
      splits: []
    };
  },

  render: function() {
    var timerToggleBtn = null;
    if (this.state.timerIsRunning) {
      var toggleBtnText = this.state.stopwatchMode ? "Tauko" : "Stop";
      timerToggleBtn = <button onClick={this.handleTimerStop}>{toggleBtnText}</button>;
    } else {
      timerToggleBtn = <button onClick={this.handleTimerStart}>Start</button>;
    }

    var splitsBtn = null;
    var splitsList = null;

    if (this.state.stopwatchMode) {
      var splitsBtnDisabled = this.state.timerIsRunning ? "" : "disabled";
      splitsBtn = (
        <button disabled={splitsBtnDisabled} onClick={this.handleTimerSplit}>
          Väliaika
        </button>);

      var splits = this.state.splits.map(function(split) {
        return <li>{Utils.secondsToTimerStr(split)}</li>;
      });

      splitsList = <ul className="splits-list">{splits}</ul>;
    }

    return (
      <div className="timer-container">
        <Timer ref="timer" onTick={this.handleTickEvent} onExpiry={this.handleExpireEvent}
        onSplit={this.handleSplitEvent} onIdleOver={this.handleIdleOverEvent}
        onTimingOver={this.handleTimingOverEvent}/>

        <div>{Utils.secondsToTimerStr(this.state.seconds)}</div>

        <div>
          {timerToggleBtn}
        </div>

        <ValidatorInput ref="input" validator={Utils.timerStrToSeconds}
        errorMsg="Syötä aika muodossa hh:mm:ss!" invalidClass="invalid" placeholder="00:01:30"/>

        <div>
          <button onClick={this.handleTimerReset}>Reset</button>
        </div>
        <div>
          <button onClick={this.handleTimerHardReset}>Nollaa</button>
        </div>
        <div>
          {splitsBtn}
        </div>
        {splitsList}
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
    return this.state.timing;
  },

  isStopwatchMode: function() {
    return this.state.startTime === 0;
  },

  getTime: function() {
    return this.state.seconds;
  },

  getSecondsElapsed: function() {
    if (this.isStopwatchMode()) {
      return this.state.seconds;
    }
    return this.state.startTime - this.state.seconds;
  },

  getSplits: function() {
    return this.state.splits;
  },

  getTimesToggled: function() {
    return this.state.timesToggled;
  },

  resetTime: function(seconds) {
    this.setState({seconds: seconds, startTime: seconds, timesToggled: 0});
  },

  start: function() {
    this.props.onIdleOver(this.state.timedOrIdledFor);

    this.setState({
      timing: true,
      timedOrIdledFor: 0,
      timesToggled: this.state.timesToggled + 1
    });
  },

  stop: function() {
    this.props.onTimingOver(this.state.timedOrIdledFor);

    this.setState({
      timing: false,
      timedOrIdledFor: 0,
      timesToggled: this.state.timesToggled + 1
    });
  },

  split: function() {
    var splits = this.state.splits;
    var seconds = this.state.seconds;
    this.setState({splits: splits.concat(seconds)});
    this.props.onSplit(seconds);
  },

  hardReset: function() {
    this.stop();
    this.setState({
      seconds: 0,
      startTime: 0,
      splits: [],
      timesToggled: 0
    });
  },

  tick: function() {
    var timedOrIdledFor = this.state.timedOrIdledFor;
    this.setState({timedOrIdledFor: ++timedOrIdledFor});

    if (this.state.timing) {
      var increment = this.isStopwatchMode() ? 1 : -1;
      var newTime = this.getTime() + increment;

      if (newTime > -1) {
        this.setState({seconds: this.state.seconds + increment});
        this.props.onTick(this.state.seconds);
      } else {
        this.stop();
        this.props.onExpiry();
      }
    }
  },

  componentDidMount: function() {
    this.setInterval(this.tick, 1000);
  },

  getInitialState: function() {
    return {
      timing: false,        // Is timer running
      seconds: 0,           // Current time elapsed in seconds
      splits: [],           // List of splits
      startTime: 0,         // Starting time, 0 if in stopwatch mode
      timedOrIdledFor: 0,   // How many seconds current timing or pause has lasted
      timesToggled: 0       // How many times timer has been started/stopped
    };
  },

  render: function() {
    return <span style={{display: "none"}}/>;
  }
});



React.renderComponent(
  <TimerContainer/>,
  document.getElementById("content")
);

/** jshint ignore:end */